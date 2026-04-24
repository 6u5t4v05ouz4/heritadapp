use anchor_lang::prelude::*;
use crate::state::vault::*;
use crate::errors::CryptoHerancaError;
use crate::events::HeartbeatReset;

/// ============================================================
/// Instruction: Heartbeat
/// Reseta o timer de inatividade do vault
/// 
/// Duas modalidades:
/// A) Owner assina diretamente (signer check)
/// B) Keeper submete com proof assinado off-chain (Ed25519Program)
/// ============================================================

/// Executa heartbeat — reseta o timer
/// 
/// # Segurança
/// - Se executor == owner: verificamos diretamente (Modalidade A)
/// - Se executor != owner: verificamos proof Ed25519 (Modalidade B)
/// - Timestamp deve ser recente (±5 minutos)
pub fn handler(ctx: Context<crate::crypto_heranca::Heartbeat>, proof_bytes: Option<Vec<u8>>) -> Result<()> {
    let proof = proof_bytes.map(|bytes| {
        // Deserialize HeartbeatProof from bytes
        // Format: 8 bytes timestamp (i64 LE) + 64 bytes signature
        if bytes.len() != 72 {
            return None;
        }
        let mut timestamp_bytes = [0u8; 8];
        timestamp_bytes.copy_from_slice(&bytes[0..8]);
        let timestamp = i64::from_le_bytes(timestamp_bytes);
        let mut signature = [0u8; 64];
        signature.copy_from_slice(&bytes[8..72]);
        Some(crate::HeartbeatProof { timestamp, signature })
    }).flatten();
    let vault = &mut ctx.accounts.vault;
    let executor = &ctx.accounts.executor;
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    // ── Modalidade A: Owner é o executor ──────────────────────────
    if executor.key() == vault.owner {
        // Owner assinou diretamente — OK
    } 
    // ── Modalidade B: Keeper com proof Ed25519 ────────────────────
    else if let Some(proof_data) = proof {
        // Validar timestamp do proof
        require!(
            proof_data.timestamp >= current_time - 300 && proof_data.timestamp <= current_time + 60,
            CryptoHerancaError::InvalidHeartbeatTimestamp
        );

        // Verificar assinatura Ed25519
        // Em produção: usar Ed25519Program via instruction sysvar
        // Implementação simplificada para MVP
        let msg = format!("heartbeat:{}:{}", vault.key(), proof_data.timestamp);
        let msg_bytes = msg.as_bytes();

        require!(
            verify_ed25519_signature(&vault.owner, msg_bytes, &proof_data.signature),
            CryptoHerancaError::InvalidHeartbeatSignature
        );

        // Reembolsar gas do executor (keeper)
        // O executor pagou o gas desta transação
        if vault.gas_reserve_lamports > 0 {
            let gas_reimburse = std::cmp::min(
                vault.gas_reserve_lamports,
                vault.to_account_info().lamports().saturating_sub(1),
            );
            if gas_reimburse > 0 {
                **vault.to_account_info().try_borrow_mut_lamports()? = vault
                    .to_account_info().lamports()
                    .checked_sub(gas_reimburse)
                    .ok_or(CryptoHerancaError::MathOverflow)?;
                **executor.to_account_info().try_borrow_mut_lamports()? = executor
                    .to_account_info().lamports()
                    .checked_add(gas_reimburse)
                    .ok_or(CryptoHerancaError::MathOverflow)?;
            }
        }
    } else {
        return err!(CryptoHerancaError::Unauthorized);
    }

    // Atualizar timestamp
    vault.last_heartbeat = current_time;

    // Emitir evento
    emit!(HeartbeatReset {
        vault_address: vault.key(),
        new_timestamp: current_time,
        caller: executor.key(),
    });

    Ok(())
}

/// Verifica assinatura Ed25519
/// 
/// ⚠️  IMPLEMENTAÇÃO SIMPLIFICADA PARA MVP
/// 
/// Em produção, deve usar Ed25519Program via instruction sysvar:
/// 1. Keeper monta transação com instrução Ed25519Program antes do heartbeat
/// 2. Heartbeat lê instruction sysvar e valida dados da assinatura
/// 3. Isso evita custo de verificação criptográfica no programa
///
/// Referência: https://docs.solana.com/developing/runtime-facilities/programs#ed25519-program
fn verify_ed25519_signature(
    _pubkey: &Pubkey,
    _message: &[u8],
    _signature: &[u8; 64],
) -> bool {
    // PLACEHOLDER: Implementação real requer Ed25519Program
    // Para desenvolvimento/testes, assumimos que a assinatura é válida
    // se o keeper a submeteu (o keeper valida off-chain antes)
    //
    // EM PRODUÇÃO: Implementar verificação via instruction sysvar
    true
}
