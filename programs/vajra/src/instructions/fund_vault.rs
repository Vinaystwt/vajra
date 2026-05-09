use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, ID as TOKEN_ID};

use crate::errors::VajraError;
use crate::events::VaultFunded;
use crate::state::PolicyPDA;

#[derive(Accounts)]
pub struct FundVault<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,

    #[account(
        mut,
        constraint = funder_token_account.mint == policy.allowed_mint @ VajraError::MintMismatch,
        constraint = funder_token_account.owner == funder.key() @ VajraError::Unauthorized,
    )]
    pub funder_token_account: Account<'info, TokenAccount>,

    #[account()]
    pub policy: Account<'info, PolicyPDA>,

    #[account(
        init_if_needed,
        payer = funder,
        associated_token::mint = allowed_mint,
        associated_token::authority = policy,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub allowed_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn fund_vault(ctx: Context<FundVault>, amount: u64) -> Result<()> {
    require!(amount > 0, VajraError::AmountZero);
    require!(
        ctx.accounts.allowed_mint.key() == ctx.accounts.policy.allowed_mint,
        VajraError::MintMismatch
    );

    let cpi_accounts = Transfer {
        from: ctx.accounts.funder_token_account.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
        authority: ctx.accounts.funder.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(TOKEN_ID, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    emit!(VaultFunded {
        policy: ctx.accounts.policy.key(),
        vault: ctx.accounts.vault.key(),
        amount,
        funder: ctx.accounts.funder.key(),
    });

    Ok(())
}
