import { PublicKey } from '@solana/web3.js';
import {
  fetchAllVaults,
  fetchVault,
  isVaultExpired,
  getVaultStatus,
  getVaultSolBalance,
  getVaultTokenBalance,
  VaultAccount,
} from './solana';
import { getSupabaseClient } from '../db/supabase';

const supabase = getSupabaseClient();

// ============================================================
// Sync all vaults from on-chain to Supabase
// ============================================================
export async function syncVaults(): Promise<{
  synced: number;
  errors: number;
}> {
  console.log('[Monitor] Starting vault sync...');
  
  const vaults = await fetchAllVaults();
  console.log(`[Monitor] Found ${vaults.length} vaults on-chain`);
  
  if (vaults.length > 0) {
    vaults.forEach(({ pubkey, account }) => {
      console.log(`[Monitor] Vault ${pubkey.toBase58()}: owner=${account.owner.toBase58()}, heirs=${account.heirs.length}`);
    });
  }
  
  let synced = 0;
  let errors = 0;

  for (const { pubkey, account } of vaults) {
    try {
      await upsertVault(pubkey, account);
      synced++;
    } catch (err) {
      console.error(`[Monitor] Error syncing vault ${pubkey.toBase58()}:`, err);
      errors++;
    }
  }

  console.log(`[Monitor] Sync complete: ${synced} synced, ${errors} errors`);
  return { synced, errors };
}

