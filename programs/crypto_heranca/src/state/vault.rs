use anchor_lang::prelude::*;

/// ============================================================
/// Account: Vault
/// PDA derivado de [b"vault", owner.key().as_ref(), seed.to_le_bytes()]
/// Armazena configuração de herança e estado do timer
/// ============================================================
#[account]
#[derive(Debug)]
pub struct Vault {
    /// Dono do vault (quem criou e pode gerenciar)
    pub owner: Pubkey,
    /// Timestamp UNIX do último heartbeat
    pub last_heartbeat: i64,
    /// Período máximo de inatividade em segundos
    pub inactivity_period: i64,
    /// Lista de herdeiros (máx: 10)
    pub heirs: Vec<Heir>,
    /// Lista de assets depositados (máx: 5)
    pub assets: Vec<Pubkey>,
    /// Taxa do keeper em basis points (máx: 100 = 1%)
    pub keeper_fee_bps: u16,
    /// Reserva de SOL para reembolso de gas do keeper
    pub gas_reserve_lamports: u64,
    /// Status do vault
    pub status: VaultStatus,
    /// Timestamp de criação
    pub created_at: i64,
    /// Bump canônico do PDA
    pub bump: u8,
    /// Seed usada na derivação (permite múltiplos vaults por owner)
    pub seed: u64,
}

impl Vault {
    /// Espaço inicial: discriminador + todos os campos
    /// Vec<Heir> inicia vazio, mas reservamos espaço para até 10
    /// Vec<Pubkey> inicia vazio, mas reservamos espaço para até 5
    pub const INIT_SPACE: usize = 8    // discriminator
        + 32                           // owner: Pubkey
        + 8                            // last_heartbeat: i64
        + 8                            // inactivity_period: i64
        + 4 + (10 * Heir::INIT_SPACE)  // heirs: Vec<Heir> (max 10)
        + 4 + (5 * 32)                 // assets: Vec<Pubkey> (max 5)
        + 2                            // keeper_fee_bps: u16
        + 8                            // gas_reserve_lamports: u64
        + 1                            // status: VaultStatus (enum com 3 variantes = 1 byte)
        + 8                            // created_at: i64
        + 1                            // bump: u8
        + 8;                           // seed: u64

    /// Verifica se o vault está ativo
    pub fn is_active(&self) -> bool {
        self.status == VaultStatus::Active
    }

    /// Verifica se o timer expirou
    pub fn is_expired(&self, current_time: i64) -> bool {
        current_time > self.last_heartbeat.saturating_add(self.inactivity_period)
    }

    /// Retorna o saldo de SOL disponível para distribuição (excluindo gas_reserve)
    pub fn available_sol(&self, vault_lamports: u64) -> u64 {
        vault_lamports.saturating_sub(self.gas_reserve_lamports)
    }
}

/// ============================================================
/// Struct: Heir
/// Representa um herdeiro com sua alocação
/// ============================================================
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Heir {
    /// Endereço do herdeiro
    pub wallet: Pubkey,
    /// Mint do token (SOL nativo = System Program ID)
    pub asset: Pubkey,
    /// Tipo de alocação
    pub allocation_type: AllocationType,
    /// Valor da alocação (percentage em basis points ou fixed amount)
    pub allocation_value: u64,
}

impl Heir {
    pub const INIT_SPACE: usize = 32    // wallet: Pubkey
        + 32                            // asset: Pubkey
        + 1                             // allocation_type: AllocationType (enum = 1 byte)
        + 8;                            // allocation_value: u64
}

/// ============================================================
/// Enums
/// ============================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub enum VaultStatus {
    Active,
    Claimed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub enum AllocationType {
    Percentage,
    FixedAmount,
}

/// ============================================================
/// Constantes do programa
/// ============================================================
pub const MIN_INACTIVITY_PERIOD: i64 = 30 * 24 * 60 * 60; // 30 dias
pub const MAX_INACTIVITY_PERIOD: i64 = 730 * 24 * 60 * 60; // 2 anos
pub const MIN_GAS_RESERVE_LAMPORTS: u64 = 10_000_000; // 0.01 SOL
pub const MAX_KEEPER_FEE_BPS: u16 = 100; // 1%
pub const MAX_HEIRS: usize = 10;
pub const MAX_ASSETS: usize = 5;
pub const SYSTEM_PROGRAM_ID: Pubkey = pubkey!("11111111111111111111111111111111");
