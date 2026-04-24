import { PublicKey, Transaction } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import { program, connection, keeperKeypair } from './solana';
import { getSupabaseClient } from '../db/supabase';

const supabase = getSupabaseClient();

export interface HeartbeatRequest {
  vaultAddress: string;
  timestamp: number;
  signature: string; // base58
  pubkey: string; // base58 (owner pubkey)
}

// ============================================================
// Validate heartbeat signature off-chain
// ============================================================
export function validateHeartbeatSignature(
  vaultAddress: string,
  timestamp: number,
  signature: string,
  pubkey: string
): boolean {
  try {
    const message = `heartbeat:${vaultAddress}:${timestamp}`;
    const messageBytes = Buffer.from(message, 'utf-8');
    const signatureBytes = Buffer.from(signature, 'base64');
    const pubkeyBytes = new PublicKey(pubkey).toBytes();

    return nacl.sign.detached.verify(messageBytes, signatureBytes, pubkeyBytes);
  } catch (err) {
    console.error('[Heartbeat] Signature validation error:', err);
    return false;
  }
}

// ============================================================
// Submit heartbeat on-chain (Modalidade B — keeper submits proof)
// ============================================================
export async function submitHeartbeat(
  vaultAddress: PublicKey,
  timestamp: number,
  signature: Buffer,
  ownerPubkey: PublicKey
): Promise<string> {
  // Build the heartbeat proof as bytes
  // Format: timestamp (8 bytes LE) + signature (64 bytes) + pubkey (32 bytes)
  const proof = Buffer.concat([
    Buffer.from(new BigUint64Array([BigInt(timestamp)]).buffer),
    signature,
    ownerPubkey.toBytes(),
  ]);

  const tx = await program.methods
    .heartbeat(proof)
    .accounts({
      vault: vaultAddress,
      caller: keeperKeypair.publicKey,
      systemProgram: new PublicKey('11111111111111111111111111111111'),
    })
    .signers([keeperKeypair])
    .rpc({
      commitment: 'confirmed',
      skipPreflight: false,
    });

  return tx;
}

// ============================================================
// Process heartbeat request from dApp
// ============================================================
export async function processHeartbeat(
  request: HeartbeatRequest
): Promise<{ success: boolean; txSignature?: string; error?: string }> {
  try {
    // Validate inputs
    const vaultAddress = new PublicKey(request.vaultAddress);
    const ownerPubkey = new PublicKey(request.pubkey);
    const signature = Buffer.from(request.signature, 'base64');

    // Validate signature
    const isValid = validateHeartbeatSignature(
      request.vaultAddress,
      request.timestamp,
      request.signature,
      request.pubkey
    );

    if (!isValid) {
      return { success: false, error: 'invalid_signature' };
    }

    // Check timestamp is within acceptable window (±5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - request.timestamp) > 300) {
      return { success: false, error: 'expired_timestamp' };
    }

    // Submit on-chain
    const txSignature = await submitHeartbeat(
      vaultAddress,
      request.timestamp,
      signature,
      ownerPubkey
    );

    // Log to Supabase
    const { data: vaultData } = await supabase
      .from('vaults')
      .select('id')
      .eq('vault_address', request.vaultAddress)
      .single();

    if (vaultData) {
      await supabase.from('heartbeat_logs').insert({
        vault_id: vaultData.id,
        caller_address: request.pubkey,
        tx_signature: txSignature,
        mode: 'keeper_proof',
        processed_at: new Date().toISOString(),
      });
    }

    console.log(`[Heartbeat] Submitted for vault ${request.vaultAddress}: ${txSignature}`);
    return { success: true, txSignature };
  } catch (err: any) {
    console.error('[Heartbeat] Processing error:', err);
    return { success: false, error: err.message || 'unknown_error' };
  }
}
