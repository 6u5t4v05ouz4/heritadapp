use anchor_lang::prelude::*;

/// ============================================================
/// Custom Error Codes
/// ============================================================
#[error_code]
pub enum CryptoHerancaError {
    #[msg("Vault is not active")]
    VaultNotActive,
    
    #[msg("Vault timer has not expired yet")]
    TimerNotExpired,
    
    #[msg("Vault timer has already expired")]
    TimerAlreadyExpired,
    
    #[msg("Invalid inactivity period: must be between 30 days and 2 years")]
    InvalidInactivityPeriod,
    
    #[msg("Invalid gas reserve: minimum is 0.01 SOL")]
    InvalidGasReserve,
    
    #[msg("Keeper fee too high: maximum is 1%")]
    KeeperFeeTooHigh,
    
    #[msg("Too many heirs: maximum is 10")]
    TooManyHeirs,
    
    #[msg("Too many assets: maximum is 5")]
    TooManyAssets,
    
    #[msg("Percentage allocations must sum to exactly 100% (10000 bps) per asset")]
    InvalidPercentageSum,
    
    #[msg("Invalid asset mint address")]
    InvalidAssetMint,
    
    #[msg("Invalid heartbeat signature")]
    InvalidHeartbeatSignature,
    
    #[msg("Heartbeat timestamp is too old or too far in the future")]
    InvalidHeartbeatTimestamp,
    
    #[msg("No heirs configured for this asset")]
    NoHeirsForAsset,
    
    #[msg("Insufficient SOL balance in vault")]
    InsufficientVaultSol,
    
    #[msg("Asset not found in vault")]
    AssetNotFound,
    
    #[msg("Vault is already claimed")]
    VaultAlreadyClaimed,
    
    #[msg("Unauthorized: only the owner can perform this action")]
    Unauthorized,
    
    #[msg("Duplicate heir wallet detected")]
    DuplicateHeir,
    
    #[msg("Zero allocation value not allowed")]
    ZeroAllocation,
    
    #[msg("Math overflow")]
    MathOverflow,
    
    #[msg("Invalid remaining accounts for claim")]
    InvalidRemainingAccounts,
    
    #[msg("ATA creation failed")]
    ATACreationFailed,
}
