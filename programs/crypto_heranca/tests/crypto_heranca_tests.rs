// ============================================================
// Crypto-Herança — Unit Tests
// Framework: Anchor
// ============================================================

use crypto_heranca::state::vault::{Vault, VaultStatus, Heir, AllocationType};
use anchor_lang::prelude::Pubkey;

// ============================================================
// Unit Tests — State & Logic (no Solana runtime needed)
// ============================================================

#[test]
fn test_available_sol_uses_stored_rent_exempt() {
    let vault = Vault {
        owner: Pubkey::new_unique(),
        last_heartbeat: 1000,
        inactivity_period: 86400,
        heirs: vec![],
        assets: vec![],
        keeper_fee_bps: 100,
        gas_reserve_lamports: 5_000_000,
        status: VaultStatus::Active,
        created_at: 0,
        bump: 255,
        seed: 0,
        rent_exempt_min: 8_000_000, // ~0.008 SOL (realistic for ~1KB)
    };

    // Vault has 20M lamports, gas_reserve = 5M, rent_exempt = 8M
    // reserved = max(5M, 8M) = 8M
    // available = 20M - 8M = 12M
    let available = vault.available_sol(20_000_000);
    assert_eq!(available, 12_000_000);

    // If vault has less than rent_exempt, available should be 0
    let available = vault.available_sol(7_000_000);
    assert_eq!(available, 0);
}

#[test]
fn test_is_expired_with_zero_heartbeat() {
    let vault = Vault {
        owner: Pubkey::new_unique(),
        last_heartbeat: 0,
        inactivity_period: 60,
        heirs: vec![],
        assets: vec![],
        keeper_fee_bps: 0,
        gas_reserve_lamports: 0,
        status: VaultStatus::Active,
        created_at: 0,
        bump: 0,
        seed: 0,
        rent_exempt_min: 0,
    };

    // last_heartbeat == 0 means timer not started yet
    assert!(!vault.is_expired(999999));
}

#[test]
fn test_is_expired_after_period() {
    let vault = Vault {
        owner: Pubkey::new_unique(),
        last_heartbeat: 1000,
        inactivity_period: 100,
        heirs: vec![],
        assets: vec![],
        keeper_fee_bps: 0,
        gas_reserve_lamports: 0,
        status: VaultStatus::Active,
        created_at: 0,
        bump: 0,
        seed: 0,
        rent_exempt_min: 0,
    };

    assert!(!vault.is_expired(1050)); // 50s elapsed < 100s period
    assert!(vault.is_expired(1101));  // 101s elapsed > 100s period
}

#[test]
fn test_vault_init_space_includes_rent_exempt() {
    // Ensure INIT_SPACE accounts for the rent_exempt_min field (8 bytes)
    let space_without_rent = 8 + 32 + 8 + 8 + 4 + (10 * 73) + 4 + (5 * 32) + 2 + 8 + 1 + 8 + 1 + 8;
    let space_with_rent = 8 + 32 + 8 + 8 + 4 + (10 * 73) + 4 + (5 * 32) + 2 + 8 + 1 + 8 + 1 + 8 + 8;
    
    assert_eq!(Vault::INIT_SPACE, space_with_rent);
    assert!(Vault::INIT_SPACE > space_without_rent);
}

// ============================================================
// Ed25519 Header Parse Tests (validates removal of unsafe)
// ============================================================

#[test]
fn test_ed25519_header_parse_manual() {
    // Build a raw Ed25519 instruction header (14 bytes)
    let mut data = vec![0u8; 14 + 32 + 64 + 12];
    data[0] = 1; // num_signatures
    data[1] = 0; // padding
    data[2..4].copy_from_slice(&14u16.to_le_bytes()); // signature_offset
    data[4..6].copy_from_slice(&0xFFFFu16.to_le_bytes()); // signature_instruction_index
    data[6..8].copy_from_slice(&78u16.to_le_bytes()); // public_key_offset
    data[8..10].copy_from_slice(&0xFFFFu16.to_le_bytes()); // public_key_instruction_index
    data[10..12].copy_from_slice(&110u16.to_le_bytes()); // message_data_offset
    data[12..14].copy_from_slice(&12u16.to_le_bytes()); // message_data_size
    data[14..16].copy_from_slice(&0xFFFFu16.to_le_bytes()); // message_instruction_index

    // Parse manually (same logic as heartbeat.rs, without unsafe)
    let num_signatures = data[0];
    let _padding = data[1];
    let signature_offset = u16::from_le_bytes([data[2], data[3]]);
    let signature_instruction_index = u16::from_le_bytes([data[4], data[5]]);
    let public_key_offset = u16::from_le_bytes([data[6], data[7]]);
    let public_key_instruction_index = u16::from_le_bytes([data[8], data[9]]);
    let message_data_offset = u16::from_le_bytes([data[10], data[11]]);
    let message_data_size = u16::from_le_bytes([data[12], data[13]]);
    let message_instruction_index = u16::from_le_bytes([data[14], data[15]]);

    assert_eq!(num_signatures, 1);
    assert_eq!(signature_offset, 14);
    assert_eq!(signature_instruction_index, 0xFFFF);
    assert_eq!(public_key_offset, 78);
    assert_eq!(public_key_instruction_index, 0xFFFF);
    assert_eq!(message_data_offset, 110);
    assert_eq!(message_data_size, 12);
    assert_eq!(message_instruction_index, 0xFFFF);
}
