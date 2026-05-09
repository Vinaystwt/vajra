import type { DevnetProofRecord, PolicyTemplate, WarRoomAttempt, RedTeamProof, Receipt, AgentMandate, MerchantVerification } from "./types";
import { normalizeAttempts } from "./normalizeProofs";

export async function loadDevnetProofs(): Promise<DevnetProofRecord[]> {
  try {
    const res = await fetch("/devnet-proof.json");
    if (!res.ok) throw new Error("not found");
    const raw = await res.json();
    return normalizeAttempts(raw);
  } catch {
    return FALLBACK_PROOFS;
  }
}

export async function loadPolicyTemplates(): Promise<PolicyTemplate[]> {
  try {
    const res = await fetch("/policy-templates.json");
    if (!res.ok) throw new Error("not found");
    const raw = await res.json();
    return (Array.isArray(raw) ? raw : []).map((t: PolicyTemplate) => ({
      id: t.id ?? "unknown",
      name: t.name ?? t.id,
      description: t.description,
      totalBudget: t.totalBudget,
      perTxCap: t.perTxCap,
      periodBudget: t.periodBudget,
      periodDurationSlots: t.periodDurationSlots,
      minSlotInterval: t.minSlotInterval,
    }));
  } catch {
    return [];
  }
}

export async function loadRedTeamProof(): Promise<RedTeamProof | null> {
  try {
    const res = await fetch("/devnet-red-team-proof.json");
    if (!res.ok) throw new Error("not found");
    const raw = await res.json();
    // If .comparison exists, use that; otherwise use root
    const data: RedTeamProof = raw.comparison ?? raw;
    return data;
  } catch {
    return null;
  }
}

export async function loadReceipts(): Promise<Receipt[]> {
  try {
    const res = await fetch("/receipts.latest.json");
    if (!res.ok) throw new Error("not found");
    const raw = await res.json();
    const arr: Receipt[] = Array.isArray(raw) ? raw : [];
    return arr.map((r) => ({
      ...r,
      receipt_id: r.receipt_id ?? r.signature,
    }));
  } catch {
    return [];
  }
}

