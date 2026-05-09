use anchor_lang::prelude::*;

#[error_code]
pub enum VajraError {
    #[msg("Budget must be > 0 and per_tx_cap must be > 0 and <= total_budget")]
    InvalidBudget,
    #[msg("Expiry slot must be in the future")]
    ExpiryInPast,
    #[msg("Unauthorized: caller is not the policy owner")]
    Unauthorized,
    #[msg("Policy has been revoked")]
    PolicyRevoked,
    #[msg("Policy has expired")]
    PolicyExpired,
    #[msg("Invalid delegated signer")]
    InvalidDelegateSigner,
    #[msg("Amount must be > 0")]
    AmountZero,
    #[msg("Amount exceeds per-transaction cap")]
    PerTxCapExceeded,
    #[msg("Transfer would exceed total budget")]
    TotalBudgetExceeded,
    #[msg("Destination is not on the allowlist")]
    DestinationNotAllowed,
    #[msg("Token mint does not match policy allowed_mint")]
    MintMismatch,
    #[msg("Vault mint does not match policy allowed_mint")]
    VaultMintMismatch,
    #[msg("Vault authority is not the policy PDA")]
    InvalidVaultAuthority,
    #[msg("Vault has insufficient balance")]
    VaultInsufficientBalance,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Destination already exists in allowlist")]
    DestinationAlreadyExists,
    #[msg("Transfer would exceed the current period budget")]
    PeriodBudgetExceeded,
    #[msg("Transfer violates the policy velocity limit")]
    VelocityLimitExceeded,
    #[msg("Fee basis points exceed the maximum allowed value")]
    FeeBpsTooHigh,
    #[msg("Withdrawal destination must be owned by the policy owner")]
    InvalidWithdrawalDestination,
}
