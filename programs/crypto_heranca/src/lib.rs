use anchor_lang::prelude::*;

pub mod state;
pub mod errors;
pub mod events;
pub mod instructions;

pub use state::*;
pub use errors::*;
pub use events::*;
pub use instructions::*;

// Explicit re-exports for #[program] macro
pub use state::vault::{Heir, Vault, VaultStatus, AllocationType, MIN_INACTIVITY_PERIOD, MAX_INACTIVITY_PERIOD, MIN_GAS_RESERVE_LAMPORTS, MAX_KEEPER_FEE_BPS, MAX_HEIRS, MAX_ASSETS, SYSTEM_PROGRAM_ID};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct HeartbeatProof {
    pub timestamp: i64,
    pub signature: [u8; 64],
}

declare_id!("8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX");

#[program]
pub mod crypto_heranca {
    use super::*;
    use anchor_lang::solana_program::{system_instruction, program};
    use anchor_spl::token::{Token, TokenAccount, Mint};
    use anchor_spl::associated_token::AssociatedToken;

    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        seed: u64,
        inactivity_period: i64,
        heirs: Vec<Heir>,
        keeper_fee_bps: u16,
        gas_reserve_lamports: u64,
    ) -> Result<()> {
        instructions::initialize_vault::handler(ctx, seed, inactivity_period, heirs, keeper_fee_bps, gas_reserve_lamports)
    }

    pub fn initialize_token_account(ctx: Context<InitializeTokenAccount>) -> Result<()> {
        instructions::initialize_token_account::handler(ctx)
    }

    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        instructions::deposit_sol::handler(ctx, amount)
    }

    pub fn deposit_token(ctx: Context<DepositToken>, amount: u64) -> Result<()> {
        instructions::deposit_token::handler(ctx, amount)
    }

    pub fn heartbeat(ctx: Context<Heartbeat>, proof: Option<Vec<u8>>) -> Result<()> {
        instructions::heartbeat::handler(ctx, proof)
    }

    pub fn update_config(
        ctx: Context<UpdateConfig>,
        new_inactivity_period: Option<i64>,
        new_heirs: Option<Vec<Heir>>,
        new_keeper_fee_bps: Option<u16>,
        new_gas_reserve: Option<u64>,
    ) -> Result<()> {
        instructions::update_config::handler(ctx, new_inactivity_period, new_heirs, new_keeper_fee_bps, new_gas_reserve)
    }

    pub fn cancel_vault(ctx: Context<CancelVault>) -> Result<()> {
        instructions::cancel_vault::handler(ctx)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let executor = &ctx.accounts.executor;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        require!(vault.is_expired(current_time), CryptoHerancaError::TimerNotExpired);
        require!(vault.is_active(), CryptoHerancaError::VaultNotActive);

        // Coletar contas de herdeiros disponíveis
        let heir_accounts: Vec<AccountInfo> = [
            &ctx.accounts.heir_0, &ctx.accounts.heir_1, &ctx.accounts.heir_2,
            &ctx.accounts.heir_3, &ctx.accounts.heir_4, &ctx.accounts.heir_5,
            &ctx.accounts.heir_6, &ctx.accounts.heir_7, &ctx.accounts.heir_8,
            &ctx.accounts.heir_9,
        ].iter()
            .filter_map(|opt| opt.as_ref().map(|a| a.to_account_info()))
            .collect();

        let vault_lamports = vault.to_account_info().lamports();
        let available_sol = vault.available_sol(vault_lamports);
        
        if available_sol > 0 {
            let heirs = vault.heirs.clone();
            let keeper_fee_bps = vault.keeper_fee_bps;
            let system_program_info = ctx.accounts.system_program.to_account_info();
            
            let sol_heirs_indices: Vec<usize> = heirs.iter()
                .enumerate()
                .filter(|(_, h)| h.asset == SYSTEM_PROGRAM_ID)
                .map(|(i, _)| i)
                .collect();

            if !sol_heirs_indices.is_empty() {
                require!(
                    heir_accounts.len() >= sol_heirs_indices.len(),
                    CryptoHerancaError::InvalidRemainingAccounts
                );

                let mut remaining_sol = available_sol;
                let mut distributions: Vec<(usize, u64)> = Vec::new();

                for &heir_idx in &sol_heirs_indices {
                    let heir = &heirs[heir_idx];
                    if heir.allocation_type == AllocationType::FixedAmount {
                        let amount = std::cmp::min(heir.allocation_value, remaining_sol);
                        if amount > 0 {
                            distributions.push((heir_idx, amount));
                            remaining_sol = remaining_sol.checked_sub(amount)
                                .ok_or(CryptoHerancaError::MathOverflow)?;
                        }
                    }
                }

                for &heir_idx in &sol_heirs_indices {
                    let heir = &heirs[heir_idx];
                    if heir.allocation_type == AllocationType::Percentage {
                        let amount = (remaining_sol as u128)
                            .checked_mul(heir.allocation_value as u128)
                            .ok_or(CryptoHerancaError::MathOverflow)?
                            .checked_div(10_000)
                            .ok_or(CryptoHerancaError::MathOverflow)? as u64;
                        if amount > 0 {
                            distributions.push((heir_idx, amount));
                            remaining_sol = remaining_sol.checked_sub(amount)
                                .ok_or(CryptoHerancaError::MathOverflow)?;
                        }
                    }
                }

                if remaining_sol > 0 && !distributions.is_empty() {
                    distributions[0].1 = distributions[0].1.checked_add(remaining_sol)
                        .ok_or(CryptoHerancaError::MathOverflow)?;
                }

                let total_distributed: u64 = distributions.iter().map(|(_, amount)| amount).sum();
                let keeper_fee = if keeper_fee_bps > 0 {
                    (total_distributed as u128)
                        .checked_mul(keeper_fee_bps as u128)
                        .ok_or(CryptoHerancaError::MathOverflow)?
                        .checked_div(10_000)
                        .ok_or(CryptoHerancaError::MathOverflow)? as u64
                } else {
                    0
                };

                if keeper_fee > 0 && !distributions.is_empty() {
                    distributions[0].1 = distributions[0].1.saturating_sub(keeper_fee);
                }

                let vault_key = vault.key();
                let vault_bump = vault.bump;
                let vault_owner = vault.owner;
                let vault_seed = vault.seed;

                for (heir_idx, amount) in distributions {
                    if amount > 0 {
                        let heir = &heirs[heir_idx];
                        let heir_account = heir_accounts[heir_idx].clone();
                        
                        let ix = system_instruction::transfer(
                            &vault_key,
                            heir_account.key,
                            amount,
                        );
                        let seeds = &[
                            b"vault",
                            vault_owner.as_ref(),
                            &vault_seed.to_le_bytes(),
                            &[vault_bump],
                        ];
                        let signer_seeds = &[&seeds[..]];
                        
                        program::invoke_signed(
                            &ix,
                            &[heir_account, system_program_info.clone()],
                            signer_seeds,
                        )?;
                        
                        emit!(ClaimExecuted {
                            vault_address: vault_key,
                            asset: SYSTEM_PROGRAM_ID,
                            amount,
                            heir: heir.wallet,
                            keeper: executor.key(),
                        });
                    }
                }

                if keeper_fee > 0 {
                    let ix = system_instruction::transfer(
                        &vault_key,
                        executor.key,
                        keeper_fee,
                    );
                    let seeds = &[
                        b"vault",
                        vault_owner.as_ref(),
                        &vault_seed.to_le_bytes(),
                        &[vault_bump],
                    ];
                    let signer_seeds = &[&seeds[..]];
                    
                    program::invoke_signed(
                        &ix,
                        &[executor.to_account_info(), system_program_info.clone()],
                        signer_seeds,
                    )?;
                }
            }
        }

        if vault.gas_reserve_lamports > 0 {
            let gas_reimburse = std::cmp::min(
                vault.gas_reserve_lamports,
                vault.to_account_info().lamports().saturating_sub(1),
            );
            if gas_reimburse > 0 {
                **vault.to_account_info().try_borrow_mut_lamports()? = vault
                    .to_account_info().lamports()
                    .checked_sub(gas_reimburse)
                    .ok_or(CryptoHerancaError::MathOverflow)?;
                **executor.to_account_info().try_borrow_mut_lamports()? = executor
                    .to_account_info().lamports()
                    .checked_add(gas_reimburse)
                    .ok_or(CryptoHerancaError::MathOverflow)?;
            }
        }

        vault.status = VaultStatus::Claimed;

        Ok(())
    }

    #[derive(Accounts)]
    #[instruction(seed: u64)]
    pub struct InitializeVault<'info> {
        #[account(mut)]
        pub owner: Signer<'info>,
        #[account(init, payer = owner, space = 8 + Vault::INIT_SPACE, seeds = [b"vault", owner.key().as_ref(), seed.to_le_bytes().as_ref()], bump)]
        pub vault: Account<'info, Vault>,
        pub system_program: Program<'info, System>,
    }

    #[derive(Accounts)]
    pub struct InitializeTokenAccount<'info> {
        #[account(mut)]
        pub owner: Signer<'info>,
        #[account(seeds = [b"vault", vault.owner.as_ref(), vault.seed.to_le_bytes().as_ref()], bump = vault.bump, has_one = owner @ CryptoHerancaError::Unauthorized)]
        pub vault: Account<'info, Vault>,
        pub mint: Account<'info, Mint>,
        #[account(init, payer = owner, associated_token::mint = mint, associated_token::authority = vault)]
        pub vault_ata: Account<'info, TokenAccount>,
        pub token_program: Program<'info, Token>,
        pub associated_token_program: Program<'info, AssociatedToken>,
        pub system_program: Program<'info, System>,
        pub rent: Sysvar<'info, Rent>,
    }

    #[derive(Accounts)]
    pub struct DepositSol<'info> {
        #[account(mut)]
        pub owner: Signer<'info>,
        #[account(mut, seeds = [b"vault", vault.owner.as_ref(), vault.seed.to_le_bytes().as_ref()], bump = vault.bump, has_one = owner @ CryptoHerancaError::Unauthorized, constraint = vault.is_active() @ CryptoHerancaError::VaultNotActive)]
        pub vault: Account<'info, Vault>,
        pub system_program: Program<'info, System>,
    }

    #[derive(Accounts)]
    #[instruction(amount: u64)]
    pub struct DepositToken<'info> {
        #[account(mut)]
        pub owner: Signer<'info>,
        #[account(mut, seeds = [b"vault", vault.owner.as_ref(), vault.seed.to_le_bytes().as_ref()], bump = vault.bump, has_one = owner @ CryptoHerancaError::Unauthorized, constraint = vault.is_active() @ CryptoHerancaError::VaultNotActive)]
        pub vault: Account<'info, Vault>,
        pub mint: Account<'info, Mint>,
        #[account(mut, associated_token::mint = mint, associated_token::authority = owner)]
        pub owner_ata: Account<'info, TokenAccount>,
        #[account(mut, associated_token::mint = mint, associated_token::authority = vault)]
        pub vault_ata: Account<'info, TokenAccount>,
        pub token_program: Program<'info, Token>,
    }

    #[derive(Accounts)]
    pub struct Heartbeat<'info> {
        #[account(mut)]
        pub executor: Signer<'info>,
        #[account(mut, seeds = [b"vault", vault.owner.as_ref(), vault.seed.to_le_bytes().as_ref()], bump = vault.bump, constraint = vault.is_active() @ CryptoHerancaError::VaultNotActive)]
        pub vault: Account<'info, Vault>,
        pub system_program: Program<'info, System>,
    }

    #[derive(Accounts)]
    pub struct UpdateConfig<'info> {
        #[account(mut)]
        pub owner: Signer<'info>,
        #[account(mut, seeds = [b"vault", vault.owner.as_ref(), vault.seed.to_le_bytes().as_ref()], bump = vault.bump, has_one = owner @ CryptoHerancaError::Unauthorized, constraint = vault.is_active() @ CryptoHerancaError::VaultNotActive)]
        pub vault: Account<'info, Vault>,
    }

    #[derive(Accounts)]
    pub struct CancelVault<'info> {
        #[account(mut)]
        pub owner: Signer<'info>,
        #[account(mut, seeds = [b"vault", vault.owner.as_ref(), vault.seed.to_le_bytes().as_ref()], bump = vault.bump, has_one = owner @ CryptoHerancaError::Unauthorized, constraint = vault.is_active() @ CryptoHerancaError::VaultNotActive, close = owner)]
        pub vault: Account<'info, Vault>,
        pub system_program: Program<'info, System>,
    }

    #[derive(Accounts)]
    pub struct Claim<'info> {
        #[account(mut)]
        pub executor: Signer<'info>,
        #[account(mut, seeds = [b"vault", vault.owner.as_ref(), vault.seed.to_le_bytes().as_ref()], bump = vault.bump, constraint = vault.is_active() @ CryptoHerancaError::VaultNotActive)]
        pub vault: Account<'info, Vault>,
        pub token_program: Program<'info, Token>,
        pub associated_token_program: Program<'info, AssociatedToken>,
        pub system_program: Program<'info, System>,
        pub rent: Sysvar<'info, Rent>,
        // Herdeiros SOL (até 10, opcionais)
        #[account(mut)]
        pub heir_0: Option<AccountInfo<'info>>,
        #[account(mut)]
        pub heir_1: Option<AccountInfo<'info>>,
        #[account(mut)]
        pub heir_2: Option<AccountInfo<'info>>,
        #[account(mut)]
        pub heir_3: Option<AccountInfo<'info>>,
        #[account(mut)]
        pub heir_4: Option<AccountInfo<'info>>,
        #[account(mut)]
        pub heir_5: Option<AccountInfo<'info>>,
        #[account(mut)]
        pub heir_6: Option<AccountInfo<'info>>,
        #[account(mut)]
        pub heir_7: Option<AccountInfo<'info>>,
        #[account(mut)]
        pub heir_8: Option<AccountInfo<'info>>,
        #[account(mut)]
        pub heir_9: Option<AccountInfo<'info>>,
    }
}