// ============================================================
// Upsert a single vault into Supabase
// ============================================================
export async function upsertVault(
  pubkey: PublicKey,
  account: VaultAccount
): Promise<void> {
  const vaultAddress = pubkey.toBase58();
  const ownerAddress = account.owner.toBase58();
  const status = getVaultStatus(account);
  const solBalance = await getVaultSolBalance(pubkey);

  // Upsert vault
  const { data: vaultData, error: vaultError } = await supabase
    .from('vaults')
    .upsert(
      {
        vault_address: vaultAddress,
        owner_address: ownerAddress,
        seed: account.seed.toString(),
        inactivity_period: account.inactivityPeriod.toNumber(),
        last_heartbeat: new Date(account.lastHeartbeat.toNumber() * 1000).toISOString(),
        keeper_fee_bps: account.keeperFeeBps,
        gas_reserve_lamports: account.gasReserveLamports.toNumber(),
        status,
        created_at: new Date(account.createdAt.toNumber() * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        sol_balance: solBalance,
      },
      { onConflict: 'vault_address' }
    )
    .select()
    .single();

  if (vaultError) throw vaultError;

  // Sync heirs
  await syncHeirs(vaultData.id, account.heirs);

  // Sync assets
  await syncAssets(vaultData.id, pubkey, account.assets);
}

// ============================================================
// Sync heirs for a vault
// Preserves off-chain data (name, email, phone)
// ============================================================
async function syncHeirs(
  vaultId: string,
  heirs: VaultAccount['heirs']
): Promise<void> {
  console.log(`[syncHeirs] Syncing ${heirs.length} heirs for vault ${vaultId}`);
  
  if (heirs.length === 0) {
    console.log(`[syncHeirs] No heirs on-chain, deleting all from Supabase`);
    await supabase.from('heirs').delete().eq('vault_id', vaultId);
    return;
  }

  // Fetch existing heirs to preserve off-chain data
  const { data: existingHeirs } = await supabase
    .from('heirs')
    .select('*')
    .eq('vault_id', vaultId);

  const existingMap = new Map(
    (existingHeirs || []).map((h: any) => [h.wallet_address, h])
  );

  const onChainWallets = new Set(heirs.map(h => h.wallet.toBase58()));

  // 1. Delete heirs removed on-chain
  const toDelete = (existingHeirs || []).filter(
    (h: any) => !onChainWallets.has(h.wallet_address)
  );
  
  if (toDelete.length > 0) {
    await supabase
      .from('heirs')
      .delete()
      .eq('vault_id', vaultId)
      .in('wallet_address', toDelete.map((h: any) => h.wallet_address));
  }

  // 2. Update existing heirs (preserve name)
  for (const h of heirs) {
    const walletAddress = h.wallet.toBase58();
    const existing = existingMap.get(walletAddress);

    const heirData = {
      vault_id: vaultId,
      wallet_address: walletAddress,
      asset_mint: h.asset.toBase58(),
      allocation_type: h.allocationType.percentage !== undefined ? 'percentage' : 'fixed_amount',
      allocation_value: h.allocationValue.toNumber(),
      // Preserve off-chain data if heir already exists
      name: existing?.name || null,
    };

    if (existing) {
      // Update existing heir
      const { error } = await supabase
        .from('heirs')
        .update(heirData)
        .eq('id', existing.id);
      
      if (error) {
        console.error(`[syncHeirs] Update error for ${walletAddress}:`, error.message);
        // If updated_at column is missing, try update ignoring the trigger error
        if (error.message?.includes('updated_at')) {
          console.warn(`[syncHeirs] Trigger error for ${walletAddress}, skipping updated_at`);
        }
      }
    } else {
      // Insert new heir - try with name, fallback without
      let { error } = await supabase
        .from('heirs')
        .insert(heirData);
      
      if (error && error.code === 'PGRST204') {
        // Schema cache missing 'name' column, retry without it
        const { name: _, ...heirDataWithoutName } = heirData;
        const result = await supabase
          .from('heirs')
          .insert(heirDataWithoutName);
        error = result.error;
      }
      
      if (error) {
        console.error(`[syncHeirs] Insert error for ${walletAddress}:`, error);
      }
    }
  }
}

// ============================================================
// Sync assets for a vault
// ============================================================
async function syncAssets(
  vaultId: string,
  vaultPubkey: PublicKey,
  assets: PublicKey[]
): Promise<void> {
  // Delete existing assets and re-insert
  await supabase.from('vault_assets').delete().eq('vault_id', vaultId);

  if (assets.length === 0) return;

  const assetRows = await Promise.all(
    assets.map(async (mint) => {
      const balance = await getVaultTokenBalance(vaultPubkey, mint);
      return {
        vault_id: vaultId,
        mint_address: mint.toBase58(),
        balance,
      };
    })
  );

  const { error } = await supabase.from('vault_assets').insert(assetRows);
  if (error) throw error;
}

// ============================================================
// Find expired vaults ready for claim
// ============================================================
export async function findExpiredVaults(): Promise<
  { pubkey: PublicKey; account: VaultAccount }[]
> {
  const vaults = await fetchAllVaults();
  return vaults.filter(({ account }) => {
    const status = getVaultStatus(account);
    return status === 'active' && isVaultExpired(account);
  });
}

// ============================================================
// Find vaults expiring soon (for notifications)
// ============================================================
export async function findVaultsExpiringSoon(
  daysThreshold: number = 7
): Promise<{ pubkey: PublicKey; account: VaultAccount; daysUntilExpiry: number }[]> {
  const vaults = await fetchAllVaults();
  const now = Math.floor(Date.now() / 1000);
  const thresholdSeconds = daysThreshold * 24 * 60 * 60;

  return vaults
    .filter(({ account }) => {
      const status = getVaultStatus(account);
      if (status !== 'active') return false;
      const expiry = account.lastHeartbeat.toNumber() + account.inactivityPeriod.toNumber();
      const untilExpiry = expiry - now;
      return untilExpiry > 0 && untilExpiry <= thresholdSeconds;
    })
    .map(({ pubkey, account }) => {
      const expiry = account.lastHeartbeat.toNumber() + account.inactivityPeriod.toNumber();
      return {
        pubkey,
        account,
        daysUntilExpiry: (expiry - now) / (24 * 60 * 60),
      };
    });
}
