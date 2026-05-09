use anchor_lang::prelude::*;

use crate::errors::VajraError;
use crate::events::PolicyCreated;
use crate::state::{PolicyPDA, MAX_FEE_BPS, POLICY_SEED};

#[derive(Accounts)]
#[instruction(policy_id: u64)]
pub struct CreatePolicy<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + PolicyPDA::INIT_SPACE,
        seeds = [POLICY_SEED, owner.key().as_ref(), &policy_id.to_le_bytes()],
        bump
    )]
    pub policy: Account<'info, PolicyPDA>,

    pub system_program: Program<'info, System>,
}

pub fn create_policy(
    ctx: Context<CreatePolicy>,
    policy_id: u64,
    delegated_signer: Pubkey,
    allowed_mint: Pubkey,
    total_budget: u64,
    per_tx_cap: u64,
    expiry_slot: u64,
    period_budget: u64,
    period_duration_slots: u64,
    min_slot_interval: u64,
    fee_bps: u16,
    fee_recipient: Pubkey,
) -> Result<()> {
    require!(
        total_budget > 0 && per_tx_cap > 0 && per_tx_cap <= total_budget,
        VajraError::InvalidBudget
    );
    require!(fee_bps <= MAX_FEE_BPS, VajraError::FeeBpsTooHigh);

    let clock = Clock::get()?;
    require!(expiry_slot > clock.slot, VajraError::ExpiryInPast);

    let policy = &mut ctx.accounts.policy;
    policy.owner = ctx.accounts.owner.key();
    policy.delegated_signer = delegated_signer;
    policy.allowed_mint = allowed_mint;
    policy.total_budget = total_budget;
    policy.spent_amount = 0;
    policy.per_tx_cap = per_tx_cap;
    policy.expiry_slot = expiry_slot;
    policy.revoked = false;
    policy.policy_id = policy_id;
    policy.bump = ctx.bumps.policy;
    policy.policy_version = 1;
    policy.period_budget = period_budget;
    policy.period_spent = 0;
    policy.period_start_slot = clock.slot;
    policy.period_duration_slots = period_duration_slots;
    policy.min_slot_interval = min_slot_interval;
    policy.last_spend_slot = 0;
    policy.fee_bps = fee_bps;
    policy.fee_recipient = fee_recipient;

    emit!(PolicyCreated {
        policy: policy.key(),
        owner: policy.owner,
        delegated_signer: policy.delegated_signer,
        allowed_mint: policy.allowed_mint,
        total_budget: policy.total_budget,
        per_tx_cap: policy.per_tx_cap,
        expiry_slot: policy.expiry_slot,
        policy_id: policy.policy_id,
    });

    Ok(())
}
