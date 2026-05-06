use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::instructions as instructions_sysvar;
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
/// - Se executor != owner: verificamos proof Ed25519 via instruction sysvar (Modalidade B)
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

        // Verificar assinatura Ed25519 via instruction sysvar
        let msg = format!("heartbeat:{}:{}", vault.key(), proof_data.timestamp);
        let msg_bytes = msg.as_bytes();

        require!(
            verify_ed25519_via_sysvar(
                &vault.owner,
                msg_bytes,
                &proof_data.signature,
                &ctx.accounts.instruction_sysvar,
            )?,
            CryptoHerancaError::InvalidHeartbeatSignature
        );

        // Reembolsar gas do executor (keeper)
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

/// Verifica assinatura Ed25519 via instruction sysvar
/// 
/// O keeper deve montar a transação com a instrução Ed25519Program
/// imediatamente ANTES da instrução de heartbeat.
/// 
/// # Segurança
/// - Lê o instruction sysvar para encontrar a instrução Ed25519Program
/// - Valida que os dados contêm a pubkey correta, mensagem correta e signature correta
/// - Não executa criptografia on-chain (a validação é feita pelo Ed25519Program nativo)
fn verify_ed25519_via_sysvar(
    expected_pubkey: &Pubkey,
    expected_message: &[u8],
    expected_signature: &[u8; 64],
    instruction_sysvar_account: &AccountInfo,
) -> Result<bool> {
    const ED25519_PROGRAM_ID: Pubkey = pubkey!("Ed25519SigVerify111111111111111111111111111");

    // Obter o index da instrução atual
    let current_index = instructions_sysvar::load_current_index_checked(instruction_sysvar_account)? as usize;

    // A instrução Ed25519 deve estar imediatamente antes da atual
    if current_index == 0 {
        return Ok(false);
    }
    let ed25519_index = current_index - 1;

    // Carregar a instrução anterior
    let ed25519_instruction = instructions_sysvar::load_instruction_at_checked(ed25519_index, instruction_sysvar_account)?;

    // Verificar que é uma instrução do Ed25519Program
    if ed25519_instruction.program_id != ED25519_PROGRAM_ID {
        return Ok(false);
    }

    // Parse dos dados da instrução Ed25519Program
    let data = ed25519_instruction.data;
    let header_size = 14; // 1 + 1 + 2*6 = 14 bytes
    if data.len() < header_size + 32 + 64 + expected_message.len() {
        return Ok(false);
    }

    // Ler header manualmente (sem unsafe)
    let num_signatures = data[0];
    let _padding = data[1]; // padding byte, não utilizado
    let signature_offset = u16::from_le_bytes([data[2], data[3]]);
    let signature_instruction_index = u16::from_le_bytes([data[4], data[5]]);
    let public_key_offset = u16::from_le_bytes([data[6], data[7]]);
    let public_key_instruction_index = u16::from_le_bytes([data[8], data[9]]);
    let message_data_offset = u16::from_le_bytes([data[10], data[11]]);
    let message_data_size = u16::from_le_bytes([data[12], data[13]]);
    let message_instruction_index = u16::from_le_bytes([data[14], data[15]]);

    // Validar header
    if num_signatures != 1 {
        return Ok(false);
    }

    // Extrair public key, signature e message dos offsets
    let pk_start = public_key_offset as usize;
    let pk_end = pk_start + 32;
    let sig_start = signature_offset as usize;
    let sig_end = sig_start + 64;
    let msg_start = message_data_offset as usize;
    let msg_end = msg_start + message_data_size as usize;

    if pk_end > data.len() || sig_end > data.len() || msg_end > data.len() {
        return Ok(false);
    }

    let pubkey = &data[pk_start..pk_end];
    let signature = &data[sig_start..sig_end];
    let message = &data[msg_start..msg_end];

    // Validar que a pubkey pertence ao owner do vault
    if pubkey != expected_pubkey.as_ref() {
        return Ok(false);
    }

    // Validar que a signature corresponde
    if signature != expected_signature.as_slice() {
        return Ok(false);
    }

    // Validar que a mensagem corresponde
    if message != expected_message {
        return Ok(false);
    }

    // Verificar que os instruction_index apontam para a instrução correta (current)
    // ou 0xFFFF (mesma instrução)
    let sig_ix_ok = signature_instruction_index == 0xFFFF || signature_instruction_index as usize == current_index;
    let pk_ix_ok = public_key_instruction_index == 0xFFFF || public_key_instruction_index as usize == current_index;
    let msg_ix_ok = message_instruction_index == 0xFFFF || message_instruction_index as usize == current_index;

    if !sig_ix_ok || !pk_ix_ok || !msg_ix_ok {
        return Ok(false);
    }

    Ok(true)
}