export async function loadAgentMandates(): Promise<AgentMandate[]> {
  try {
    const res = await fetch("/agent-mandates.json");
    if (!res.ok) throw new Error("not found");
    const raw = await res.json();
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export async function loadMerchantVerification(): Promise<MerchantVerification | null> {
  try {
    const res = await fetch("/merchant-verification.example.json");
    if (!res.ok) throw new Error("not found");
    return await res.json();
  } catch {
    return null;
  }
}

export async function loadSdkSnippets(): Promise<Record<string, string>> {
  try {
    const res = await fetch("/sdk-snippets.json");
    if (!res.ok) throw new Error("not found");
    return await res.json();
  } catch {
    return {};
  }
}

// ─── Fallback proof data ────────────────────────────────────────────────────

const FALLBACK_PROOFS: DevnetProofRecord[] = [
  {
    id: "24SD6Cdp",
    signature: "24SD6CdpkJqJj5EHW2cMULVoXU5qwURrgohidQ25jhLPLYHSgANCnxbaAdZhPzREsLJni7g4bu6XR9tNsuEAfREL",
    timestamp: "2026-05-05T18:27:33.732Z",
    action: "Approved Spend",
    status: "allowed",
    reason: null,
    vaultBalanceDelta: -5,
    innerTransfers: 1,
    explorerUrl: "https://explorer.solana.com/tx/24SD6CdpkJqJj5EHW2cMULVoXU5qwURrgohidQ25jhLPLYHSgANCnxbaAdZhPzREsLJni7g4bu6XR9tNsuEAfREL?cluster=devnet",
    amount: 5,
    ruleTriggered: "all_clear",
    vaultBalanceBefore: 100,
    vaultBalanceAfter: 95,
    attemptType: "good-spend",
  },
  {
    id: "34L5qsBY",
    signature: "34L5qsBYopSPP6jkxiwmJjWPX1AhBJvxqmcDMNH7Mhu1HVqxGWHLHpT5nLDmFQB9h5hhfqPDVkwBQ4cn7nHW6dEu",
    timestamp: "2026-05-05T18:27:37.800Z",
    action: "Velocity Attack",
    status: "blocked",
    reason: "Velocity Limit Exceeded",
    vaultBalanceDelta: 0,
    innerTransfers: 0,
    explorerUrl: "https://explorer.solana.com/tx/34L5qsBYopSPP6jkxiwmJjWPX1AhBJvxqmcDMNH7Mhu1HVqxGWHLHpT5nLDmFQB9h5hhfqPDVkwBQ4cn7nHW6dEu?cluster=devnet",
    amount: 1,
    ruleTriggered: "velocity",
    vaultBalanceBefore: 95,
    vaultBalanceAfter: 95,
    attemptType: "velocity-attack",
  },
  {
    id: "2HibzDsw",
    signature: "2HibzDswnHVUEsgTB6FXotNZXdwMtGxv1deUPy9WABgqb1guxgKCcG1jrqnN96cWBJwQoZuBjJmptDboPnrBrfej",
    timestamp: "2026-05-05T18:28:06.824Z",
    action: "Over-Cap Spend",
    status: "blocked",
    reason: "Per-Tx Cap Exceeded",
    vaultBalanceDelta: 0,
    innerTransfers: 0,
    explorerUrl: "https://explorer.solana.com/tx/2HibzDswnHVUEsgTB6FXotNZXdwMtGxv1deUPy9WABgqb1guxgKCcG1jrqnN96cWBJwQoZuBjJmptDboPnrBrfej?cluster=devnet",
    amount: 50,
    ruleTriggered: "perTxCap",
    vaultBalanceBefore: 95,
    vaultBalanceAfter: 95,
    attemptType: "over-cap",
  },
];

// ─── War Room attempt definitions ───────────────────────────────────────────

export const WAR_ROOM_ATTEMPTS: WarRoomAttempt[] = [
  {
    id: "approved-spend",
    label: "Attempt approved spend",
    description: "50 DemoUSD — within all policy limits",
    mode: "normal",
    amount: 50,
    destination: "merchant",
    expectedResult: "allowed",
    terminalLines: [
      "> executeGuardedTransfer(amount=50, dest=merchant_a)",
      "VAJRA_GUARD:1  revoked_check       [PASS]",
      "VAJRA_GUARD:2  expiry_check        [PASS]",
      "VAJRA_GUARD:3  signer_check        [PASS]",
      "VAJRA_GUARD:5  per_tx_cap_check    [PASS]",
      "VAJRA_GUARD:6  budget_check        [PASS]",
      "VAJRA_GUARD:7  destination_check   [PASS]",
      "VAJRA_GUARD:12 all_clear — CPI transfer executed",
      "Transfer complete. Vault: 9,950.00 DemoUSD",
    ],
  },
  {
    id: "over-cap",
    label: "Attempt over-cap spend",
    description: "5,000 DemoUSD — exceeds per-tx cap",
    mode: "attack",
    amount: 5000,
    destination: "merchant",
    expectedResult: "blocked",
    ruleTriggered: "perTxCap",
    terminalLines: [
      "> executeGuardedTransfer(amount=5000, dest=merchant_a)",
      "VAJRA_GUARD:1  revoked_check       [PASS]",
      "VAJRA_GUARD:2  expiry_check        [PASS]",
      "VAJRA_GUARD:3  signer_check        [PASS]",
      "VAJRA_GUARD:4  amount_zero_check   [PASS]",
      "VAJRA_GUARD:5  per_tx_cap_check    [FAIL]",
      "Error: PerTxCapExceeded — amount exceeds per-transaction cap",
      "ENFORCEMENT ACTIVE: Vajra program rejected the transfer before funds moved.",
    ],
  },
  {
    id: "wrong-dest",
    label: "Attempt wrong destination",
    description: "50 DemoUSD — destination not on allowlist",
    mode: "attack",
    amount: 50,
    destination: "attacker",
    expectedResult: "blocked",
    ruleTriggered: "destination",
    terminalLines: [
      "> executeGuardedTransfer(amount=50, dest=attacker_wallet)",
      "VAJRA_GUARD:1  revoked_check       [PASS]",
      "VAJRA_GUARD:3  signer_check        [PASS]",
      "VAJRA_GUARD:5  per_tx_cap_check    [PASS]",
      "VAJRA_GUARD:6  budget_check        [PASS]",
      "VAJRA_GUARD:7  destination_check   [FAIL]",
      "Error: DestinationNotAllowed — destination is not on the allowlist",
      "ENFORCEMENT ACTIVE: Vajra program rejected the transfer before funds moved.",
    ],
  },
  {
    id: "raw-drain",
    label: "Attempt raw drain",
    description: "Direct SPL transfer — agent is not vault authority",
    mode: "attack",
    amount: 9950,
    destination: "attacker",
    expectedResult: "blocked",
    ruleTriggered: "vaultAuthority",
    terminalLines: [
      "> spl_token.transfer(vault → attacker, amount=9950)",
      "SPL Token Program: authority_check",
      "Expected: PolicyPDA  (87KADML8...)",
      "Got:      AgentKey   (GDVVFih6...)",
      "SPL Token Program: REJECTED — signer is not vault authority",
      "",
      "ENFORCEMENT ACTIVE: Vault cannot be drained.",
      "The agent is not the vault authority. The PolicyPDA is.",
    ],
  },
];
