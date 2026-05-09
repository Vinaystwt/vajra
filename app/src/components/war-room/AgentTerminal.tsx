/**
 * AgentTerminal — agent control panel with cinematic compromised transformation.
 * Glitch effect on compromised mode toggle.
 */
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, AlertOctagon, CheckCircle2, RotateCcw, Ban } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { GlitchText } from "../effects/GlitchText";
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";
import type { WarRoomMode, WarRoomState } from "../../lib/types";
import type { WarRoomAttempt } from "../../lib/types";

interface Props {
  mode: WarRoomMode;
  state: WarRoomState;
  onAttempt: (attempt: WarRoomAttempt) => void;
  onToggleMode: () => void;
  onRevoke: () => void;
  onReset: () => void;
  attempts: WarRoomAttempt[];
}

export function AgentTerminal({
  mode,
  state,
  onAttempt,
  onToggleMode,
  onRevoke,
  onReset,
  attempts,
}: Props) {
  const reduced = useReducedMotionSafe();
  const busy = state === "normal_animating" || state === "attack_animating";
  const revoked = state === "revoked";
  const isCompromised = mode === "compromised";
  const prevModeRef = useRef(mode);
  const headerRef = useRef<HTMLDivElement>(null);

  const normalAttempts = attempts.filter((a) => a.mode === "normal");
  const attackAttempts = attempts.filter((a) => a.mode === "attack");

  // Glitch flash when toggling compromised mode
  useEffect(() => {
    if (prevModeRef.current !== mode && !reduced) {
      const el = headerRef.current;
      if (!el) return;
      el.style.filter = "brightness(2) saturate(0)";
      const t1 = setTimeout(() => { el.style.filter = "brightness(0.3)"; }, 60);
      const t2 = setTimeout(() => { el.style.filter = "brightness(1.5) hue-rotate(20deg)"; }, 120);
      const t3 = setTimeout(() => { el.style.filter = ""; }, 220);
      prevModeRef.current = mode;
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
    prevModeRef.current = mode;
  }, [mode, reduced]);

  return (
    <div className="flex flex-col gap-3">
      {/* Agent header card */}
      <motion.div
        ref={headerRef}
        className={cn(
          "panel p-4 flex items-start justify-between gap-3 relative overflow-hidden transition-colors duration-500",
          isCompromised ? "panel-crimson" : ""
        )}
        animate={
          reduced ? {} :
          isCompromised
            ? { borderColor: "rgba(225,29,72,0.35)" }
            : { borderColor: "rgba(255,255,255,0.08)" }
        }
        transition={{ duration: 0.4 }}
      >
        {/* Compromised background noise */}
        <AnimatePresence>
          {isCompromised && !reduced && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 3px,
                  rgba(225,29,72,0.015) 3px,
                  rgba(225,29,72,0.015) 4px
                )`,
              }}
            />
          )}
        </AnimatePresence>

        <div className="flex items-start gap-3 relative">
          {/* Agent icon */}
          <motion.div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl shrink-0 relative overflow-hidden",
              isCompromised ? "bg-crimson/15 border border-crimson/25" : "bg-cyan/10 border border-cyan/15"
            )}
            animate={
              reduced ? {} :
              isCompromised
                ? { boxShadow: ["0 0 0 0 rgba(225,29,72,0.4)", "0 0 0 8px rgba(225,29,72,0)"] }
                : {}
            }
            transition={{ duration: 0.8, repeat: isCompromised ? Infinity : 0 }}
          >
            <AnimatePresence mode="wait">
              {isCompromised ? (
                <motion.div
                  key="compromised"
                  initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <AlertOctagon size={18} className="text-crimson" />
                </motion.div>
              ) : (
                <motion.div
                  key="normal"
                  initial={{ scale: 0.5, opacity: 0, rotate: 15 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <Cpu size={18} className="text-cyan" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="flex flex-col gap-0.5">
            <AnimatePresence mode="wait">
              <motion.span
                key={mode}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-semibold text-[#EDEDED]"
              >
                <GlitchText active={isCompromised} intensity={isCompromised ? "medium" : "low"}>
                  {isCompromised ? "CompromisedAgent" : "APIBuyerAgent"}
                </GlitchText>
              </motion.span>
            </AnimatePresence>
            <span className="text-[10px] font-mono text-[rgba(237,237,237,0.38)]">
              GDVVFih6…hcTi
            </span>
            <motion.span
              className={cn(
                "text-[10px] font-mono uppercase tracking-wider font-semibold",
                isCompromised ? "text-crimson" : "text-cyan"
              )}
              animate={
                reduced ? {} :
                isCompromised
                  ? { opacity: [1, 0.5, 1] }
                  : {}
              }
              transition={{ duration: 1, repeat: isCompromised ? Infinity : 0 }}
            >
              {revoked ? "BLOCKED — policy revoked" : isCompromised ? "⚠ COMPROMISED" : "● NORMAL"}
            </motion.span>
          </div>
        </div>

        {/* Mode toggle */}
        <button
          onClick={onToggleMode}
          disabled={busy || revoked}
          aria-label={isCompromised ? "Switch to normal mode" : "Switch to compromised mode"}
          aria-pressed={isCompromised}
          title={isCompromised ? "Compromised mode — click to restore" : "Enable compromised mode"}
          className={cn(
            "shrink-0 relative flex items-center w-12 h-6 rounded-full transition-all duration-400 disabled:opacity-30",
            isCompromised ? "bg-crimson/35" : "bg-cyan/20"
          )}
        >
          <motion.div
            className={cn(
              "absolute w-4 h-4 rounded-full shadow-sm",
              isCompromised ? "bg-crimson" : "bg-cyan"
            )}
            animate={{ left: isCompromised ? "26px" : "4px" }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            style={{ boxShadow: isCompromised ? "0 0 8px rgba(225,29,72,0.6)" : "0 0 8px rgba(0,229,255,0.5)" }}
          />
        </button>
      </motion.div>

      {/* Normal attempts */}
      <div className="flex flex-col gap-2">
        {normalAttempts.map((attempt) => (
          <button
            key={attempt.id}
            onClick={() => onAttempt(attempt)}
            disabled={busy || revoked}
            className={cn(
              "group panel p-3 text-left transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
              "hover:border-cyan/25 hover:bg-cyan/3"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald/15 border border-emerald/20 shrink-0">
                <CheckCircle2 size={11} className="text-emerald" />
              </div>
              <div className="flex flex-col gap-0 flex-1 min-w-0">
                <span className="text-xs font-medium text-[rgba(237,237,237,0.85)] truncate">{attempt.label}</span>
                <span className="text-[10px] font-mono text-[rgba(237,237,237,0.38)] truncate">{attempt.description}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Attack attempts — only visible in compromised mode */}
      <AnimatePresence>
        {isCompromised && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-2 overflow-hidden"
          >
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-crimson/20" />
              <span className="text-[9px] font-mono text-crimson/60 uppercase tracking-wider">Attack vectors</span>
              <div className="flex-1 h-px bg-crimson/20" />
            </div>
            {attackAttempts.map((attempt) => (
              <motion.button
                key={attempt.id}
                onClick={() => onAttempt(attempt)}
                disabled={busy || revoked}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "group panel p-3 text-left transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                  "border-crimson/15 hover:border-crimson/30 hover:bg-crimson/4"
                )}
                whileHover={reduced ? {} : { scale: 1.01 }}
                whileTap={reduced ? {} : { scale: 0.99 }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-5 h-5 rounded-md bg-crimson/15 border border-crimson/25 shrink-0">
                    <AlertOctagon size={11} className="text-crimson" />
                  </div>
                  <div className="flex flex-col gap-0 flex-1 min-w-0">
                    <span className="text-xs font-medium text-[rgba(237,237,237,0.85)] truncate">{attempt.label}</span>
                    <span className="text-[10px] font-mono text-[rgba(237,237,237,0.38)] truncate">{attempt.description}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        {!revoked && (
          <Button
            variant="danger"
            size="sm"
            onClick={onRevoke}
            disabled={busy}
            className="flex-1 min-w-0"
          >
            <Ban size={11} />
            Revoke
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={busy}
          className="flex-1 min-w-0"
        >
          <RotateCcw size={11} />
          Reset
        </Button>
      </div>
    </div>
  );
}

