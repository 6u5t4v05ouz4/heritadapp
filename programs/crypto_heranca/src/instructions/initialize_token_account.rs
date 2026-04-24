use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};
use anchor_spl::associated_token::{self, AssociatedToken};
use crate::state::vault::*;
use crate::errors::CryptoHerancaError;

/// ============================================================
/// Instruction: Initialize Token Account
/// Cria a ATA do vault para um determinado mint ANTES de depositar
/// 
/// # Segurança
/// - init (não init_if_needed) — falha se já existe, previne reinitialization
/// - Authority é o vault PDA (não controlável por atacante)
/// ============================================================

/// Cria a ATA do vault para um token
/// 
/// # Fluxo
/// 1. Verificar se vault não tem asset demais
/// 2. Criar ATA com authority = vault PDA
/// 3. Adicionar mint à lista de assets
pub fn handler(ctx: Context<crate::crypto_heranca::InitializeTokenAccount>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let mint_key = ctx.accounts.mint.key();

    // Verificar limite de assets
    require!(
        vault.assets.len() < MAX_ASSETS,
        CryptoHerancaError::TooManyAssets
    );

    // Verificar que o mint ainda não está na lista
    require!(
        !vault.assets.contains(&mint_key),
        CryptoHerancaError::AssetNotFound // já existe
    );

    // Adicionar mint à lista de assets
    vault.assets.push(mint_key);

    Ok(())
}
