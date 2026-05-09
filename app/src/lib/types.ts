export type AttemptStatus = "allowed" | "blocked" | "failed";

export interface RedTeamProof {
  network: string;
  source: string;
  proof_type: string;
  program_id: string;
  policy: string;
  thesis: string;
  raw_wallet: {
    status: string;
    loss_amount: string;
    signature: string;
    explorer_url: string;
    verifier_classification: string;
  };
  vajra_allowance_vault: {
    status: string;
    loss_amount: string;
    avoided_loss: string;
    signature: string;
    explorer_url: string;
    rule_triggered: string;
    inner_token_transfers: number;
    vault_delta: string;
    verifier_classification: string;
  };
  allowed_payment: {
    signature: string;
    explorer_url: string;
    verifier_classification: string;
  };
  verifier: {
    allowed: { verified: boolean; classification: string; errors: string[] };
    raw_wallet: { verified: boolean; classification: string; errors: string[] };
    blocked: { verified: boolean; classification: string; errors: string[]; vault_delta: string; inner_token_transfers: number };
    expected_destination_mismatch: { verified: boolean; classification: string; errors: string[] };
  };
}

export interface Receipt {
  receipt_version?: string;
  receipt_id: string;
  created_at?: string;
  network: string;
  program_id?: string;
  signature: string;
  explorer_url?: string;
  policy?: string;
  policy_id?: string;
  agent?: string;
  owner?: string;
  vault?: string;
  mint?: string;
  source?: string;
  destination?: string;
  destination_label?: string;
  attempt_type: string;
  status: string;
  requested_amount?: string | number;
  actual_inner_transfer_amount?: string | number;
  vault_balance_before?: string | number;
  vault_balance_after?: string | number;
  vault_delta?: string | number;
  inner_token_transfers?: number;
  rule_triggered?: string;
  guard_error?: string;
  logs?: string[];
  verifier?: { verified: boolean; method?: string; checked_at?: string };
  receipt_hash?: string;
}

export interface AgentMandate {
  id: string;
  name: string;
  target_user: string;
  use_case: string;
  risk_model?: string;
  recommended_total_budget?: string;
  recommended_per_tx_cap?: string;
  recommended_period_budget?: string;
  recommended_velocity_limit?: string;
  recommended_expiry?: string;
  allowed_destination_model?: string;
  revoke_behavior?: string;
  verifier_notes?: string;
  sdk_snippet?: string;
  policy_config?: {
    totalBudget?: string;
    perTxCap?: string;
    periodBudget?: string;
    periodDurationSlots?: string;
    minSlotInterval?: string;
  };
}

export interface MerchantVerification {
  verified: boolean;
  expected_destination_check?: string;
  network?: string;
  source?: string;
  receipt?: Receipt;
}
export type WarRoomMode = "normal" | "compromised";
export type WarRoomState =
  | "idle"
  | "normal_animating"
  | "normal_success"
  | "compromised_idle"
  | "attack_animating"
  | "blocked"
  | "proof_revealed"
  | "revoked"
  | "reset";

export interface DevnetProofRecord {
  id?: string;
  signature: string;
  timestamp?: string;
  agentId?: string;
  action: string;
  status: AttemptStatus;
  reason?: string | null;
  vaultBalanceDelta: number;
  innerTransfers: number;
  explorerUrl?: string;
  rawLogs?: string[];
  amount?: number | string;
  destination?: string;
  ruleTriggered?: string;
  vaultBalanceBefore?: number | string;
  vaultBalanceAfter?: number | string;
  attemptType?: string;
}

export interface PolicyTemplate {
  id: string;
  name: string;
  description?: string;
  totalBudget?: string | number;
  perTxCap?: string | number;
  periodBudget?: string | number;
  periodDurationSlots?: string | number;
  minSlotInterval?: string | number;
  destinations?: string[];
}

export interface SdkSnippet {
  id: string;
  title: string;
  language: string;
  code: string;
  description?: string;
}

export interface ProofSummary {
  totalAttempts: number;
  blockedCount: number;
  allowedCount: number;
  vaultDeltaOnBlocked: number;
  innerTransfersOnBlocked: number;
  avoidedLoss: number;
}

export interface WarRoomAttempt {
  id: string;
  label: string;
  description: string;
  mode: "normal" | "attack";
  amount: number;
  destination: "merchant" | "attacker";
  expectedResult: AttemptStatus;
  ruleTriggered?: string;
  terminalLines: string[];
}
