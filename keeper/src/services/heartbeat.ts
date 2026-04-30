import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import { program, connection, keeperKeypair } from './solana';
import { getSupabaseClient } from '../db/supabase';

const supabase = getSupabaseClient();

// Ed25519Program native address
const ED25519_PROGRAM_ID = new PublicKey('Ed25519SigVerify111111111111111111111111111');

export interface HeartbeatRequest {
  vaultAddress: string;
  timestamp: number;
  signature: string; // base64
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
// Build Ed25519Program instruction for on-chain verification
// 
// The contract reads the instruction sysvar and validates that
// the previous instruction was an Ed25519Program call with the
// correct pubkey, message and signature.
// ============================================================
function buildEd25519Instruction(
  pubkey: Buffer,
  signature: Buffer,
  message: Buffer
): TransactionInstruction {
  // Ed25519 instruction data layout:
  // 0: num_signatures (u8) = 1
  // 1: padding (u8) = 0
  // 2-3: signature_offset (u16) = 2 + 12 = 14
  // 4-5: signature_instruction_index (u16) = 0xFFFF
  // 6-7: public_key_offset (u16) = 14 + 64 = 78
  // 8-9: public_key_instruction_index (u16) = 0xFFFF
  // 10-11: message_data_offset (u16) = 78 + 32 = 110
  // 12-13: message_data_size (u16) = message.length
  // 14-15: message_instruction_index (u16) = 0xFFFF
  // 16..: signature (64 bytes)
  // 80..: pubkey (32 bytes)
  // 112..: message (N bytes)
  
  const SIGNATURE_OFFSET = 16;
  const PUBLIC_KEY_OFFSET = SIGNATURE_OFFSET + 64; // 80
  const MESSAGE_OFFSET = PUBLIC_KEY_OFFSET + 32; // 112
  
  const header = Buffer.alloc(16);
  header.writeUInt8(1, 0); // num_signatures
  header.writeUInt8(0, 1); // padding
  header.writeUInt16LE(SIGNATURE_OFFSET, 2); // signature_offset
  header.writeUInt16LE(0xFFFF, 4); // signature_instruction_index (same instruction)
  header.writeUInt16LE(PUBLIC_KEY_OFFSET, 6); // public_key_offset
  header.writeUInt16LE(0xFFFF, 8); // public_key_instruction_index
  header.writeUInt16LE(MESSAGE_OFFSET, 10); // message_data_offset
  header.writeUInt16LE(message.length, 12); // message_data_size
  header.writeUInt16LE(0xFFFF, 14); // message_instruction_index
  
  const data = Buffer.concat([
    header,
    signature,
    pubkey,
    message,
  ]);
  
  return new TransactionInstruction({
    keys: [],
    programId: ED25519_PROGRAM_ID,
    data,
  });
}

// ============================================================
// Submit heartbeat on-chain (Modalidade B — keeper submits proof)
// 
// Transaction structure:
// 1. Ed25519Program instruction (verifies signature)
// 2. Heartbeat instruction (resets timer)
// ============================================================
export async function submitHeartbeat(
  vaultAddress: PublicKey,
  timestamp: number,
  signatureBytes: Buffer,
  ownerPubkey: PublicKey
): Promise<string> {
  const message = Buffer.from(`heartbeat:${vaultAddress.toBase58()}:${timestamp}`, 'utf-8');
  
  // Build Ed25519Program instruction
  const ed25519Ix = buildEd25519Instruction(
    Buffer.from(ownerPubkey.toBytes()),
    signatureBytes,
    message
  );
  
  // Build heartbeat proof (timestamp + signature)
  // Format: 8 bytes timestamp (i64 LE) + 64 bytes signature
  const proof = Buffer.concat([
    Buffer.from(new BigInt64Array([BigInt(timestamp)]).buffer),
    signatureBytes,
  ]);

  // Build heartbeat instruction
  const heartbeatIx = await program.methods
    .heartbeat(proof)
    .accounts({
      executor: keeperKeypair.publicKey,
      vault: vaultAddress,
      instructionSysvar: new PublicKey('Sysvar1nstructions1111111111111111111111111'),
      systemProgram: new PublicKey('11111111111111111111111111111111'),
    })
    .instruction();

  // Create transaction with both instructions
  const tx = new Transaction().add(ed25519Ix, heartbeatIx);
  
  // Send transaction
  const txSignature = await connection.sendTransaction(tx, [keeperKeypair], {
    skipPreflight: false,
  });
  
  // Wait for confirmation
  await connection.confirmTransaction(txSignature, 'confirmed');
  
  return txSignature;
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
      signature, // Buffer com a assinatura
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
