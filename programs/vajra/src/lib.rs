pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use errors::*;
pub use events::*;
pub use instructions::*;
pub use state::*;

declare_id!("APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD");

#[program]
pub mod vajra {
    use super::*;

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
        instructions::create_policy::create_policy(
            ctx,
            policy_id,
            delegated_signer,
            allowed_mint,
            total_budget,
            per_tx_cap,
            expiry_slot,
            period_budget,
            period_duration_slots,
            min_slot_interval,
            fee_bps,
            fee_recipient,
        )
    }

    pub fn fund_vault(ctx: Context<FundVault>, amount: u64) -> Result<()> {
        instructions::fund_vault::fund_vault(ctx, amount)
    }

    pub fn add_destination(ctx: Context<AddDestination>) -> Result<()> {
        instructions::add_destination::add_destination(ctx)
    }

    pub fn execute_guarded_transfer(
        ctx: Context<ExecuteGuardedTransfer>,
        amount: u64,
    ) -> Result<()> {
        instructions::execute_guarded_transfer::execute_guarded_transfer(ctx, amount)
    }

    pub fn simulate_guarded_transfer(
        ctx: Context<SimulateGuardedTransfer>,
        amount: u64,
    ) -> Result<()> {
        instructions::execute_guarded_transfer::simulate_guarded_transfer(ctx, amount)
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
        instructions::update_policy::update_policy(
            ctx,
            new_delegated_signer,
            new_per_tx_cap,
            new_expiry_slot,
            new_period_budget,
            new_period_duration_slots,
            new_min_slot_interval,
            new_fee_bps,
            new_fee_recipient,
        )
    }

    pub fn revoke_policy(ctx: Context<RevokePolicy>) -> Result<()> {
        instructions::revoke_policy::revoke_policy(ctx)
    }

    pub fn withdraw_funds(ctx: Context<WithdrawFunds>, amount: u64) -> Result<()> {
        instructions::withdraw_funds::withdraw_funds(ctx, amount)
    }
}
