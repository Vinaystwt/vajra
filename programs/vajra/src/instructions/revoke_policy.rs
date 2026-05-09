use anchor_lang::prelude::*;

use crate::errors::VajraError;
use crate::events::PolicyRevoked;
use crate::state::PolicyPDA;

#[derive(Accounts)]
pub struct RevokePolicy<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = policy.owner == owner.key() @ VajraError::Unauthorized,
    )]
    pub policy: Account<'info, PolicyPDA>,
}

pub fn revoke_policy(ctx: Context<RevokePolicy>) -> Result<()> {
    let policy = &mut ctx.accounts.policy;
    policy.revoked = true;
    policy.policy_version = policy
        .policy_version
        .checked_add(1)
        .ok_or(VajraError::ArithmeticOverflow)?;

    emit!(PolicyRevoked {
        policy: policy.key(),
    });

    Ok(())
}
