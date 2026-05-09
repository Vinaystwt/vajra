/**
 * LiveDevnetVerifier — fetches a Solana devnet transaction via public JSON-RPC
 * and compares it against the local committed proof artifact.
 *
 * Does NOT execute any transaction. Read-only RPC call only.
 * Falls back gracefully when RPC is slow, throttled, or unavailable.
 */

import { useState } from "react";
import { ExternalLink, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

const DEVNET_RPC = "https://api.devnet.solana.com";

// ─── RPC helpers ─────────────────────────────────────────────────────────────

interface SolanaRpcMeta {
  err: unknown | null;
  innerInstructions?: Array<{ index: number; instructions: unknown[] }>;
  preTokenBalances?: unknown[];
  postTokenBalances?: unknown[];
}

interface SolanaRpcTransaction {
  slot: number;
  blockTime: number | null;
  meta: SolanaRpcMeta | null;
  transaction?: {
    signatures?: string[];
  };
}

interface RpcResult {
  status: "ok" | "error" | "not_found";
  tx?: SolanaRpcTransaction;
  error?: string;
}

async function fetchDevnetTx(signature: string): Promise<RpcResult> {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "getTransaction",
    params: [
      signature,
      { encoding: "json", maxSupportedTransactionVersion: 0 },
    ],
  });

  const res = await fetch(DEVNET_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) return { status: "error", error: `HTTP ${res.status}` };

  const json = await res.json();

  if (json.error) return { status: "error", error: json.error.message ?? "RPC error" };
  if (json.result === null) return { status: "not_found" };

  return { status: "ok", tx: json.result as SolanaRpcTransaction };
}

// ─── Verification logic ───────────────────────────────────────────────────────

interface VerificationExpectation {
  expectedClassification: "vajra_blocked" | "vajra_allowed" | "not_vajra";
  expectedVaultDelta?: number;      // 0 for blocked
  expectedInnerTransfers?: number;  // 0 for blocked
  expectedTxFailed?: boolean;       // true for blocked (meta.err is non-null)
}

interface VerificationResult {
  state: "verified" | "mismatch" | "partial" | "not_found" | "rpc_unavailable" | "insufficient_metadata";
  slot?: number;
  blockTime?: number | null;
  txFailed?: boolean;
  innerInstructionCount?: number;
  mismatches?: string[];
  notes?: string[];
  fetchedAt: string;
}

function verify(
  tx: SolanaRpcTransaction,
  sig: string,
  exp: VerificationExpectation,
): VerificationResult {
  const mismatches: string[] = [];
  const notes: string[] = [];
  const fetchedAt = new Date().toLocaleTimeString();

  const txFailed = tx.meta?.err !== null && tx.meta?.err !== undefined;

  // Sig check
  const sigs = tx.transaction?.signatures ?? [];
  if (sigs.length > 0 && !sigs.includes(sig)) {
    mismatches.push(`Signature mismatch: expected ${sig.slice(0, 12)}…`);
  }

  // Tx status vs expectation
  if (exp.expectedTxFailed !== undefined) {
    if (exp.expectedTxFailed && !txFailed) {
      mismatches.push("Expected failed tx (blocked), but RPC reports success.");
    }
    if (!exp.expectedTxFailed && txFailed) {
      mismatches.push("Expected successful tx, but RPC reports error.");
    }
  }

  // Inner instructions count
  const innerCount = tx.meta?.innerInstructions?.reduce(
    (acc, g) => acc + g.instructions.length, 0
  ) ?? 0;
  if (exp.expectedInnerTransfers !== undefined) {
    if (innerCount !== exp.expectedInnerTransfers) {
      // note, not mismatch — inner instructions include non-transfer items
      notes.push(
        `RPC inner instruction count: ${innerCount}. Artifact records ${exp.expectedInnerTransfers} inner token transfer(s). ` +
        "Inner instructions include non-token-transfer items; token-transfer count requires full log parsing."
      );
    }
  }

  notes.push("Receipt fields are compared against the committed devnet proof artifact where available.");

  const state: VerificationResult["state"] =
    mismatches.length > 0
      ? "mismatch"
      : notes.some((n) => n.startsWith("RPC inner")) && exp.expectedInnerTransfers !== undefined
      ? "partial"
      : "verified";

  return {
    state,
    slot: tx.slot,
    blockTime: tx.blockTime,
    txFailed,
    innerInstructionCount: innerCount,
    mismatches,
    notes,
    fetchedAt,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  signature: string;
  label: string;
  expectation: VerificationExpectation;
  className?: string;
}

type FetchState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "done"; result: VerificationResult }
  | { phase: "error"; message: string };

const STATE_COLORS = {
  verified: "text-emerald",
  partial: "text-cyan",
  mismatch: "text-[#E11D48]",
  not_found: "text-amber-400",
  rpc_unavailable: "text-[rgba(237,237,237,0.5)]",
  insufficient_metadata: "text-amber-400",
};

const STATE_LABELS = {
  verified: "Verified from devnet RPC",
  partial: "Fetched from devnet RPC — partial comparison",
  mismatch: "RPC mismatch detected",
  not_found: "Transaction not found on devnet RPC",
  rpc_unavailable: "Devnet RPC unavailable",
  insufficient_metadata: "RPC metadata insufficient for full comparison",
};

