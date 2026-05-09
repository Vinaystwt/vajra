use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

use crate::errors::VajraError;
use crate::events::DestinationAdded;
use crate::state::{DestinationRulePDA, PolicyPDA, DEST_SEED};

#[derive(Accounts)]
pub struct AddDestination<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        constraint = policy.owner == owner.key() @ VajraError::Unauthorized,
        constraint = !policy.revoked @ VajraError::PolicyRevoked,
    )]
    pub policy: Account<'info, PolicyPDA>,

    #[account(
        constraint = destination_token_account.mint == policy.allowed_mint @ VajraError::MintMismatch,
    )]
    pub destination_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = owner,
        space = 8 + DestinationRulePDA::INIT_SPACE,
        seeds = [DEST_SEED, policy.key().as_ref(), destination_token_account.key().as_ref()],
        bump
    )]
    pub destination_rule: Account<'info, DestinationRulePDA>,

    pub system_program: Program<'info, System>,
}

pub fn add_destination(ctx: Context<AddDestination>) -> Result<()> {
    let rule = &mut ctx.accounts.destination_rule;
    rule.policy = ctx.accounts.policy.key();
    rule.destination = ctx.accounts.destination_token_account.key();
    rule.bump = ctx.bumps.destination_rule;

    emit!(DestinationAdded {
        policy: ctx.accounts.policy.key(),
        destination: ctx.accounts.destination_token_account.key(),
    });

    Ok(())
}
