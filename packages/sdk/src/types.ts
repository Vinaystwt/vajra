import type { Keypair, PublicKey, TransactionSignature } from "@solana/web3.js";

export type ClusterName = "localnet" | "devnet" | "testnet" | "mainnet-beta";
export type ReceiptNetwork = ClusterName | "fixture";

export interface SignerWallet {
  publicKey: PublicKey;
  payer?: Keypair;
  signTransaction?: (tx: any) => Promise<any>;
  signAllTransactions?: (txs: any[]) => Promise<any[]>;
}

export interface VajraClientConfig {
  connection: import("@solana/web3.js").Connection;
  wallet: SignerWallet;
  programId?: PublicKey;
  cluster?: ClusterName;
  commitment?: import("@solana/web3.js").Commitment;
}

export interface CreatePolicyInput {
  policyId: bigint | number | string;
  delegatedSigner: PublicKey;
  allowedMint: PublicKey;
  totalBudget: bigint | number | string;
  perTxCap: bigint | number | string;
  expirySlot: bigint | number | string;
  periodBudget?: bigint | number | string;
  periodDurationSlots?: bigint | number | string;
  minSlotInterval?: bigint | number | string;
  feeBps?: number;
  feeRecipient?: PublicKey;
}

export interface FundVaultInput {
  policy: PublicKey;
  allowedMint: PublicKey;
  funderTokenAccount: PublicKey;
  amount: bigint | number | string;
}

export interface AddDestinationInput {
  policy: PublicKey;
  destinationTokenAccount: PublicKey;
}

export interface SpendInput {
  policy: PublicKey;
  mint: PublicKey;
  destinationTokenAccount: PublicKey;
  amount: bigint | number | string;
  skipPreflight?: boolean;
}

export interface SimulationInput {
  policy: PublicKey;
  mint: PublicKey;
  destinationTokenAccount: PublicKey;
  amount: bigint | number | string;
  useOnchainSimulation?: boolean;
}

export interface WithdrawInput {
  policy: PublicKey;
  mint: PublicKey;
  destinationTokenAccount: PublicKey;
  amount: bigint | number | string;
}

export interface PolicyState {
  address: PublicKey;
  owner: PublicKey;
  delegatedSigner: PublicKey;
  allowedMint: PublicKey;
  totalBudget: bigint;
  spentAmount: bigint;
  perTxCap: bigint;
  expirySlot: bigint;
  revoked: boolean;
  policyId: bigint;
  bump: number;
  policyVersion: number;
  periodBudget: bigint;
  periodSpent: bigint;
  periodStartSlot: bigint;
  periodDurationSlots: bigint;
  minSlotInterval: bigint;
  lastSpendSlot: bigint;
  feeBps: number;
  feeRecipient: PublicKey;
}

export interface AuditEntry {
  signature: TransactionSignature;
  slot: number;
  blockTime: number | null;
  err: unknown;
  memo: string | null;
}

export interface SpendResult {
  signature: TransactionSignature;
  explorerUrl: string;
  policy: PublicKey;
  destination: PublicKey;
  amount: bigint;
}

export interface SimulationResult {
  ok: boolean;
  reason: string;
  ruleTriggered?: string;
  wouldResetPeriod?: boolean;
  policy?: PolicyState;
  logs?: string[];
}

export interface VajraError {
  code?: number;
  name: string;
  message: string;
  ruleTriggered?: string;
}

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  fields: Pick<
    CreatePolicyInput,
    | "totalBudget"
    | "perTxCap"
    | "periodBudget"
    | "periodDurationSlots"
    | "minSlotInterval"
  >;
}

export interface RiskScore {
  score: number;
  level: "low" | "medium" | "high";
  reasons: string[];
}

export type ReceiptAttemptType =
  | "allowed_spend"
  | "blocked_spend"
  | "raw_wallet_drain"
  | "verification_only";

export type ReceiptStatus =
  | "allowed"
  | "blocked"
  | "failed"
  | "raw_wallet_drained"
  | "not_vajra"
  | "unknown";

export interface ReceiptVerifierInfo {
  verified: boolean;
  method: string;
  checked_at: string;
}

export interface VajraReceipt {
  receipt_version: "1.0";
  receipt_id: string;
  created_at: string;
  network: ReceiptNetwork;
  program_id: string;
  signature: string;
  explorer_url: string;
  policy: string;
  policy_id: string;
  agent: string;
  owner: string;
  vault: string;
  mint: string;
  source: string;
  destination: string;
  destination_label: string;
  attempt_type: ReceiptAttemptType;
  status: ReceiptStatus;
  requested_amount: string;
  actual_inner_transfer_amount: string;
  vault_balance_before: string;
  vault_balance_after: string;
  vault_delta: string;
  inner_token_transfers: number;
  rule_triggered: string;
  guard_error: string;
  logs: string[];
  raw_transaction_summary: Record<string, unknown>;
  receipt_hash: string;
  verifier: ReceiptVerifierInfo;
}

export type VajraReceiptInput = Partial<VajraReceipt> &
  Pick<
    VajraReceipt,
    | "network"
    | "program_id"
    | "signature"
    | "attempt_type"
    | "status"
    | "requested_amount"
  >;

export interface VerifyPaymentOptions {
  expectedProgramId?: PublicKey | string;
  expectedPolicy?: PublicKey | string;
  expectedVault?: PublicKey | string;
  expectedDestination?: PublicKey | string;
  expectedMint?: PublicKey | string;
  expectedAmount?: string | number | bigint;
  network?: ReceiptNetwork;
}

export type VajraPaymentClassification =
  | "vajra_allowed"
  | "vajra_blocked"
  | "not_vajra"
  | "unknown";

export interface VerifyPaymentResult {
  verified: boolean;
  classification: VajraPaymentClassification;
  signature: string;
  explorerUrl: string;
  policy?: string;
  vault?: string;
  agent?: string;
  destination?: string;
  amount?: string;
  status?: ReceiptStatus;
  ruleTriggered?: string;
  vaultDelta?: string;
  innerTokenTransfers?: number;
  errors: string[];
  receipt: VajraReceipt;
}

export interface VajraTransactionFixture {
  signature: string;
  network: ReceiptNetwork;
  programId: string;
  err: unknown;
  logs?: string[];
  policy?: string;
  policyId?: string;
  owner?: string;
  agent?: string;
  vault?: string;
  mint?: string;
  source?: string;
  destination?: string;
  destinationLabel?: string;
  requestedAmount?: string;
  actualInnerTransferAmount?: string;
  vaultBalanceBefore?: string;
  vaultBalanceAfter?: string;
  innerTokenTransfers?: number;
  ruleTriggered?: string;
  guardError?: string;
}

export interface AgentMandate {
  id: string;
  name: string;
  target_user: string;
  use_case: string;
  risk_model: string;
  recommended_total_budget: string;
  recommended_per_tx_cap: string;
  recommended_period_budget: string;
  recommended_velocity_limit: string;
  recommended_expiry: string;
  allowed_destination_model: string;
  revoke_behavior: string;
  verifier_notes: string;
  sdk_snippet: string;
  demo_receipt_reference?: string;
}
