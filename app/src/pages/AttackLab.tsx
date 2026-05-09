import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Shield, AlertTriangle, Copy, Check, Terminal } from "lucide-react";
import { Button } from "../components/ui/Button";
import { ReceiptCard } from "../components/receipts/ReceiptCard";
import { ReceiptDrawer } from "../components/receipts/ReceiptDrawer";
import { LiveDevnetVerifier } from "../components/verifier/LiveDevnetVerifier";
import { loadRedTeamProof, loadReceipts } from "../lib/data";
import type { RedTeamProof, Receipt } from "../lib/types";
import { shortSig } from "../lib/proofUtils";

// Hook: useReducedMotionSafe lives in components/ui/ in this project
function useReducedMotionSafe(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type ReplayStep =
  | "idle"
  | "left_activating"
  | "left_drained"
  | "right_activating"
  | "right_blocked"
  | "comparison"
  | "receipts";

// ─── Sub-components ──────────────────────────────────────────────────────────

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-[rgba(255,255,255,0.04)] rounded-xl ${className ?? ""}`}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8 px-4 md:px-8 max-w-6xl mx-auto w-full pt-16">
      <SkeletonBlock className="h-16 w-3/4" />
      <SkeletonBlock className="h-6 w-1/2" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonBlock className="h-80" />
        <SkeletonBlock className="h-80" />
      </div>
    </div>
  );
}


function StatusBadgeLarge({
  label,
  color,
}: {
  label: string;
  color: "crimson" | "emerald" | "amber" | "cyan";
}) {
  const map = {
    crimson: "bg-crimson/10 text-crimson border-crimson/25",
    emerald: "bg-emerald/10 text-emerald border-emerald/25",
    amber: "bg-amber/10 text-amber border-amber/25",
    cyan: "bg-cyan/10 text-cyan border-cyan/25",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-lg border text-xs font-mono uppercase tracking-widest ${map[color]}`}
    >
      {label}
    </span>
  );
}

