use anchor_lang::prelude::*;
use crate::state::vault::*;
use crate::errors::CryptoHerancaError;

/// ============================================================
/// Instruction: Initialize Vault
/// Cria um novo PDA de vault com configuração de herança
/// ============================================================

/// Cria um novo vault de herança
/// 
/// # Segurança
/// - `init` constraint previne reinitialization (reinitialization attack)
/// - Seeds incluem owner pubkey para isolar por usuário (PDA sharing prevention)
/// - Seed permite múltiplos vaults por owner
/// - Todas as validações de parâmetros ocorrem antes de qualquer mutação
/// 
/// # Arguments
/// * `ctx` — Contexto da instrução
/// * `seed` — Seed para derivação do PDA (permite múltiplos vaults)
/// * `inactivity_period` — Período de inatividade em segundos
/// * `heirs` — Lista de herdeiros com alocações
/// * `keeper_fee_bps` — Taxa do keeper em basis points
/// * `gas_reserve_lamports` — Reserva de SOL para reembolso de gas
pub fn handler(
    ctx: Context<crate::crypto_heranca::InitializeVault>,
    seed: u64,
    inactivity_period: i64,
    heirs: Vec<Heir>,
    keeper_fee_bps: u16,
    gas_reserve_lamports: u64,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let owner = &ctx.accounts.owner;
    let clock = Clock::get()?;

    // ── 1. Validações de parâmetros ───────────────────────────────
    
    // Período de inatividade deve estar entre 30 dias e 2 anos
    require!(
        inactivity_period >= MIN_INACTIVITY_PERIOD && inactivity_period <= MAX_INACTIVITY_PERIOD,
        CryptoHerancaError::InvalidInactivityPeriod
    );

    // Gas reserve mínimo: 0.01 SOL
    require!(
        gas_reserve_lamports >= MIN_GAS_RESERVE_LAMPORTS,
        CryptoHerancaError::InvalidGasReserve
    );

    // Keeper fee máximo: 1%
    require!(
        keeper_fee_bps <= MAX_KEEPER_FEE_BPS,
        CryptoHerancaError::KeeperFeeTooHigh
    );

    // Limite de herdeiros
    require!(
        heirs.len() <= MAX_HEIRS,
        CryptoHerancaError::TooManyHeirs
    );

    // Limite de assets distintos nos heirs
    let mut unique_assets: Vec<Pubkey> = Vec::new();
    for heir in &heirs {
        if !unique_assets.contains(&heir.asset) {
            unique_assets.push(heir.asset);
        }
    }
    require!(
        unique_assets.len() <= MAX_ASSETS,
        CryptoHerancaError::TooManyAssets
    );

    // Verificar duplicatas de herdeiros (mesmo wallet)
    let mut seen_wallets: Vec<Pubkey> = Vec::new();
    for heir in &heirs {
        require!(
            !seen_wallets.contains(&heir.wallet),
            CryptoHerancaError::DuplicateHeir
        );
        seen_wallets.push(heir.wallet);
        
        // Alocação não pode ser zero
        require!(
            heir.allocation_value > 0,
            CryptoHerancaError::ZeroAllocation
        );
    }

    // Validar que percentuais somam 100% por asset
    validate_percentage_allocations(&heirs)?;

    // ── 2. Inicialização do vault ─────────────────────────────────
    
    vault.owner = owner.key();
    vault.last_heartbeat = clock.unix_timestamp;
    vault.inactivity_period = inactivity_period;
    vault.heirs = heirs;
    vault.assets = Vec::new(); // Inicia vazio, preenchido nos deposits
    vault.keeper_fee_bps = keeper_fee_bps;
    vault.gas_reserve_lamports = gas_reserve_lamports;
    vault.status = VaultStatus::Active;
    vault.created_at = clock.unix_timestamp;
    vault.bump = ctx.bumps.vault;
    vault.seed = seed;

    Ok(())
}

/// Valida que, para cada asset com alocações Percentage, a soma seja exatamente 10000 bps
fn validate_percentage_allocations(heirs: &[Heir]) -> Result<()> {
    // Agrupar por asset
    use std::collections::HashMap;
    let mut asset_percentages: HashMap<Pubkey, u64> = HashMap::new();

    for heir in heirs {
        if heir.allocation_type == AllocationType::Percentage {
            let sum = asset_percentages.entry(heir.asset).or_insert(0);
            *sum = sum.checked_add(heir.allocation_value)
                .ok_or(CryptoHerancaError::MathOverflow)?;
        }
    }

    // Verificar somas
    for (asset, sum) in asset_percentages {
        require!(
            sum == 10_000,
            CryptoHerancaError::InvalidPercentageSum
        );
        // Verificar que não há fixed amounts para o mesmo asset
        // (misturar percentage e fixed no mesmo asset é permitido pelo design)
        let _ = asset; // evitar warning
    }

    Ok(())
}
