import { PublicKey } from '@solana/web3.js';
import { program, keeperKeypair, getVaultStatus, VaultAccount } from './solana';
import { getSupabaseClient } from '../db/supabase';

const supabase = getSupabaseClient();

// ============================================================
// Execute claim for an expired vault
// ============================================================
export async function executeClaim(
  vaultAddress: PublicKey,
  account: VaultAccount
): Promise<{ success: boolean; txSignature?: string; error?: string }> {
  try {
    const status = getVaultStatus(account);
    if (status !== 'active') {
      return { success: false, error: 'vault_not_active' };
    }

    // Build remaining accounts (heir_0 through heir_9)
    const remainingAccounts = account.heirs
      .slice(0, 10)
      .map((heir) => ({
        pubkey: heir.wallet,
        isWritable: true,
        isSigner: false,
      }));

    // If fewer than 10 heirs, we don't need to pass extras (they're optional in IDL)
    const tx = await program.methods
      .claim()
      .accounts({
        executor: keeperKeypair.publicKey,
        vault: vaultAddress,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
        systemProgram: new PublicKey('11111111111111111111111111111111'),
        rent: new PublicKey('SysvarRent111111111111111111111111111111111'),
      })
      .remainingAccounts(remainingAccounts)
      .signers([keeperKeypair])
      .rpc({
        commitment: 'confirmed',
        skipPreflight: false,
      });

    // Update Supabase
    const { data: vaultData } = await supabase
      .from('vaults')
      .select('id')
      .eq('vault_address', vaultAddress.toBase58())
      .single();

    if (vaultData) {
      await Promise.all([
        supabase
          .from('vaults')
          .update({
            status: 'claimed',
            claim_executed_at: new Date().toISOString(),
            claim_executor: keeperKeypair.publicKey.toBase58(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', vaultData.id),
        supabase.from('claim_executions').insert({
          vault_id: vaultData.id,
          executor_address: keeperKeypair.publicKey.toBase58(),
          tx_signature: tx,
          status: 'success',
          executed_at: new Date().toISOString(),
        }),
      ]);
    }

    console.log(`[Claim] Executed for vault ${vaultAddress.toBase58()}: ${tx}`);
    return { success: true, txSignature: tx };
  } catch (err: any) {
    console.error(`[Claim] Error for vault ${vaultAddress.toBase58()}:`, err);
    
    // Log failed attempt
    try {
      const { data: vaultData } = await supabase
        .from('vaults')
        .select('id')
        .eq('vault_address', vaultAddress.toBase58())
        .single();
      
      if (vaultData) {
        await supabase.from('claim_executions').insert({
          vault_id: vaultData.id,
          executor_address: keeperKeypair.publicKey.toBase58(),
          tx_signature: '',
          status: 'failed',
          executed_at: new Date().toISOString(),
        });
      }
    } catch (logErr) {
      // Ignore logging errors
    }

    return { success: false, error: err.message || 'claim_failed' };
  }
}

// ============================================================
// Process all expired vaults (called by cron job)
// ============================================================
export async function processExpiredVaults(
  vaults: { pubkey: PublicKey; account: VaultAccount }[]
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const { pubkey, account } of vaults) {
    processed++;
    const result = await executeClaim(pubkey, account);
    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }
    
    // Small delay between claims to avoid RPC rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`[Claim] Batch complete: ${processed} processed, ${succeeded} succeeded, ${failed} failed`);
  return { processed, succeeded, failed };
}
