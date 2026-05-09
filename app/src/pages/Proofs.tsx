import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Shield, Database, Zap, AlertTriangle, Info, ShieldX, ShieldCheck } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { MetricCard } from "../components/ui/MetricCard";
import { ProofExplorerTable } from "../components/proofs/ProofExplorerTable";
import { ProofDetailDrawer } from "../components/proofs/ProofDetailDrawer";
import { MerchantVerifierPanel } from "../components/receipts/MerchantVerifierPanel";
import { LiveDevnetVerifier } from "../components/verifier/LiveDevnetVerifier";
import { useDevnetProofs } from "../hooks/useDevnetProofs";
import { loadMerchantVerification } from "../lib/data";
import type { DevnetProofRecord, MerchantVerification } from "../lib/types";

const BLOCKED_SIG = "5yWAEdtjihJjGWk9phXLvAG831r9yqvT7qrPgbmaFXoS5whsFSLLuuLLFGnUmKpAE22RWvFxPk3NDn1oCqfEqEf8";
const RAW_DRAIN_SIG = "wTo4fANWAG6P3azWJ4W3MQVYn5rYpZp6s3ZijsKsN4xGP2ACCGieZgtYKXZ6wiFNW3WTek9Paeco9bozGye95p3";

function SkeletonRow() {
  return (
    <div className="flex gap-4 px-4 py-3 border-b border-[rgba(255,255,255,0.04)] animate-pulse">
      {[60, 120, 80, 80, 60, 50, 90].map((w, i) => (
        <div key={i} className="h-3 bg-[rgba(255,255,255,0.06)] rounded" style={{ width: w }} />
      ))}
    </div>
  );
}

