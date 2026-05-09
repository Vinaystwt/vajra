/**
 * PolicyGate — cinematic policy firewall visualization.
 *
 * Normal: pulsing cyan shield, active scan ring.
 * Compromised: amber warning, armed state.
 * Blocked: crimson impact flash, shield absorbs packet, rule shown.
 * Allowed: brief emerald pass confirmation.
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring } from "framer-motion";
import { ShieldCheck, ShieldX, ShieldOff, ShieldAlert, Lock, Zap } from "lucide-react";
import { cn } from "../../lib/utils";
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";
import type { WarRoomState, WarRoomMode } from "../../lib/types";

interface Props {
  state: WarRoomState;
  mode: WarRoomMode;
}

const RULES = [
  { label: "Cap", color: "text-cyan/60" },
  { label: "Budget", color: "text-cyan/60" },
  { label: "Velocity", color: "text-cyan/60" },
  { label: "Destination", color: "text-cyan/60" },
  { label: "Expiry", color: "text-cyan/60" },
];

export function PolicyGate({ state, mode }: Props) {
  const reduced = useReducedMotionSafe();
  const isBlocked = state === "blocked" || state === "proof_revealed";
  const isRevoked = state === "revoked";
  const isActive = state === "normal_animating" || state === "attack_animating";
  const isAllowed = state === "normal_success";
  const isCompromised = mode === "compromised";
  const isAttacking = state === "attack_animating";

  const [impactPhase, setImpactPhase] = useState<"none" | "impact" | "settling">("none");
  const [checkedRules, setCheckedRules] = useState<number[]>([]);
  const impactTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Impact animation sequence
  useEffect(() => {
    if (isBlocked && !reduced) {
      setImpactPhase("impact");
      impactTimer.current = setTimeout(() => setImpactPhase("settling"), 350);
      return () => { if (impactTimer.current) clearTimeout(impactTimer.current); };
    }
    if (!isBlocked) setImpactPhase("none");
  }, [isBlocked, reduced]);

  // Guard scan animation — show rules checking during animating
  useEffect(() => {
    if (!isActive) { setCheckedRules([]); return; }
    setCheckedRules([]);
    let i = 0;
    const interval = setInterval(() => {
      setCheckedRules((prev) => [...prev, i]);
      i++;
      if (i >= RULES.length) clearInterval(interval);
    }, 130);
    return () => clearInterval(interval);
  }, [isActive]);

  // Spring for shield scale on impact
  const scaleSpring = useSpring(1, { stiffness: 600, damping: 18 });
  useEffect(() => {
    if (impactPhase === "impact") {
      scaleSpring.set(0.88);
      setTimeout(() => scaleSpring.set(1.05), 120);
      setTimeout(() => scaleSpring.set(1), 280);
    }
  }, [impactPhase, scaleSpring]);

  const gateColor = isRevoked
    ? "border-[rgba(237,237,237,0.1)] bg-[rgba(237,237,237,0.02)]"
    : isBlocked
    ? "border-crimson/40 bg-crimson/8"
    : isAllowed
    ? "border-emerald/30 bg-emerald/5"
    : isCompromised
    ? "border-amber/25 bg-amber/4"
    : "border-cyan/25 bg-cyan/4";

  const accentColor = isRevoked ? "#666" : isBlocked ? "#E11D48" : isAllowed ? "#10B981" : isCompromised ? "#F59E0B" : "#00E5FF";

  return (
    <div className="flex flex-col items-center gap-2 min-w-0 relative">
      <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-[rgba(237,237,237,0.28)]">
        Policy Gate
      </span>

      {/* Main gate visual */}
      <motion.div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border p-4 gap-3 w-full max-w-[174px] cursor-default",
          gateColor
        )}
        style={{ scale: reduced ? 1 : scaleSpring }}
        animate={
          reduced ? {} :
          impactPhase === "impact"
            ? { x: [0, -5, 5, -4, 4, -2, 2, 0] }
            : isActive
            ? { scale: [1, 1.01, 1] }
            : {}
        }
        transition={
          impactPhase === "impact"
            ? { duration: 0.35, ease: "easeInOut" }
            : { duration: 1.2, repeat: isActive ? Infinity : 0 }
        }
      >
        {/* Impact flash overlay */}
        <AnimatePresence>
          {impactPhase === "impact" && !reduced && (
            <motion.div
              className="absolute inset-0 rounded-2xl bg-crimson/30 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        {/* Outer scanning ring — active only */}
        <AnimatePresence>
          {isActive && !isRevoked && !reduced && (
            <>
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-2xl border",
                  isAttacking ? "border-crimson/40" : "border-cyan/35"
                )}
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 1.12, opacity: 0 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-2xl border",
                  isAttacking ? "border-crimson/30" : "border-cyan/25"
                )}
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.22, opacity: 0 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeOut", delay: 0.2 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Shield icon */}
        <motion.div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl relative",
            isRevoked
              ? "bg-[rgba(237,237,237,0.04)]"
              : isBlocked
              ? "bg-crimson/15"
              : isAllowed
              ? "bg-emerald/15"
              : isCompromised
              ? "bg-amber/10"
              : "bg-cyan/10"
          )}
          animate={
            reduced ? {} :
            isActive
              ? { boxShadow: [`0 0 0 0 ${accentColor}40`, `0 0 0 8px ${accentColor}00`] }
              : {}
          }
          transition={{ duration: 0.9, repeat: isActive ? Infinity : 0 }}
        >
          {isRevoked ? (
            <ShieldOff size={22} className="text-[rgba(237,237,237,0.25)]" />
          ) : isBlocked ? (
            <motion.div
              animate={reduced ? {} : { rotate: [0, -8, 8, -4, 4, 0] }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <ShieldX size={22} className="text-crimson" />
            </motion.div>
          ) : isAttacking ? (
            <ShieldAlert size={22} className="text-amber" />
          ) : isAllowed ? (
            <ShieldCheck size={22} className="text-emerald" />
          ) : (
            <ShieldCheck size={22} className={isCompromised ? "text-amber" : "text-cyan"} />
          )}
        </motion.div>

        {/* Status label */}
        <div className="flex flex-col items-center gap-0.5">
          <AnimatePresence mode="wait">
            <motion.span
              key={state + mode}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "text-[10px] font-mono font-bold tracking-wider uppercase",
                isRevoked
                  ? "text-[rgba(237,237,237,0.25)]"
                  : isBlocked
                  ? "text-crimson"
                  : isAllowed
                  ? "text-emerald"
                  : isCompromised
                  ? "text-amber"
                  : "text-cyan"
              )}
            >
              {isRevoked ? "Revoked" : isBlocked ? "Rejected" : isAllowed ? "Passed" : isAttacking ? "Scanning" : isCompromised ? "Armed" : "Active"}
            </motion.span>
          </AnimatePresence>
          <span className="text-[9px] font-mono text-[rgba(237,237,237,0.25)]">PolicyPDA</span>
        </div>

        {/* Guard checks scanning */}
        <div className="w-full flex flex-col gap-0.5">
          {RULES.map((rule, i) => (
            <div key={rule.label} className="flex items-center gap-1.5">
              <motion.div
                className={cn("w-1 h-1 rounded-full shrink-0", checkedRules.includes(i) ? "bg-emerald" : "bg-[rgba(255,255,255,0.1)]")}
                animate={checkedRules.includes(i) && !reduced ? { scale: [1.5, 1] } : {}}
                transition={{ duration: 0.2 }}
              />
              <span className={cn("text-[9px] font-mono", checkedRules.includes(i) ? "text-emerald/70" : "text-[rgba(237,237,237,0.2)]")}>
                {rule.label}
              </span>
              {checkedRules.includes(i) && (
                <motion.span
                  className="ml-auto text-[8px] font-mono text-emerald/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  PASS
                </motion.span>
              )}
            </div>
          ))}
        </div>

        {/* Blocked rule */}
        <AnimatePresence>
          {isBlocked && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, delay: 0.1 }}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 bg-crimson/12 border border-crimson/25 rounded-lg"
            >
              <Zap size={10} className="text-crimson shrink-0" />
              <span className="text-[9px] font-mono text-crimson font-semibold truncate">
                TRANSFER BLOCKED
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vault authority label */}
        <div className="flex items-center gap-1 text-[8px] font-mono text-[rgba(237,237,237,0.2)]">
          <Lock size={8} />
          vault auth = PDA
        </div>
      </motion.div>
    </div>
  );
}
