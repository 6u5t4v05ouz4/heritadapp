// ============================================================
// Crypto-Herança — LiteSVM Tests
// Framework: Anchor
// Testing: LiteSVM (fast, in-process)
// ============================================================

use litesvm::LiteSVM;
use solana_keypair::Keypair;
use solana_native_token::LAMPORTS_PER_SOL;
use solana_signer::Signer;
use solana_pubkey::Pubkey;
use std::path::PathBuf;

// Program ID (deve corresponder ao declare_id! no lib.rs)
const PROGRAM_ID: Pubkey = solana_pubkey::pubkey!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

/// Setup: inicializa LiteSVM, airdrop SOL, carrega programa
fn setup() -> (LiteSVM, Keypair) {
    let mut svm = LiteSVM::new();
    let payer = Keypair::new();

    // Airdrop SOL para o payer
    svm.airdrop(&payer.pubkey(), 50 * LAMPORTS_PER_SOL)
        .expect("Airdrop failed");

    // Carregar programa compilado (.so)
    // Nota: precisa rodar `anchor build` primeiro para gerar o .so
    let so_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../target/deploy/crypto_heranca.so");
    
    match std::fs::read(&so_path) {
        Ok(program_data) => {
            svm.add_program(PROGRAM_ID, &program_data);
        }
        Err(_) => {
            println!("WARNING: Program .so not found at {:?}", so_path);
            println!("Run `anchor build` first to generate the compiled program.");
        }
    }

    (svm, payer)
}

// ============================================================
// Happy Path Tests
// ============================================================

#[test]
fn test_initialize_vault_success() {
    let (mut svm, payer) = setup();
    
    // TODO: Implementar teste completo com LiteSVM
    // 1. Criar vault
    // 2. Verificar PDA derivation
    // 3. Verificar estado inicial
    
    println!("✓ initialize_vault test scaffold ready");
}

#[test]
fn test_deposit_sol_success() {
    let (_svm, _payer) = setup();
    
    // TODO: Implementar
    println!("✓ deposit_sol test scaffold ready");
}

#[test]
fn test_heartbeat_owner_success() {
    let (_svm, _payer) = setup();
    
    // TODO: Implementar
    println!("✓ heartbeat_owner test scaffold ready");
}

#[test]
fn test_claim_success() {
    let (_svm, _payer) = setup();
    
    // TODO: Implementar
    println!("✓ claim test scaffold ready");
}

#[test]
fn test_cancel_vault_success() {
    let (_svm, _payer) = setup();
    
    // TODO: Implementar
    println!("✓ cancel_vault test scaffold ready");
}

// ============================================================
// Security / Edge Case Tests
// ============================================================

#[test]
fn test_reinitialize_vault_fails() {
    let (_svm, _payer) = setup();
    
    // TODO: Tentar inicializar vault com mesmo seed — deve falhar
    println!("✓ reinitialize_vault test scaffold ready");
}

#[test]
fn test_claim_before_expiry_fails() {
    let (_svm, _payer) = setup();
    
    // TODO: Tentar claim antes do timer expirar — deve falhar
    println!("✓ claim_before_expiry test scaffold ready");
}

#[test]
fn test_unauthorized_heartbeat_fails() {
    let (_svm, _payer) = setup();
    
    // TODO: Tentar heartbeat com assinatura inválida — deve falhar
    println!("✓ unauthorized_heartbeat test scaffold ready");
}

#[test]
fn test_update_config_by_non_owner_fails() {
    let (_svm, _payer) = setup();
    
    // TODO: Tentar update_config com conta não-owner — deve falhar
    println!("✓ update_config_unauthorized test scaffold ready");
}

#[test]
fn test_cancel_after_expiry_fails() {
    let (_svm, _payer) = setup();
    
    // TODO: Tentar cancel após timer expirado — deve falhar
    println!("✓ cancel_after_expiry test scaffold ready");
}

#[test]
fn test_invalid_percentage_sum_fails() {
    let (_svm, _payer) = setup();
    
    // TODO: Tentar criar vault com percentuais não somando 100% — deve falhar
    println!("✓ invalid_percentage_sum test scaffold ready");
}

// ============================================================
// CU Profiling Summary
// ============================================================

#[test]
fn zz_cu_summary() {
    println!("\n");
    println!("============================================================");
    println!("  Crypto-Herança — CU Consumption Summary");
    println!("============================================================");
    println!("  Run `anchor test` or `cargo test -- --nocapture` with");
    println!("  LiteSVM CU profiling enabled for detailed results.");
    println!("============================================================");
    println!("\n");
}
