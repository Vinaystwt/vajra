/**
 * VaultCard — onchain vault with cinematic invariant animation.
 *
 * - Balance spring-animates on spend
 * - On block: lock ring closes, delta badge pulses, balance turns cyan (unchanged)
 * - On allowed: emerald success with balance tick down
 * - Budget ring meters animate
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Lock, TrendingDown, ShieldCheck } from "lucide-react";
import { cn } from "../../lib/utils";
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";
import type { WarRoomState } from "../../lib/types";

interface Props {
  balance: number;
  initialBalance: number;
  state: WarRoomState;
  destination: "merchant" | "attacker" | null;
}

const PER_TX_CAP = 500;
const PERIOD_BUDGET = 2500;

function LockRing({ active, size = 80 }: { active: boolean; size?: number }) {
  const reduced = useReducedMotionSafe();
  if (reduced) return null;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 3}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
        />
        {/* Animated progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 3}
          fill="none"
          stroke={active ? "#00E5FF" : "rgba(255,255,255,0.1)"}
          strokeWidth={active ? 2.5 : 1.5}
          strokeLinecap="round"
          strokeDasharray={Math.PI * (size - 6)}
          initial={{ strokeDashoffset: Math.PI * (size - 6) }}
          animate={{ strokeDashoffset: active ? 0 : Math.PI * (size - 6) }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ rotate: -90, transformOrigin: `${size / 2}px ${size / 2}px` }}
          strokeOpacity={active ? 1 : 0.3}
        />
        {/* Glow */}
        {active && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 3}
            fill="none"
            stroke="#00E5FF"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={Math.PI * (size - 6)}
            initial={{ strokeDashoffset: Math.PI * (size - 6), opacity: 0 }}
            animate={{ strokeDashoffset: 0, opacity: [0, 0.3, 0.15] }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ rotate: -90, transformOrigin: `${size / 2}px ${size / 2}px`, filter: "blur(3px)" }}
          />
        )}
      </svg>
    </div>
  );
}