function ExplorerLink({ sig, label }: { sig: string; label?: string }) {
  const href = `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-xs font-mono text-cyan/70 hover:text-cyan transition-colors w-fit"
    >
      {label ?? "View on Explorer"}
      <ExternalLink size={11} />
    </a>
  );
}

// ─── RawWalletPanel ──────────────────────────────────────────────────────────

const RAW_SIG =
  "wTo4fANWAG6P3azWJ4W3MQVYn5rYpZp6s3ZijsKsN4xGP2ACCGieZgtYKXZ6wiFNW3WTek9Paeco9bozGye95p3";

interface RawWalletPanelProps {
  step: ReplayStep;
  proofData: RedTeamProof | null;
  reduced: boolean;
}

function RawWalletPanel({ step, proofData, reduced }: RawWalletPanelProps) {
  const sig = proofData?.raw_wallet?.signature ?? RAW_SIG;
  const isDrained =
    step === "left_drained" ||
    step === "right_activating" ||
    step === "right_blocked" ||
    step === "comparison" ||
    step === "receipts";
  const isActivating = step === "left_activating";

  return (
    <div className="panel-crimson p-6 flex flex-col gap-4 h-full min-h-[340px] relative overflow-hidden">
      {/* Crimson flash on drain */}
      <AnimatePresence>
        {isDrained && !reduced && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 bg-crimson/20 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-crimson" />
        <span className="text-sm font-semibold text-[rgba(237,237,237,0.9)]">Raw Agent Wallet</span>
      </div>

      {step === "idle" && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs font-mono text-muted">Waiting for replay…</span>
        </div>
      )}

      {isActivating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col gap-3 justify-center"
        >
          <span className="text-xs font-mono text-crimson animate-pulse">
            ▶ raw wallet attack starts…
          </span>
          <div className="space-y-1">
            {[
              "> spl_token.transfer(vault → attacker)",
              "authority_check: AgentKey",
              "Expected: PolicyPDA",
              "Checking…",
            ].map((line, i) => (
              <div key={i} className="text-[11px] font-mono text-muted">
                {line}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {isDrained && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.4 }}
          className="flex flex-col gap-4"
        >
          <StatusBadgeLarge label="DRAINED" color="crimson" />

          <div className="flex flex-col gap-2 text-sm text-[rgba(237,237,237,0.75)]">
            <span>Agent owns funds directly</span>
            <span className="text-crimson font-medium">Malicious instruction succeeded</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2 text-xs font-mono">
              <span className="text-muted min-w-[120px]">Loss</span>
              <span className="text-crimson font-semibold">50.00 DemoUSD</span>
            </div>
            <div className="flex gap-2 text-xs font-mono">
              <span className="text-muted min-w-[120px]">Verifier</span>
              <span className="text-[rgba(237,237,237,0.6)]">not_vajra</span>
            </div>
            <div className="flex gap-2 text-xs font-mono items-center">
              <span className="text-muted min-w-[120px]">Sig</span>
              <span className="text-[rgba(237,237,237,0.45)] truncate">{shortSig(sig)}</span>
            </div>
          </div>

          <ExplorerLink sig={sig} label="View raw wallet tx" />
        </motion.div>
      )}
    </div>
  );
}

// ─── VajraVaultPanel ─────────────────────────────────────────────────────────

const BLOCKED_SIG =
  "5yWAEdtjihJjGWk9phXLvAG831r9yqvT7qrPgbmaFXoS5whsFSLLuuLLFGnUmKpAE22RWvFxPk3NDn1oCqfEqEf8";

interface VajraVaultPanelProps {
  step: ReplayStep;
  proofData: RedTeamProof | null;
  reduced: boolean;
}

function VajraVaultPanel({ step, proofData, reduced }: VajraVaultPanelProps) {
  const sig = proofData?.vajra_allowance_vault?.signature ?? BLOCKED_SIG;
  const isBlocked =
    step === "right_blocked" ||
    step === "comparison" ||
    step === "receipts";
  const isActivating = step === "right_activating";

  return (
    <div className="panel-cyan p-6 flex flex-col gap-4 h-full min-h-[340px] relative overflow-hidden">
      {/* Cyan shield pulse on block */}
      <AnimatePresence>
        {isBlocked && !reduced && (
          <motion.div
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1.4 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-24 h-24 rounded-full bg-cyan/20" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-cyan" />
        <span className="text-sm font-semibold text-[rgba(237,237,237,0.9)]">Vajra Allowance Vault</span>
      </div>

      {(step === "idle" || step === "left_activating" || step === "left_drained") && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs font-mono text-muted">
            {step === "idle" ? "Waiting for replay…" : "Standing by…"}
          </span>
        </div>
      )}

      {isActivating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col gap-3 justify-center"
        >
          <span className="text-xs font-mono text-cyan animate-pulse">
            ▶ Vajra attack starts…
          </span>
          <div className="space-y-1">
            {[
              "> executeGuardedTransfer(amount=50000000)",
              "VAJRA_GUARD:5  per_tx_cap_check",
              "checking policy PDA…",
              "Evaluating…",
            ].map((line, i) => (
              <div key={i} className="text-[11px] font-mono text-muted">
                {line}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {isBlocked && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.4 }}
          className="flex flex-col gap-4"
        >
          <StatusBadgeLarge label="BLOCKED" color="cyan" />

          <div className="flex flex-col gap-2 text-sm text-[rgba(237,237,237,0.75)]">
            <span>Vault authority = PolicyPDA</span>
            <span>Agent does not own vault authority</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2 text-xs font-mono">
              <span className="text-muted min-w-[120px]">Blocked by</span>
              <span className="text-cyan font-semibold">perTxCap</span>
            </div>
            <div className="flex gap-2 text-xs font-mono">
              <span className="text-muted min-w-[120px]">Vault Delta</span>
              <span className="text-emerald font-semibold">0.00 DemoUSD</span>
            </div>
            <div className="flex gap-2 text-xs font-mono">
              <span className="text-muted min-w-[120px]">Inner transfers</span>
              <span className="text-[rgba(237,237,237,0.6)]">0</span>
            </div>
            <div className="flex gap-2 text-xs font-mono">
              <span className="text-muted min-w-[120px]">Verifier</span>
              <span className="text-[rgba(237,237,237,0.6)]">vajra_blocked</span>
            </div>
            <div className="flex gap-2 text-xs font-mono items-center">
              <span className="text-muted min-w-[120px]">Sig</span>
              <span className="text-[rgba(237,237,237,0.45)] truncate">{shortSig(sig)}</span>
            </div>
          </div>

          <ExplorerLink sig={sig} label="View blocked Vajra tx" />
        </motion.div>
      )}
    </div>
  );
}

// ─── ComparisonCard ───────────────────────────────────────────────────────────

const ALLOWED_SIG =
  "382Mj4AgfWcMcmzaMZebrbmbBBGTDezghXWssJnFBy6y33ZkpT48uFHs7toerSFmPmGuAVtefM1CWvG2miDYXvAo";

function ComparisonCard({ proofData }: { proofData: RedTeamProof | null }) {
  const destMismatchVerified =
    proofData?.verifier?.expected_destination_mismatch?.verified ?? false;

  return (
    <div className="panel p-6 flex flex-col gap-5">
      <h3 className="text-sm font-semibold text-[rgba(237,237,237,0.9)] uppercase tracking-wider">
        Outcome Comparison
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted">Raw Wallet Loss</span>
          <span className="text-xl font-mono font-bold text-crimson">50.00</span>
          <span className="text-xs font-mono text-muted">DemoUSD</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted">Vajra Loss</span>
          <span className="text-xl font-mono font-bold text-emerald">0.00</span>
          <span className="text-xs font-mono text-muted">DemoUSD</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted">Avoided Loss</span>
          <span className="text-xl font-mono font-bold text-cyan">50.00</span>
          <span className="text-xs font-mono text-muted">DemoUSD</span>
        </div>
      </div>

      <div className="border-t border-[rgba(255,255,255,0.06)] pt-4 flex flex-col gap-2 text-xs font-mono">
        <div className="flex gap-3">
          <span className="text-muted min-w-[200px]">Destination mismatch check</span>
          <span className={destMismatchVerified ? "text-emerald" : "text-[rgba(237,237,237,0.5)]"}>
            verified {String(destMismatchVerified)} (expected)
          </span>
        </div>
        <div className="flex gap-3">
          <span className="text-muted min-w-[200px]">Allowed payment sig</span>
          <span className="text-[rgba(237,237,237,0.45)]">{shortSig(ALLOWED_SIG)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── CopyProofButton ──────────────────────────────────────────────────────────

function CopyProofButton({ proofData }: { proofData: RedTeamProof | null }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const payload = proofData ?? {
      network: "devnet",
      source: "hardcoded-fallback",
      raw_wallet: { signature: RAW_SIG, status: "drained", loss_amount: "50000000" },
      vajra_allowance_vault: { signature: BLOCKED_SIG, status: "blocked", vault_delta: "0", inner_token_transfers: 0 },
      allowed_payment: { signature: ALLOWED_SIG },
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Button variant="ghost" size="md" onClick={handleCopy}>
      {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy proof packet JSON"}
    </Button>
  );
}

// ─── CopyCommandButton ────────────────────────────────────────────────────────

function CopyCommandButton() {
  const [copied, setCopied] = useState(false);
  const cmd = "npm run devnet:red-team";
  const handle = async () => {
    await navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={handle}
      title={`Copy: ${cmd}`}
      className="flex items-center gap-1.5 text-xs font-mono text-muted hover:text-[rgba(237,237,237,0.75)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.14)] px-3 py-2 rounded-lg transition-colors cursor-pointer"
    >
      {copied ? <Check size={12} className="text-emerald" /> : <Terminal size={12} />}
      {copied ? "Copied" : "npm run devnet:red-team"}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STEP_TIMINGS: Record<ReplayStep, number> = {
  idle: 0,
  left_activating: 500,
  left_drained: 1500,
  right_activating: 2500,
  right_blocked: 3500,
  comparison: 4500,
  receipts: 5500,
};

const STEP_ORDER: ReplayStep[] = [
  "idle",
  "left_activating",
  "left_drained",
  "right_activating",
  "right_blocked",
  "comparison",
  "receipts",
];

export function AttackLab() {
  const reduced = useReducedMotionSafe();

  const [proofData, setProofData] = useState<RedTeamProof | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<ReplayStep>("idle");
  const [replayRunning, setReplayRunning] = useState(false);
  const [openReceipt, setOpenReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadRedTeamProof(), loadReceipts()]).then(([proof, recs]) => {
      if (!cancelled) {
        setProofData(proof);
        setReceipts(recs);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const runReplay = () => {
    if (replayRunning) return;
    setReplayRunning(true);
    setStep("idle");

    const stepsToRun = STEP_ORDER.slice(1); // skip idle
    const timers: ReturnType<typeof setTimeout>[] = [];

    stepsToRun.forEach((s) => {
      const t = setTimeout(
        () => setStep(s),
        reduced ? 0 : STEP_TIMINGS[s]
      );
      timers.push(t);
    });

    const totalTime = reduced ? 100 : STEP_TIMINGS["receipts"] + 800;
    const done = setTimeout(() => setReplayRunning(false), totalTime);
    timers.push(done);

    return () => timers.forEach(clearTimeout);
  };

  const resetReplay = () => {
    setStep("idle");
    setReplayRunning(false);
  };

  // Pick up to 3 receipts to display
  const displayReceipts = receipts.slice(0, 3);

  const source = proofData?.source ?? "Fresh devnet red-team proof";
  const showPanels = step !== "idle" || !loading;

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="flex flex-col gap-12 px-4 md:px-8 max-w-6xl mx-auto w-full pb-24">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.5 }}
        className="pt-16 flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            <span className="text-crimson">Raw key drains.</span>
          </h1>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            <span className="text-cyan">Vajra blocks.</span>
          </h1>
        </div>

        <p className="text-base text-secondary max-w-xl leading-relaxed">
          Fresh devnet red-team run — recorded and committed as proof artifacts.
          Replay the sequence to see both outcomes side by side.
        </p>

        {/* Core claim */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-cyan/5 border border-cyan/15 w-fit">
          <Shield size={13} className="text-cyan shrink-0" />
          <span className="text-sm font-mono text-cyan">
            The agent key never holds vault authority.
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] w-fit">
          <span className="text-[10px] font-mono text-muted">
            {source} · Replay uses recorded devnet proof artifacts.
          </span>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3 flex-wrap mt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={runReplay}
            disabled={replayRunning}
          >
            {replayRunning ? "Replaying…" : step === "idle" ? "Run Red-Team Replay" : "Run Again"}
          </Button>
          {step !== "idle" && (
            <Button variant="ghost" size="md" onClick={resetReplay}>
              Reset
            </Button>
          )}
        </div>
      </motion.div>

      {/* Split screen */}
      {showPanels && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <RawWalletPanel step={step} proofData={proofData} reduced={reduced} />
          <VajraVaultPanel step={step} proofData={proofData} reduced={reduced} />
        </motion.div>
      )}

      {/* Comparison card */}
      <AnimatePresence>
        {(step === "comparison" || step === "receipts") && (
          <motion.div
            key="comparison"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: reduced ? 0 : 0.5 }}
            className="flex flex-col gap-4"
          >
            <ComparisonCard proofData={proofData} />

            {/* Why it works */}
            <div className="rounded-xl border border-cyan/15 bg-cyan/5 px-5 py-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan/70">Why it works</span>
              <p className="text-sm text-[rgba(237,237,237,0.75)] leading-relaxed">
                The SPL vault authority is the{" "}
                <span className="text-cyan font-mono">PolicyPDA</span>, not the agent key.
                The agent key signs the <span className="font-mono text-[rgba(237,237,237,0.9)]">executeGuardedTransfer</span> instruction,
                but the Vajra program holds vault authority and only issues the CPI transfer
                if every policy check passes. A compromised agent key cannot bypass this —
                it can only submit requests that the program will reject.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt cards */}
      <AnimatePresence>
        {step === "receipts" && displayReceipts.length > 0 && (
          <motion.div
            key="receipt-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.5 }}
            className="flex flex-col gap-4"
          >
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
              On-Chain Receipts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {displayReceipts.map((r, i) => (
                <motion.div
                  key={r.receipt_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduced ? 0 : i * 0.12, duration: reduced ? 0 : 0.35 }}
                >
                  <ReceiptCard receipt={r} onOpen={setOpenReceipt} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live RPC Verifier — appears after comparison */}
      <AnimatePresence>
        {(step === "comparison" || step === "receipts") && (
          <motion.div
            key="rpc-verifier"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.2 }}
            className="flex flex-col gap-3"
          >
            <span className="text-xs font-mono uppercase tracking-widest text-muted">Live RPC Check</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LiveDevnetVerifier
                signature={proofData?.vajra_allowance_vault?.signature ?? BLOCKED_SIG}
                label="Blocked Vajra drain — expects failed tx"
                expectation={{
                  expectedClassification: "vajra_blocked",
                  expectedVaultDelta: 0,
                  expectedInnerTransfers: 0,
                  expectedTxFailed: true,
                }}
              />
              <LiveDevnetVerifier
                signature={proofData?.raw_wallet?.signature ?? RAW_SIG}
                label="Raw wallet drain — expects successful tx"
                expectation={{
                  expectedClassification: "not_vajra",
                  expectedTxFailed: false,
                }}
              />
            </div>
            <p className="text-[9px] font-mono text-muted leading-relaxed max-w-lg">
              Fetches transaction metadata from api.devnet.solana.com. Does not execute transactions.
              Recorded proof artifacts remain the stable reference.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      {(step === "comparison" || step === "receipts") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 0.4 }}
          className="flex flex-wrap gap-3"
        >
          <Button
            variant="outline"
            size="md"
            onClick={() =>
              window.open(
                `https://explorer.solana.com/tx/${proofData?.raw_wallet?.signature ?? RAW_SIG}?cluster=devnet`,
                "_blank"
              )
            }
          >
            <ExternalLink size={14} />
            View raw wallet tx
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() =>
              window.open(
                `https://explorer.solana.com/tx/${proofData?.vajra_allowance_vault?.signature ?? BLOCKED_SIG}?cluster=devnet`,
                "_blank"
              )
            }
          >
            <ExternalLink size={14} />
            View blocked Vajra tx
          </Button>
          <CopyProofButton proofData={proofData} />
          <CopyCommandButton />
        </motion.div>
      )}

      {/* Receipt drawer */}
      <ReceiptDrawer receipt={openReceipt} onClose={() => setOpenReceipt(null)} />
    </div>
  );
}
