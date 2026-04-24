use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use crate::state::vault::*;
use crate::errors::CryptoHerancaError;
use crate::events::VaultCancelled;

/// ============================================================
/// Instruction: Cancel Vault
/// Permite ao owner encerrar o vault e resgatar todos os fundos
/// ============================================================

/// Cancela o vault e devolve fundos ao owner
/// 
/// # Segurança
/// - Apenas owner pode cancelar
/// - Timer não pode ter expirado (senão é claim, não cancel)
/// - `close = owner` garante que a conta é fechada e rent devolvido
pub fn handler(ctx: Context<crate::crypto_heranca::CancelVault>) -> Result<()> {
    let vault = &ctx.accounts.vault;
    let owner = &ctx.accounts.owner;
    let clock = Clock::get()?;

    // Verificar que timer não expirou
    require!(
        !vault.is_expired(clock.unix_timestamp),
        CryptoHerancaError::TimerAlreadyExpired
    );

    let refund_amount = vault.to_account_info().lamports();

    // Nota: Os SPL tokens do vault precisam ser transferidos de volta ao owner
    // antes de fechar o vault. Em produção, o dApp deve guiar o usuário a:
    // 1. Cancelar o vault (esta instrução)
    // 2. Transferir tokens SPL de volta manualmente ou via instrução adicional
    // 
    // Para simplificar o MVP, assumimos que o owner retira tokens manualmente
    // ou usamos uma instrução separada de withdraw antes do cancel.

    // Emitir evento antes de fechar
    emit!(VaultCancelled {
        vault_address: vault.key(),
        owner: owner.key(),
        refund_amount,
    });

    Ok(())
}
