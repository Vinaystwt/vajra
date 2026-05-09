use anchor_lang::prelude::*;

pub const POLICY_SEED: &[u8] = b"vajra_policy";
pub const DEST_SEED: &[u8] = b"vajra_dest";
pub const MAX_FEE_BPS: u16 = 1_000;

#[account]
#[derive(InitSpace)]
pub struct PolicyPDA {
    pub owner: Pubkey,
    pub delegated_signer: Pubkey,
    pub allowed_mint: Pubkey,
    pub total_budget: u64,
    pub spent_amount: u64,
    pub per_tx_cap: u64,
    pub expiry_slot: u64,
    pub revoked: bool,
    pub policy_id: u64,
    pub bump: u8,
    pub policy_version: u8,
    pub period_budget: u64,
    pub period_spent: u64,
    pub period_start_slot: u64,
    pub period_duration_slots: u64,
    pub min_slot_interval: u64,
    pub last_spend_slot: u64,
    pub fee_bps: u16,
    pub fee_recipient: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct DestinationRulePDA {
    pub policy: Pubkey,
    pub destination: Pubkey,
    pub bump: u8,
}
