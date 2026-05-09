import type { DevnetProofRecord, ProofSummary } from "./types";
import { GUARD_LABELS, lamportsToUi } from "./constants";

// Raw shape from devnet-proof.json
interface RawAttempt {
  policy?: string;
  agent?: string;
  vault?: string;
  mint?: string;
  attemptType?: string;
  amount?: string | number;
  destination?: string;
  result?: string;
  ruleTriggered?: string;
  signature?: string;
  explorerUrl?: string;
  vaultBalanceBefore?: string | number;
  vaultBalanceAfter?: string | number;
  vaultDelta?: string | number;
  avoidedLoss?: string | number;
  timestamp?: string;
  logs?: string[];
  errorSummary?: string;
}

function statusFromResult(result?: string): "allowed" | "blocked" | "failed" {
  if (result === "allowed") return "allowed";
  if (result === "blocked" || result === "failed") return "blocked";
  return "blocked";
}

function labelForAttemptType(t?: string, rule?: string): string {
  const map: Record<string, string> = {
    "good-spend": "Approved Spend",
    "velocity-attack": "Velocity Attack",
    "over-cap": "Over-Cap Spend",
    "wrong-destination": "Wrong Destination",
    "period-fill-1": "Period Fill (1/2)",
    "period-fill-2": "Period Fill (2/2)",
    "period-budget-attack": "Period Budget Attack",
    withdraw: "Owner Withdrawal",
    "revoked-policy": "Spend on Revoked Policy",
    "raw-drain": "Raw Drain Attempt",
  };
  return map[t ?? ""] ?? t ?? GUARD_LABELS[rule ?? ""] ?? "Unknown";
}

export function normalizeAttempts(raw: unknown): DevnetProofRecord[] {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  const attempts = Array.isArray(obj.attempts) ? obj.attempts : [];

  return attempts
    .map((a: unknown, i: number): DevnetProofRecord => {
      const r = (a as RawAttempt) ?? {};
      const vaultDelta = Number(r.vaultDelta ?? 0);
      const status = statusFromResult(r.result);

      return {
        id: `${r.signature?.slice(0, 8) ?? i}`,
        signature: r.signature ?? "",
        timestamp: r.timestamp,
        action: labelForAttemptType(r.attemptType, r.ruleTriggered),
        status,
        reason: GUARD_LABELS[r.ruleTriggered ?? ""] ?? r.ruleTriggered ?? null,
        vaultBalanceDelta: lamportsToUi(vaultDelta),
        innerTransfers: status === "blocked" ? 0 : 1,
        explorerUrl: r.explorerUrl,
        rawLogs: r.logs,
        amount: r.amount !== undefined ? lamportsToUi(Number(r.amount)) : undefined,
        destination: r.destination,
        ruleTriggered: r.ruleTriggered,
        vaultBalanceBefore:
          r.vaultBalanceBefore !== undefined
            ? lamportsToUi(Number(r.vaultBalanceBefore))
            : undefined,
        vaultBalanceAfter:
          r.vaultBalanceAfter !== undefined
            ? lamportsToUi(Number(r.vaultBalanceAfter))
            : undefined,
        attemptType: r.attemptType,
      };
    })
    .filter((r) => r.signature);
}

export function computeSummary(records: DevnetProofRecord[]): ProofSummary {
  const blocked = records.filter((r) => r.status === "blocked");
  const allowed = records.filter((r) => r.status === "allowed");
  return {
    totalAttempts: records.length,
    blockedCount: blocked.length,
    allowedCount: allowed.length,
    vaultDeltaOnBlocked: blocked.reduce(
      (s, r) => s + Math.abs(r.vaultBalanceDelta),
      0
    ),
    innerTransfersOnBlocked: blocked.reduce((s, r) => s + r.innerTransfers, 0),
    avoidedLoss: blocked.reduce((s, r) => {
      const amt = typeof r.amount === "number" ? r.amount : Number(r.amount ?? 0);
      return s + amt;
    }, 0),
  };
}
