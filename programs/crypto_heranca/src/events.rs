use anchor_lang::prelude::*;

/// ============================================================
/// Events
/// ============================================================

#[event]
pub struct VaultCreated {
    pub vault_address: Pubkey,
    pub owner: Pubkey,
    pub inactivity_period: i64,
    pub seed: u64,
}

#[event]
pub struct Deposit {
    pub vault_address: Pubkey,
    pub asset: Pubkey,
    pub amount: u64,
    pub depositor: Pubkey,
}

#[event]
pub struct HeartbeatReset {
    pub vault_address: Pubkey,
    pub new_timestamp: i64,
    pub caller: Pubkey,
}

#[event]
pub struct ClaimExecuted {
    pub vault_address: Pubkey,
    pub asset: Pubkey,
    pub amount: u64,
    pub heir: Pubkey,
    pub keeper: Pubkey,
}

#[event]
pub struct VaultCancelled {
    pub vault_address: Pubkey,
    pub owner: Pubkey,
    pub refund_amount: u64,
}
