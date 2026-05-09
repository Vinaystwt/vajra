/**
 * ProofRevealCard — forensic proof packet that animates in after a block.
 * Rows stream in with stagger. Explorer link slides in last.
 */
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, ShieldX, ShieldCheck, FileText, Hash } from "lucide-react";
import { cn } from "../../lib/utils";
import { GUARD_LABELS, explorerTx } from "../../lib/constants";
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";

interface Props {
  visible: boolean;
  rule?: string | null;
  signature?: string;
  mode: "allowed" | "blocked";
}

const PROOF_ROWS = (isBlocked: boolean, label: string) => [
  { label: "Status", value: isBlocked ? "FAILED — Blocked" : "SUCCESS — Allowed", color: isBlocked ? "text-crimson" : "text-emerald" },
  { label: "Rule triggered", value: label, color: isBlocked ? "text-crimson/80" : "text-emerald/80" },
  { label: "Vault Δ", value: isBlocked ? "0.00 DemoUSD" : "— moved", color: isBlocked ? "text-cyan font-semibold" : "text-[rgba(237,237,237,0.6)]" },
  { label: "Inner transfers", value: isBlocked ? "0" : "1", color: isBlocked ? "text-cyan font-semibold" : "text-[rgba(237,237,237,0.6)]" },
];

export function ProofRevealCard({ visible, rule, signature, mode }: Props) {
  const reduced = useReducedMotionSafe();
  const isBlocked = mode === "blocked";
  const label = rule ? (GUARD_LABELS[rule] ?? rule) : "All Clear";
  const demoSig = signature || "34L5qsBYopSPP6jkxiwmJjWPX1AhBJvxqmcDMNH7Mhu1HVqxGWHLHpT5nLDmFQB9h5hhfqPDVkwBQ4cn7nHW6dEu";
  const rows = PROOF_ROWS(isBlocked, label);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "rounded-xl border overflow-hidden",
            isBlocked ? "border-crimson/25" : "border-emerald/25"
          )}
        >
          {/* Header */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 border-b",
              isBlocked
                ? "bg-crimson/8 border-crimson/15"
                : "bg-emerald/6 border-emerald/15"
            )}
          >
            <motion.div
              initial={reduced ? {} : { rotate: -30, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
            >
              {isBlocked ? (
                <ShieldX size={13} className="text-crimson" />
              ) : (
                <ShieldCheck size={13} className="text-emerald" />
              )}
            </motion.div>
            <span className={cn("text-[10px] font-mono font-bold uppercase tracking-wider", isBlocked ? "text-crimson" : "text-emerald")}>
              {isBlocked ? "Transfer Rejected" : "Transfer Confirmed"}
            </span>
            <div className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.08)] text-[8px] font-mono text-[rgba(237,237,237,0.28)]">
              <FileText size={8} />
              Cached Devnet Proof
            </div>
          </div>

          {/* Proof rows with stagger */}
          <div className="p-3 bg-[rgba(0,0,0,0.3)] flex flex-col gap-1.5">
            {rows.map((row, i) => (
              <motion.div
                key={row.label}
                initial={reduced ? { opacity: 1 } : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: reduced ? 0 : 0.08 + i * 0.06 }}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-[9px] font-mono uppercase tracking-widest text-[rgba(237,237,237,0.28)] shrink-0">
                  {row.label}
                </span>
                <span className={cn("text-[10px] font-mono text-right", row.color)}>
                  {row.value}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Key statement */}
          {isBlocked && (
            <motion.div
              initial={reduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="px-3 py-2 border-t border-crimson/10 text-[9px] font-mono text-[rgba(237,237,237,0.42)] leading-relaxed"
            >
              Program rejected transfer before CPI executed. Vault balance unchanged.
            </motion.div>
          )}

          {/* Explorer link */}
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.45 }}
            className={cn(
              "px-3 py-2.5 border-t flex items-center justify-between",
              isBlocked ? "border-crimson/10" : "border-emerald/10"
            )}
          >
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-[rgba(237,237,237,0.25)]">
              <Hash size={9} />
              <span className="truncate max-w-[100px]">{demoSig.slice(0, 12)}…</span>
            </div>
            <a
              href={explorerTx(demoSig)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-mono text-cyan/60 hover:text-cyan transition-colors"
            >
              Explorer
              <ExternalLink size={10} />
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
