use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, ID as TOKEN_ID};

use crate::errors::VajraError;
use crate::events::FundsWithdrawn;
use crate::state::{PolicyPDA, POLICY_SEED};

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    pub owner: Signer<'info>,

    #[account(
        constraint = policy.owner == owner.key() @ VajraError::Unauthorized,
    )]
    pub policy: Account<'info, PolicyPDA>,

    #[account(
        mut,
        constraint = vault.mint == policy.allowed_mint @ VajraError::VaultMintMismatch,
        constraint = vault.owner == policy.key() @ VajraError::InvalidVaultAuthority,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = destination_token_account.mint == policy.allowed_mint @ VajraError::MintMismatch,
        constraint = destination_token_account.owner == owner.key() @ VajraError::InvalidWithdrawalDestination,
    )]
    pub destination_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn withdraw_funds(ctx: Context<WithdrawFunds>, amount: u64) -> Result<()> {
    require!(amount > 0, VajraError::AmountZero);
    require!(
        ctx.accounts.vault.amount >= amount,
        VajraError::VaultInsufficientBalance
    );

    let owner_key = ctx.accounts.policy.owner;
    let policy_id_bytes = ctx.accounts.policy.policy_id.to_le_bytes();
    let bump = ctx.accounts.policy.bump;
    let signer_seeds: &[&[&[u8]]] =
        &[&[POLICY_SEED, owner_key.as_ref(), &policy_id_bytes, &[bump]]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to: ctx.accounts.destination_token_account.to_account_info(),
        authority: ctx.accounts.policy.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(TOKEN_ID, cpi_accounts, signer_seeds);
    token::transfer(cpi_ctx, amount)?;

    emit!(FundsWithdrawn {
        policy: ctx.accounts.policy.key(),
        vault: ctx.accounts.vault.key(),
        destination: ctx.accounts.destination_token_account.key(),
        amount,
    });

    Ok(())
}
