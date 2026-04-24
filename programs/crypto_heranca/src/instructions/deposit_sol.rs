use anchor_lang::prelude::*;
use crate::state::vault::*;
use crate::errors::CryptoHerancaError;
use crate::events::Deposit;

/// ============================================================
/// Instruction: Deposit SOL
/// Deposita SOL nativo no vault
/// ============================================================

/// Deposita SOL no vault
/// 
/// # Segurança
/// - `has_one = owner` garante que apenas o owner do vault pode depositar
/// - Vault deve estar ativo
/// - Transferência via system_program (CPI seguro)
pub fn handler(ctx: Context<crate::crypto_heranca::DepositSol>, amount: u64) -> Result<()> {
    let vault = &ctx.accounts.vault;
    let owner = &ctx.accounts.owner;

    // Validar que o owner tem saldo suficiente (a transação falhará naturalmente se não)
    require!(amount > 0, CryptoHerancaError::ZeroAllocation);

    // Transferir SOL do owner para o vault PDA
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        anchor_lang::system_program::Transfer {
            from: owner.to_account_info(),
            to: vault.to_account_info(),
        },
    );
    anchor_lang::system_program::transfer(cpi_context, amount)?;

    // Emitir evento
    emit!(Deposit {
        vault_address: vault.key(),
        asset: SYSTEM_PROGRAM_ID,
        amount,
        depositor: owner.key(),
    });

    Ok(())
}
