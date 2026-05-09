use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, ID as TOKEN_ID};

use crate::errors::VajraError;
use crate::events::{
    PeriodReset, SimulationChecked, SpendAllowed, TransferAllowed, VelocityLimitTriggered,
};
use crate::state::{PolicyPDA, DEST_SEED, POLICY_SEED};

#[derive(Accounts)]
pub struct ExecuteGuardedTransfer<'info> {
    pub delegated_signer: Signer<'info>,

    #[account(mut)]
    pub policy: Account<'info, PolicyPDA>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub destination_token_account: Account<'info, TokenAccount>,

    /// CHECK: manually verified inside handler — allows custom DestinationNotAllowed error
    pub destination_rule: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SimulateGuardedTransfer<'info> {
    pub delegated_signer: Signer<'info>,

    pub policy: Account<'info, PolicyPDA>,

    pub vault: Account<'info, TokenAccount>,

    pub destination_token_account: Account<'info, TokenAccount>,

    /// CHECK: manually verified inside handler so simulation returns the Vajra guard error.
    pub destination_rule: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

struct GuardOutcome {
    new_spent: u64,
    new_period_spent: u64,
    period_reset: bool,
    period_start_slot: u64,
}

fn validate_guarded_transfer<'info>(
    program_id: &Pubkey,
    delegated_signer: Pubkey,
    policy: &PolicyPDA,
    policy_key: Pubkey,
    vault: &TokenAccount,
    destination_token_account: &TokenAccount,
    destination_key: Pubkey,
    destination_rule: &UncheckedAccount<'info>,
    amount: u64,
) -> Result<GuardOutcome> {
    msg!("VAJRA_GUARD:1:revoked_check");
    require!(!policy.revoked, VajraError::PolicyRevoked);

    msg!("VAJRA_GUARD:2:expiry_check");
    let clock = Clock::get()?;
    require!(clock.slot <= policy.expiry_slot, VajraError::PolicyExpired);

    msg!("VAJRA_GUARD:3:signer_check");
    require!(
        delegated_signer == policy.delegated_signer,
        VajraError::InvalidDelegateSigner
    );

    msg!("VAJRA_GUARD:4:amount_zero_check");
    require!(amount > 0, VajraError::AmountZero);

    msg!("VAJRA_GUARD:5:per_tx_cap_check");
    require!(amount <= policy.per_tx_cap, VajraError::PerTxCapExceeded);

    msg!("VAJRA_GUARD:6:budget_check");
    let new_spent = policy
        .spent_amount
        .checked_add(amount)
        .ok_or(VajraError::ArithmeticOverflow)?;
    require!(
        new_spent <= policy.total_budget,
        VajraError::TotalBudgetExceeded
    );

    let mut period_spent = policy.period_spent;
    let mut period_start_slot = policy.period_start_slot;
    let mut period_reset = false;

    msg!("VAJRA_GUARD:6B:period_budget_check");
    if policy.period_duration_slots != 0 && policy.period_budget != 0 {
        let period_end = policy
            .period_start_slot
            .checked_add(policy.period_duration_slots)
            .ok_or(VajraError::ArithmeticOverflow)?;
        if clock.slot >= period_end {
            period_spent = 0;
            period_start_slot = clock.slot;
            period_reset = true;
        }

        let new_period_spent = period_spent
            .checked_add(amount)
            .ok_or(VajraError::ArithmeticOverflow)?;
        require!(
            new_period_spent <= policy.period_budget,
            VajraError::PeriodBudgetExceeded
        );
        period_spent = new_period_spent;
    }

    msg!("VAJRA_GUARD:6C:velocity_check");
    if policy.min_slot_interval != 0 && policy.last_spend_slot != 0 {
        let next_allowed_slot = policy
            .last_spend_slot
            .checked_add(policy.min_slot_interval)
            .ok_or(VajraError::ArithmeticOverflow)?;
        if clock.slot < next_allowed_slot {
            emit!(VelocityLimitTriggered {
                policy: policy_key,
                last_spend_slot: policy.last_spend_slot,
                min_slot_interval: policy.min_slot_interval,
                current_slot: clock.slot,
            });
            return err!(VajraError::VelocityLimitExceeded);
        }
    }

    msg!("VAJRA_GUARD:7:destination_rule_check");
    let (expected_rule, _) = Pubkey::find_program_address(
        &[DEST_SEED, policy_key.as_ref(), destination_key.as_ref()],
        program_id,
    );
    require!(
        destination_rule.key() == expected_rule,
        VajraError::DestinationNotAllowed
    );
    require!(
        destination_rule.owner == program_id && !destination_rule.data_is_empty(),
        VajraError::DestinationNotAllowed
    );

    msg!("VAJRA_GUARD:8:destination_mint_check");
    require!(
        destination_token_account.mint == policy.allowed_mint,
        VajraError::MintMismatch
    );

    msg!("VAJRA_GUARD:9:vault_mint_check");
    require!(
        vault.mint == policy.allowed_mint,
        VajraError::VaultMintMismatch
    );

    msg!("VAJRA_GUARD:10:vault_owner_check");
    require!(vault.owner == policy_key, VajraError::InvalidVaultAuthority);

    msg!("VAJRA_GUARD:11:vault_balance_check");
    require!(vault.amount >= amount, VajraError::VaultInsufficientBalance);

    Ok(GuardOutcome {
        new_spent,
        new_period_spent: period_spent,
        period_reset,
        period_start_slot,
    })
}

