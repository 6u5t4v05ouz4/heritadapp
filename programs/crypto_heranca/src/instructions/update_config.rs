use anchor_lang::prelude::*;
use crate::state::vault::*;
use crate::errors::CryptoHerancaError;

/// ============================================================
/// Instruction: Update Config
/// Permite ao owner alterar configuração do vault
/// ============================================================

/// Atualiza configuração do vault
/// 
/// # Segurança
/// - Apenas owner pode chamar
/// - Timer não pode ter expirado
/// - Todas as validações de init são re-aplicadas
pub fn handler(
    ctx: Context<crate::crypto_heranca::UpdateConfig>,
    new_inactivity_period: Option<i64>,
    new_heirs: Option<Vec<Heir>>,
    new_keeper_fee_bps: Option<u16>,
    new_gas_reserve: Option<u64>,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let clock = Clock::get()?;

    // Não permitir alteração se timer já expirou
    require!(
        !vault.is_expired(clock.unix_timestamp),
        CryptoHerancaError::TimerAlreadyExpired
    );

    // Atualizar inactivity_period
    if let Some(period) = new_inactivity_period {
        require!(
            period >= MIN_INACTIVITY_PERIOD && period <= MAX_INACTIVITY_PERIOD,
            CryptoHerancaError::InvalidInactivityPeriod
        );
        vault.inactivity_period = period;
    }

    // Atualizar heirs
    if let Some(heirs) = new_heirs {
        // Revalidar todos os constraints
        require!(
            heirs.len() <= MAX_HEIRS,
            CryptoHerancaError::TooManyHeirs
        );

        // Verificar duplicatas
        let mut seen: Vec<Pubkey> = Vec::new();
        for heir in &heirs {
            require!(
                !seen.contains(&heir.wallet),
                CryptoHerancaError::DuplicateHeir
            );
            seen.push(heir.wallet);
            require!(
                heir.allocation_value > 0,
                CryptoHerancaError::ZeroAllocation
            );
        }

        // Validar percentuais
        validate_percentage_sum(&heirs)?;

        vault.heirs = heirs;
    }

    // Atualizar keeper fee
    if let Some(fee) = new_keeper_fee_bps {
        require!(
            fee <= MAX_KEEPER_FEE_BPS,
            CryptoHerancaError::KeeperFeeTooHigh
        );
        vault.keeper_fee_bps = fee;
    }

    // Atualizar gas reserve
    if let Some(gas) = new_gas_reserve {
        require!(
            gas >= MIN_GAS_RESERVE_LAMPORTS,
            CryptoHerancaError::InvalidGasReserve
        );
        vault.gas_reserve_lamports = gas;
    }

    Ok(())
}

/// Valida que percentuais somam 100% por asset
fn validate_percentage_sum(heirs: &[Heir]) -> Result<()> {
    use std::collections::HashMap;
    let mut sums: HashMap<Pubkey, u64> = HashMap::new();

    for heir in heirs {
        if heir.allocation_type == AllocationType::Percentage {
            let entry = sums.entry(heir.asset).or_insert(0);
            *entry = entry.checked_add(heir.allocation_value)
                .ok_or(CryptoHerancaError::MathOverflow)?;
        }
    }

    for (_asset, sum) in sums {
        require!(sum == 10_000, CryptoHerancaError::InvalidPercentageSum);
    }

    Ok(())
}