/** Horizontal event timeline rail — dots stream in L→R, crimson=blocked, emerald=allowed */
function EventRail({
  records,
  onSelect,
  selected,
}: {
  records: DevnetProofRecord[];
  onSelect: (r: DevnetProofRecord) => void;
  selected: DevnetProofRecord | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [hovered, setHovered] = useState<string | null>(null);

  if (records.length === 0) return null;

  return (
    <div
      ref={ref}
      className="relative flex flex-col gap-2 py-4"
      aria-label="Proof event timeline"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[9px] font-mono uppercase tracking-widest text-[rgba(237,237,237,0.25)]">
          Event rail
        </span>
        <div className="flex-1 h-px bg-[rgba(255,255,255,0.04)]" />
        <span className="text-[9px] font-mono text-[rgba(237,237,237,0.2)]">
          {records.length} events
        </span>
      </div>

      {/* Track */}
      <div className="relative flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {/* Base track line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-0 right-0 top-1/2 h-px bg-[rgba(255,255,255,0.06)] origin-left pointer-events-none"
          style={{ transform: "translateY(-50%)" }}
        />

        {records.map((r, i) => {
          const id = r.id ?? r.signature;
          const isBlocked = r.status === "blocked";
          const isSelected = selected && (selected.id ?? selected.signature) === id;
          const isHovered = hovered === id;

          return (
            <motion.button
              key={id}
              initial={{ opacity: 0, scale: 0 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{
                delay: 0.1 + i * 0.04,
                duration: 0.25,
                type: "spring",
                stiffness: 400,
                damping: 22,
              }}
              whileHover={{ scale: 1.4 }}
              onClick={() => onSelect(r)}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              aria-label={`${r.action} — ${r.status}`}
              className="relative flex-shrink-0 cursor-pointer focus:outline-none group"
            >
              <div
                className={`w-3 h-3 rounded-full border transition-all duration-150 ${
                  isBlocked
                    ? "bg-crimson/80 border-crimson"
                    : "bg-emerald/70 border-emerald"
                } ${isSelected ? "ring-2 ring-offset-1 ring-offset-[#050505] ring-cyan" : ""}`}
                style={
                  isHovered
                    ? {
                        boxShadow: isBlocked
                          ? "0 0 8px rgba(225,29,72,0.8)"
                          : "0 0 8px rgba(16,185,129,0.8)",
                      }
                    : undefined
                }
              />
              {/* Tooltip */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.9 }}
                    transition={{ duration: 0.12 }}
                    className="absolute bottom-full left-1/2 mb-2 z-20 pointer-events-none"
                    style={{ transform: "translateX(-50%)" }}
                  >
                    <div className={`px-2 py-1.5 rounded-lg border text-[9px] font-mono whitespace-nowrap ${
                      isBlocked
                        ? "bg-[#1a0a0a] border-crimson/30 text-crimson"
                        : "bg-[#0a1a10] border-emerald/30 text-emerald"
                    }`}>
                      {isBlocked ? <ShieldX size={8} className="inline mr-1" /> : <ShieldCheck size={8} className="inline mr-1" />}
                      {isBlocked ? "BLOCKED" : "ALLOWED"}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}

        {/* Live cursor */}
        <motion.div
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
          className="w-0.5 h-3.5 bg-cyan/60 flex-shrink-0 ml-0.5"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-crimson/80" />
          <span className="text-[9px] font-mono text-[rgba(237,237,237,0.3)]">
            blocked ({records.filter((r) => r.status === "blocked").length})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald/70" />
          <span className="text-[9px] font-mono text-[rgba(237,237,237,0.3)]">
            allowed ({records.filter((r) => r.status === "allowed").length})
          </span>
        </div>
      </div>
    </div>
  );
}

/** Animated ratio bar — blocked vs allowed breakdown */
function ProofRatioBar({ records, loading }: { records: DevnetProofRecord[]; loading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const total = records.length || 1;
  const blocked = records.filter((r) => r.status === "blocked").length;
  const pct = Math.round((blocked / total) * 100);

  if (loading || records.length === 0) return null;

  return (
    <div ref={ref} className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
          Block rate
        </span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-[10px] font-mono text-crimson"
        >
          {pct}% blocked
        </motion.span>
      </div>
      <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : {}}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full bg-crimson/70"
          style={{ boxShadow: "0 0 6px rgba(225,29,72,0.5)" }}
        />
      </div>
    </div>
  );
}

export function Proofs() {
  const { records, summary, loading } = useDevnetProofs();
  const [selected, setSelected] = useState<DevnetProofRecord | null>(null);
  const [filter, setFilter] = useState<"all" | "blocked" | "allowed">("all");
  const [merchantData, setMerchantData] = useState<MerchantVerification | null>(null);

  useEffect(() => {
    loadMerchantVerification().then(setMerchantData).catch(() => {});
  }, []);

  const filtered = records.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  return (
    <PageShell>
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col gap-4 max-w-2xl"
        >
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-mono uppercase tracking-[0.2em] text-cyan"
          >
            Proof Explorer
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight text-[#EDEDED]"
          >
            Do not trust the dashboard.{" "}
            <span className="text-[rgba(237,237,237,0.38)]">Trust the chain.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="text-[rgba(237,237,237,0.58)] leading-relaxed max-w-lg"
          >
            Cached devnet proofs from Vajra guarded-transfer attempts. Blocked attempts show failed
            status, triggered rule, zero inner token transfers, and unchanged vault balance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] w-fit"
          >
            <Info size={12} className="text-[rgba(237,237,237,0.35)]" />
            <span className="text-xs font-mono text-[rgba(237,237,237,0.45)]">
              Cached Devnet Proofs — not live chain data
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Metrics ────────────────────────────────────────────────────── */}
      <section className="pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Blocked attempts", value: loading ? "—" : summary.blockedCount, accent: "crimson" as const, icon: <Shield size={14} /> },
            { label: "Allowed attempts", value: loading ? "—" : summary.allowedCount, accent: "emerald" as const, icon: <Zap size={14} /> },
            { label: "Vault Δ (blocked)", value: "0.00 DemoUSD", sub: "Funds never moved", accent: "emerald" as const, icon: <Database size={14} /> },
            { label: "Inner transfers (blocked)", value: loading ? "—" : summary.innerTransfersOnBlocked, sub: "Zero SPL token moves", accent: "cyan" as const, icon: <AlertTriangle size={14} /> },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <MetricCard {...m} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Ratio bar ──────────────────────────────────────────────────── */}
      <section className="pb-4">
        <ProofRatioBar records={records} loading={loading} />
      </section>

      {/* ─── Event Rail ─────────────────────────────────────────────────── */}
      {!loading && records.length > 0 && (
        <section className="pb-2 border-b border-[rgba(255,255,255,0.04)]">
          <EventRail records={records} onSelect={setSelected} selected={selected} />
        </section>
      )}

      {/* ─── Filter tabs ─────────────────────────────────────────────────── */}
      <section className="py-4">
        <div className="relative flex items-center gap-1 p-1 bg-[#0e0e0e] rounded-xl border border-[rgba(255,255,255,0.07)] w-fit">
          {(["all", "blocked", "allowed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="relative px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors capitalize cursor-pointer z-10"
              style={{
                color:
                  filter === f
                    ? f === "blocked"
                      ? "rgba(225,29,72,0.9)"
                      : f === "allowed"
                      ? "rgba(16,185,129,0.9)"
                      : "rgba(237,237,237,0.9)"
                    : "rgba(237,237,237,0.45)",
              }}
            >
              {filter === f && (
                <motion.div
                  layoutId="filter-pill"
                  className="absolute inset-0 bg-[#1e1e1e] border border-[rgba(255,255,255,0.1)] rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                {f}
                {!loading && (
                  <span className="ml-1.5 text-[rgba(237,237,237,0.3)]">
                    {f === "all"
                      ? records.length
                      : records.filter((r) => r.status === f).length}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ─── Table ──────────────────────────────────────────────────────── */}
      <section className="pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
                <div className="px-4 py-2.5 bg-[#0d0d0d] border-b border-[rgba(255,255,255,0.06)]" />
                {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : (
              <ProofExplorerTable records={filtered} onSelect={setSelected} />
            )}

            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-sm text-[rgba(237,237,237,0.35)] gap-2">
                <Shield size={24} className="opacity-30" />
                <span>No {filter} records found</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Enforcement statement for blocked */}
        <AnimatePresence>
          {!loading && filter !== "allowed" && summary.blockedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ delay: 0.3, duration: 0.35 }}
              className="mt-6 px-5 py-4 rounded-xl bg-crimson/5 border border-crimson/15 relative overflow-hidden"
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-crimson/5 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 1 }}
              />
              <div className="relative flex items-start gap-3">
                <ShieldX size={14} className="text-crimson mt-0.5 shrink-0" />
                <p className="text-sm text-[rgba(237,237,237,0.6)] leading-relaxed">
                  Blocked attempts have failed transaction status on Solana Explorer. Vault delta is 0.00
                  DemoUSD. Inner token transfers are 0. The Vajra program rejected the transfer before
                  funds moved.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ─── Live RPC Verification ──────────────────────────────────────── */}
      <section className="pb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-cyan">Live RPC Check</span>
            <p className="text-sm text-[rgba(237,237,237,0.5)]">
              Fetch transaction metadata from Solana devnet RPC and compare against committed proof artifacts.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LiveDevnetVerifier
              signature={BLOCKED_SIG}
              label="Blocked Vajra drain — expects failed tx"
              expectation={{
                expectedClassification: "vajra_blocked",
                expectedVaultDelta: 0,
                expectedInnerTransfers: 0,
                expectedTxFailed: true,
              }}
            />
            <LiveDevnetVerifier
              signature={RAW_DRAIN_SIG}
              label="Raw wallet drain — expects successful tx"
              expectation={{
                expectedClassification: "not_vajra",
                expectedTxFailed: false,
              }}
            />
          </div>
          <p className="text-[9px] font-mono text-[rgba(237,237,237,0.3)] max-w-lg leading-relaxed">
            Read-only RPC call to api.devnet.solana.com. Does not execute transactions. Recorded proof artifacts remain the stable reference.
          </p>
        </motion.div>
      </section>

      {/* ─── Merchant Verification ──────────────────────────────────────── */}
      <section className="pb-20">
        <MerchantVerifierPanel data={merchantData} />
      </section>

      {/* Detail drawer */}
      <ProofDetailDrawer record={selected} onClose={() => setSelected(null)} />
    </PageShell>
  );
}