pub fn execute_guarded_transfer(ctx: Context<ExecuteGuardedTransfer>, amount: u64) -> Result<()> {
    let policy = &ctx.accounts.policy;
    let clock = Clock::get()?;
    let policy_key = policy.key();
    let outcome = validate_guarded_transfer(
        ctx.program_id,
        ctx.accounts.delegated_signer.key(),
        policy,
        policy_key,
        &ctx.accounts.vault,
        &ctx.accounts.destination_token_account,
        ctx.accounts.destination_token_account.key(),
        &ctx.accounts.destination_rule,
        amount,
    )?;

    if outcome.period_reset {
        emit!(PeriodReset {
            policy: policy_key,
            previous_start_slot: policy.period_start_slot,
            new_start_slot: outcome.period_start_slot,
        });
    }

    msg!("VAJRA_GUARD:12:all_clear_cpi_transfer");
    let owner_key = policy.owner;
    let policy_id_bytes = policy.policy_id.to_le_bytes();
    let bump = policy.bump;
    let signer_seeds: &[&[&[u8]]] =
        &[&[POLICY_SEED, owner_key.as_ref(), &policy_id_bytes, &[bump]]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to: ctx.accounts.destination_token_account.to_account_info(),
        authority: ctx.accounts.policy.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(TOKEN_ID, cpi_accounts, signer_seeds);
    token::transfer(cpi_ctx, amount)?;

    let policy = &mut ctx.accounts.policy;
    policy.spent_amount = outcome.new_spent;
    policy.period_spent = outcome.new_period_spent;
    policy.period_start_slot = outcome.period_start_slot;
    policy.last_spend_slot = clock.slot;

    emit!(SpendAllowed {
        policy: policy.key(),
        destination: ctx.accounts.destination_token_account.key(),
        amount,
        spent_amount: policy.spent_amount,
    });
    emit!(TransferAllowed {
        policy: policy.key(),
        destination: ctx.accounts.destination_token_account.key(),
        amount,
        spent_amount: policy.spent_amount,
        period_spent: policy.period_spent,
        slot: clock.slot,
    });

    Ok(())
}

pub fn simulate_guarded_transfer(ctx: Context<SimulateGuardedTransfer>, amount: u64) -> Result<()> {
    let policy = &ctx.accounts.policy;
    let clock = Clock::get()?;
    let outcome = validate_guarded_transfer(
        ctx.program_id,
        ctx.accounts.delegated_signer.key(),
        policy,
        policy.key(),
        &ctx.accounts.vault,
        &ctx.accounts.destination_token_account,
        ctx.accounts.destination_token_account.key(),
        &ctx.accounts.destination_rule,
        amount,
    );

    let outcome = outcome?;

    emit!(SimulationChecked {
        policy: policy.key(),
        destination: ctx.accounts.destination_token_account.key(),
        amount,
        would_reset_period: outcome.period_reset,
        current_slot: clock.slot,
    });

    Ok(())
}