function BudgetMeter({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-mono text-[rgba(237,237,237,0.3)] uppercase tracking-wider">{label}</span>
        <span className="text-[9px] font-mono text-[rgba(237,237,237,0.4)]">{value.toFixed(0)}/{max}</span>
      </div>
      <div className="h-[3px] bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}

export function VaultCard({ balance, initialBalance, state, destination }: Props) {
  const reduced = useReducedMotionSafe();
  const isBlocked = state === "blocked" || state === "proof_revealed";
  const isAllowed = state === "normal_success";
  const isAnimating = state === "normal_animating" || state === "attack_animating";
  const spent = initialBalance - balance;
  const pctRemaining = (balance / initialBalance) * 100;

  const [lockActive, setLockActive] = useState(false);
  const [prevBalance, setPrevBalance] = useState(balance);
  // Lock ring on block
  useEffect(() => {
    if (isBlocked) {
      const t = setTimeout(() => setLockActive(true), 150);
      return () => clearTimeout(t);
    } else {
      setLockActive(false);
    }
  }, [isBlocked]);

  // Balance change tracking
  useEffect(() => {
    if (balance !== prevBalance) {
      setPrevBalance(balance);
    }
  }, [balance, prevBalance]);

  const balanceColor = isBlocked
    ? "#00E5FF" // cyan = UNCHANGED emphasis
    : isAllowed
    ? "#10B981"
    : "#EDEDED";

  return (
    <div className="flex flex-col gap-2.5 min-w-0">
      <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-[rgba(237,237,237,0.28)]">
        Vault
      </span>

      {/* Vault panel */}
      <motion.div
        className={cn(
          "panel p-4 flex flex-col gap-3.5 relative overflow-hidden",
          isBlocked && "panel-crimson",
          isAllowed && "panel-cyan"
        )}
        animate={
          reduced ? {} :
          isBlocked && state === "blocked"
            ? { x: [0, -3, 3, -2, 2, 0] }
            : isAllowed
            ? { scale: [1, 1.01, 1] }
            : {}
        }
        transition={{ duration: 0.35 }}
      >
        {/* Scan line effect */}
        {isAnimating && !reduced && (
          <motion.div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan/40 to-transparent pointer-events-none"
            initial={{ top: 0 }}
            animate={{ top: "100%" }}
            transition={{ duration: 0.7, ease: "linear" }}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Database size={12} className="text-[rgba(237,237,237,0.35)]" />
            <span className="text-[10px] font-mono text-[rgba(237,237,237,0.45)]">SPL Vault</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono text-[rgba(237,237,237,0.25)]">
            <Lock size={8} />
            PolicyPDA
          </div>
        </div>

        {/* Balance + lock ring */}
        <div className="flex items-center gap-3">
          <LockRing active={lockActive} size={60} />
          <div className="flex flex-col gap-0.5 flex-1">
            <span className="text-[9px] font-mono uppercase tracking-wider text-[rgba(237,237,237,0.3)]">
              Balance
            </span>
            <motion.div
              key={`${balance}-${isBlocked}`}
              initial={{ opacity: 0.7, y: isBlocked ? 0 : -3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <span
                className={cn(
                  "text-xl font-mono font-semibold tracking-tight block",
                  isBlocked ? "text-cyan text-glow-cyan" : isAllowed ? "text-emerald" : "text-[#EDEDED]"
                )}
                style={{ color: balanceColor }}
              >
                {balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </motion.div>
            <span className="text-[10px] font-mono text-[rgba(237,237,237,0.35)]">DemoUSD</span>
          </div>

          {/* Lock icon on blocked */}
          <AnimatePresence>
            {isBlocked && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.25 }}
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-cyan/10 border border-cyan/20"
              >
                <Lock size={14} className="text-cyan" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main progress bar */}
        <div className="flex flex-col gap-1.5">
          <div className="h-2 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden relative">
            <motion.div
              className={cn(
                "h-full rounded-full relative overflow-hidden",
                balance < initialBalance * 0.3 ? "bg-crimson" : "bg-cyan"
              )}
              animate={{ width: `${pctRemaining}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 22 }}
            >
              {/* Shimmer on bar */}
              {!reduced && (
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  style={{
                    animation: "shimmer 2s linear infinite",
                    backgroundSize: "200% 100%",
                  }}
                />
              )}
            </motion.div>
          </div>
          <div className="flex justify-between text-[9px] font-mono text-[rgba(237,237,237,0.28)]">
            <span>Spent: {spent.toFixed(2)}</span>
            <span>{pctRemaining.toFixed(1)}% left</span>
          </div>
        </div>

        {/* Budget meters */}
        <div className="flex flex-col gap-2 border-t border-[rgba(255,255,255,0.05)] pt-3">
          <BudgetMeter
            label="Per-tx cap"
            value={Math.min(spent % PER_TX_CAP || 0, PER_TX_CAP)}
            max={PER_TX_CAP}
            color="#00E5FF"
          />
          <BudgetMeter
            label="Period"
            value={Math.min(spent, PERIOD_BUDGET)}
            max={PERIOD_BUDGET}
            color="#F59E0B"
          />
        </div>

        {/* Vault delta badge on block */}
        <AnimatePresence>
          {isBlocked && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex flex-col gap-1.5 p-3 bg-cyan/6 border border-cyan/20 rounded-xl"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={12} className="text-cyan shrink-0" />
                <span className="text-[10px] font-mono text-cyan font-semibold tracking-wide">
                  VAULT DELTA: 0.00 DemoUSD
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-emerald shrink-0" />
                <span className="text-[9px] font-mono text-[rgba(237,237,237,0.45)]">
                  Inner token transfers: 0
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-emerald shrink-0" />
                <span className="text-[9px] font-mono text-[rgba(237,237,237,0.45)]">
                  Policy enforced before CPI
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success transfer badge */}
        <AnimatePresence>
          {isAllowed && spent > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 px-3 py-2 bg-emerald/8 border border-emerald/20 rounded-xl"
            >
              <TrendingDown size={11} className="text-emerald shrink-0" />
              <span className="text-[10px] font-mono text-emerald">
                CPI transfer confirmed: -{spent.toFixed(2)} DemoUSD
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Destination */}
      <AnimatePresence>
        {destination && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="panel p-3 flex flex-col gap-1"
          >
            <span className="text-[9px] font-mono uppercase tracking-wider text-[rgba(237,237,237,0.28)]">
              Destination
            </span>
            <span
              className={cn(
                "text-[11px] font-mono",
                destination === "attacker" ? "text-crimson" : "text-[rgba(237,237,237,0.65)]"
              )}
            >
              {destination === "attacker"
                ? "⚠ attacker_wallet — not allowlisted"
                : "✓ merchant_a — allowlisted"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