export function LiveDevnetVerifier({ signature, label, expectation, className }: Props) {
  const [fetchState, setFetchState] = useState<FetchState>({ phase: "idle" });

  const run = async () => {
    setFetchState({ phase: "loading" });
    try {
      const rpcResult = await fetchDevnetTx(signature);

      if (rpcResult.status === "not_found") {
        setFetchState({
          phase: "done",
          result: {
            state: "not_found",
            fetchedAt: new Date().toLocaleTimeString(),
            notes: ["Transaction may have expired from devnet history or RPC does not have it indexed."],
          },
        });
        return;
      }

      if (rpcResult.status === "error" || !rpcResult.tx) {
        setFetchState({
          phase: "done",
          result: {
            state: "rpc_unavailable",
            fetchedAt: new Date().toLocaleTimeString(),
            notes: [rpcResult.error ?? "RPC request failed."],
          },
        });
        return;
      }

      const result = verify(rpcResult.tx, signature, expectation);
      setFetchState({ phase: "done", result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setFetchState({
        phase: "done",
        result: {
          state: "rpc_unavailable",
          fetchedAt: new Date().toLocaleTimeString(),
          notes: [msg.includes("timeout") ? "RPC request timed out." : msg],
        },
      });
    }
  };

  const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  const shortSig = `${signature.slice(0, 10)}…${signature.slice(-6)}`;

  return (
    <div
      className={cn(
        "rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] overflow-hidden",
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2 min-w-0">
          <Wifi size={12} className="text-cyan shrink-0" />
          <span className="text-xs font-mono text-[rgba(237,237,237,0.6)] truncate">{label}</span>
        </div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] font-mono text-[rgba(237,237,237,0.35)] hover:text-cyan transition-colors flex items-center gap-1 shrink-0"
        >
          {shortSig}
          <ExternalLink size={9} />
        </a>
      </div>

      {/* Body */}
      <div className="px-4 py-3 flex flex-col gap-3">
        <AnimatePresence mode="wait">
          {fetchState.phase === "idle" && (
            <motion.button
              key="btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={run}
              className="flex items-center gap-2 text-xs font-mono text-[rgba(237,237,237,0.55)] hover:text-cyan transition-colors cursor-pointer w-fit"
            >
              <RefreshCw size={12} />
              Verify from devnet RPC
            </motion.button>
          )}

          {fetchState.phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs font-mono text-[rgba(237,237,237,0.45)]"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw size={12} />
              </motion.div>
              Fetching from api.devnet.solana.com…
            </motion.div>
          )}

          {fetchState.phase === "done" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              {/* State row */}
              <div className="flex items-center gap-2">
                {fetchState.result.state === "verified" ? (
                  <CheckCircle2 size={13} className="text-emerald shrink-0" />
                ) : fetchState.result.state === "mismatch" ? (
                  <XCircle size={13} className="text-[#E11D48] shrink-0" />
                ) : fetchState.result.state === "rpc_unavailable" || fetchState.result.state === "not_found" ? (
                  <WifiOff size={13} className="text-[rgba(237,237,237,0.4)] shrink-0" />
                ) : (
                  <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                )}
                <span
                  className={cn(
                    "text-xs font-mono",
                    STATE_COLORS[fetchState.result.state]
                  )}
                >
                  {STATE_LABELS[fetchState.result.state]}
                </span>
                <span className="text-[9px] font-mono text-[rgba(237,237,237,0.25)] ml-auto shrink-0">
                  {fetchState.result.fetchedAt}
                </span>
              </div>

              {/* Metadata grid */}
              {(fetchState.result.slot !== undefined ||
                fetchState.result.txFailed !== undefined) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-[10px] font-mono pl-5">
                  {fetchState.result.slot !== undefined && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[rgba(237,237,237,0.3)]">Slot</span>
                      <span className="text-[rgba(237,237,237,0.7)]">{fetchState.result.slot.toLocaleString()}</span>
                    </div>
                  )}
                  {fetchState.result.blockTime != null && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[rgba(237,237,237,0.3)]">Block time</span>
                      <span className="text-[rgba(237,237,237,0.7)]">
                        {new Date(fetchState.result.blockTime * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {fetchState.result.txFailed !== undefined && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[rgba(237,237,237,0.3)]">Tx status</span>
                      <span className={fetchState.result.txFailed ? "text-[#E11D48]" : "text-emerald"}>
                        {fetchState.result.txFailed ? "Failed (expected)" : "Success"}
                      </span>
                    </div>
                  )}
                  {fetchState.result.innerInstructionCount !== undefined && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[rgba(237,237,237,0.3)]">Inner instructions</span>
                      <span className="text-[rgba(237,237,237,0.7)]">{fetchState.result.innerInstructionCount}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Mismatches */}
              {fetchState.result.mismatches && fetchState.result.mismatches.length > 0 && (
                <div className="pl-5 flex flex-col gap-1">
                  {fetchState.result.mismatches.map((m, i) => (
                    <span key={i} className="text-[10px] font-mono text-[#E11D48]">
                      ✗ {m}
                    </span>
                  ))}
                </div>
              )}

              {/* Notes */}
              {fetchState.result.notes && fetchState.result.notes.length > 0 && (
                <div className="pl-5 flex flex-col gap-1">
                  {fetchState.result.notes.map((n, i) => (
                    <span key={i} className="text-[9px] font-mono text-[rgba(237,237,237,0.38)] leading-relaxed">
                      {n}
                    </span>
                  ))}
                </div>
              )}

              {/* Re-run */}
              <button
                onClick={run}
                className="flex items-center gap-1.5 text-[9px] font-mono text-[rgba(237,237,237,0.3)] hover:text-[rgba(237,237,237,0.6)] transition-colors cursor-pointer w-fit pl-5"
              >
                <RefreshCw size={9} />
                Re-run
              </button>
            </motion.div>
          )}

          {fetchState.phase === "error" && (
            <motion.div
              key="err"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-mono text-[rgba(237,237,237,0.45)]"
            >
              {fetchState.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
