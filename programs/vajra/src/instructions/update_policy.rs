use anchor_lang::prelude::*;

use crate::errors::VajraError;
use crate::events::PolicyUpdated;
use crate::state::{PolicyPDA, MAX_FEE_BPS};

#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = policy.owner == owner.key() @ VajraError::Unauthorized,
        constraint = !policy.revoked @ VajraError::PolicyRevoked,
    )]
    pub policy: Account<'info, PolicyPDA>,
}

pub fn update_policy(
    ctx: Context<UpdatePolicy>,
    new_delegated_signer: Option<Pubkey>,
    new_per_tx_cap: Option<u64>,
    new_expiry_slot: Option<u64>,
    new_period_budget: Option<u64>,
    new_period_duration_slots: Option<u64>,
    new_min_slot_interval: Option<u64>,
    new_fee_bps: Option<u16>,
    new_fee_recipient: Option<Pubkey>,
) -> Result<()> {
    let policy = &mut ctx.accounts.policy;

    if let Some(cap) = new_per_tx_cap {
        require!(
            cap > 0 && cap <= policy.total_budget,
            VajraError::InvalidBudget
        );
        policy.per_tx_cap = cap;
    }

    if let Some(expiry) = new_expiry_slot {
        let clock = Clock::get()?;
        require!(expiry > clock.slot, VajraError::ExpiryInPast);
        policy.expiry_slot = expiry;
    }

    if let Some(signer) = new_delegated_signer {
        policy.delegated_signer = signer;
    }

    if let Some(period_budget) = new_period_budget {
        policy.period_budget = period_budget;
        policy.period_spent = 0;
        policy.period_start_slot = Clock::get()?.slot;
    }

    if let Some(period_duration_slots) = new_period_duration_slots {
        policy.period_duration_slots = period_duration_slots;
        policy.period_spent = 0;
        policy.period_start_slot = Clock::get()?.slot;
    }

    if let Some(min_slot_interval) = new_min_slot_interval {
        policy.min_slot_interval = min_slot_interval;
    }

    if let Some(fee_bps) = new_fee_bps {
        require!(fee_bps <= MAX_FEE_BPS, VajraError::FeeBpsTooHigh);
        policy.fee_bps = fee_bps;
    }

    if let Some(fee_recipient) = new_fee_recipient {
        policy.fee_recipient = fee_recipient;
    }

    policy.policy_version = policy
        .policy_version
        .checked_add(1)
        .ok_or(VajraError::ArithmeticOverflow)?;

    emit!(PolicyUpdated {
        policy: policy.key(),
        policy_version: policy.policy_version,
    });

    Ok(())
}
