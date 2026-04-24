use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use crate::state::vault::*;
use crate::errors::CryptoHerancaError;
use crate::events::Deposit;

/// ============================================================
/// Instruction: Deposit Token
/// Deposita SPL Tokens (USDC/USDT) no vault
/// 
/// Pré-requisito: A ATA do vault para este mint deve existir.
/// Chame `initialize_token_account` primeiro se necessário.
/// ============================================================

/// Deposita SPL Tokens no vault
/// 
/// # Segurança
/// - ATA do vault já deve existir (sem init_if_needed, previne reinitialization attack)
/// - `has_one = owner` garante que apenas o owner deposita
/// - Verificamos que o mint é válido
pub fn handler(ctx: Context<crate::crypto_heranca::DepositToken>, amount: u64) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let owner = &ctx.accounts.owner;
    let mint_key = ctx.accounts.mint.key();

    require!(amount > 0, CryptoHerancaError::ZeroAllocation);

    // Verificar que o mint está na lista de assets do vault
    require!(
        vault.assets.contains(&mint_key),
        CryptoHerancaError::AssetNotFound
    );

    // Transferir tokens do owner para o vault
    let cpi_accounts = token::Transfer {
        from: ctx.accounts.owner_ata.to_account_info(),
        to: ctx.accounts.vault_ata.to_account_info(),
        authority: owner.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    // Emitir evento
    emit!(Deposit {
        vault_address: vault.key(),
        asset: mint_key,
        amount,
        depositor: owner.key(),
    });

    Ok(())
}
