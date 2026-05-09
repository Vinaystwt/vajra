use anchor_lang::prelude::*;

#[event]
pub struct PolicyCreated {
    pub policy: Pubkey,
    pub owner: Pubkey,
    pub delegated_signer: Pubkey,
    pub allowed_mint: Pubkey,
    pub total_budget: u64,
    pub per_tx_cap: u64,
    pub expiry_slot: u64,
    pub policy_id: u64,
}

#[event]
pub struct VaultFunded {
    pub policy: Pubkey,
    pub vault: Pubkey,
    pub amount: u64,
    pub funder: Pubkey,
}

#[event]
pub struct DestinationAdded {
    pub policy: Pubkey,
    pub destination: Pubkey,
}

#[event]
pub struct SpendAllowed {
    pub policy: Pubkey,
    pub destination: Pubkey,
    pub amount: u64,
    pub spent_amount: u64,
}

#[event]
pub struct TransferAllowed {
    pub policy: Pubkey,
    pub destination: Pubkey,
    pub amount: u64,
    pub spent_amount: u64,
    pub period_spent: u64,
    pub slot: u64,
}

#[event]
pub struct PolicyUpdated {
    pub policy: Pubkey,
    pub policy_version: u8,
}

#[event]
pub struct PolicyRevoked {
    pub policy: Pubkey,
}

#[event]
pub struct FundsWithdrawn {
    pub policy: Pubkey,
    pub vault: Pubkey,
    pub destination: Pubkey,
    pub amount: u64,
}

#[event]
pub struct PeriodReset {
    pub policy: Pubkey,
    pub previous_start_slot: u64,
    pub new_start_slot: u64,
}

#[event]
pub struct VelocityLimitTriggered {
    pub policy: Pubkey,
    pub last_spend_slot: u64,
    pub min_slot_interval: u64,
    pub current_slot: u64,
}

#[event]
pub struct SimulationChecked {
    pub policy: Pubkey,
    pub destination: Pubkey,
    pub amount: u64,
    pub would_reset_period: bool,
    pub current_slot: u64,
}
