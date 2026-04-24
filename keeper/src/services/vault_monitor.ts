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
// ============================================================
async function syncHeirs(
  vaultId: string,
  heirs: VaultAccount['heirs']
): Promise<void> {
  // Delete existing heirs and re-insert (simple approach)
  await supabase.from('heirs').delete().eq('vault_id', vaultId);

  if (heirs.length === 0) return;

  const heirRows = heirs.map((h) => ({
    vault_id: vaultId,
    wallet_address: h.wallet.toBase58(),
    asset_mint: h.asset.toBase58(),
    allocation_type: h.allocationType.percentage !== undefined ? 'percentage' : 'fixed_amount',
    allocation_value: h.allocationValue.toNumber(),
  }));

  const { error } = await supabase.from('heirs').insert(heirRows);
  if (error) throw error;
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
