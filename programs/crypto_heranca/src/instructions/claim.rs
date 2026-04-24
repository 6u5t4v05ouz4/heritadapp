use anchor_lang::prelude::*;
use anchor_lang::solana_program::{system_instruction, program};
use crate::state::vault::*;
use crate::errors::CryptoHerancaError;
use crate::events::ClaimExecuted;

pub fn handler(_ctx: Context<crate::crypto_heranca::Claim>) -> Result<()> {
    // Lógica movida para lib.rs para evitar problemas de lifetime
    Ok(())
}
