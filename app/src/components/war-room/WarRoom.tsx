/**
 * WarRoom — orchestrates the cinematic attack simulation.
 * 3D vault scene + network field + 3-panel interaction layout.
 */
import { useCallback, useRef, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { sleep } from "../../lib/utils";
import { useWarRoomState } from "../../hooks/useWarRoomState";
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";
import { WAR_ROOM_ATTEMPTS } from "../../lib/data";
import type { WarRoomAttempt } from "../../lib/types";
import { AgentTerminal } from "./AgentTerminal";
import { PolicyGate } from "./PolicyGate";
import { VaultCard } from "./VaultCard";
import { TerminalLog } from "./TerminalLog";
import { TransactionBeam } from "./TransactionBeam";
import { ProofRevealCard } from "./ProofRevealCard";
import { NetworkField } from "../effects/NetworkField";

const PolicyVaultScene = lazy(() =>
  import("../three/PolicyVaultScene").then((m) => ({ default: m.PolicyVaultScene }))
);

export function WarRoom() {
  const war = useWarRoomState();
  const reduced = useReducedMotionSafe();
  const lockRef = useRef(false);

  const handleAttempt = useCallback(
    async (attempt: WarRoomAttempt) => {
      if (lockRef.current) return;
      lockRef.current = true;

      war.startAttempt(attempt.id, attempt.terminalLines.slice(0, 5));

      const animDuration = reduced ? 0 : 900;
      await sleep(animDuration);

      if (attempt.expectedResult === "allowed") {
        war.completeAllowed(attempt.amount);
        await sleep(reduced ? 0 : 400);
      } else {
        war.completeBlocked(attempt.ruleTriggered ?? "unknown");
        await sleep(reduced ? 0 : 500);
        war.revealProof();
      }

      lockRef.current = false;
    },
    [war, reduced]
  );

  const toggleMode = useCallback(() => {
    war.setMode(war.mode === "normal" ? "compromised" : "normal");
  }, [war]);

  const beamState =
    war.state === "normal_animating" || war.state === "attack_animating"
      ? "animating"
      : war.state === "blocked" || war.state === "proof_revealed"
      ? "blocked"
      : war.state === "normal_success"
      ? "success"
      : "idle";

  const beamMode =
    war.mode === "compromised" || war.lastResult === "blocked" ? "attack" : "allowed";

  const activeDest = (() => {
    if (war.state === "idle" || war.state === "compromised_idle") return null;
    const last = WAR_ROOM_ATTEMPTS.find((a) => a.id === war.lastAttemptId);
    return last?.destination ?? null;
  })();

  const isCompromised = war.mode === "compromised";
  const isBlocked = war.state === "blocked" || war.state === "proof_revealed";

  return (
    <div className="flex flex-col gap-4">
      {/* Header strip */}
      <div className="flex items-center justify-between gap-4 mb-1">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold text-[#EDEDED]">War Room</h2>
          <p className="text-xs text-[rgba(237,237,237,0.42)]">
            Interactive simulation using Vajra devnet proof artifacts
          </p>
        </div>
        <AnimatePresence>
          {isCompromised && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 10 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-crimson/15 border border-crimson/30 text-xs font-mono text-crimson"
            >
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-crimson"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              COMPROMISED MODE
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3D Vault Scene — hero visual */}
      <motion.div
        className={cn(
          "relative rounded-2xl overflow-hidden border transition-all duration-700",
          isCompromised ? "border-crimson/20" : "border-[rgba(255,255,255,0.06)]"
        )}
        style={{ height: 200 }}
        animate={
          reduced ? {} :
          isBlocked ? { boxShadow: "0 0 0 1px rgba(225,29,72,0.15), 0 0 40px rgba(225,29,72,0.08)" }
          : isCompromised ? { boxShadow: "0 0 0 1px rgba(225,29,72,0.08), 0 0 20px rgba(225,29,72,0.04)" }
          : { boxShadow: "0 0 0 1px rgba(0,229,255,0.04), 0 0 20px rgba(0,229,255,0.03)" }
        }
        transition={{ duration: 0.6 }}
      >
        {/* Network field background */}
        <NetworkField
          compromised={isCompromised}
          density={0.35}
          opacity={0.7}
          className="rounded-2xl"
        />

        {/* 3D scene */}
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border border-cyan/30 border-t-cyan animate-spin" />
          </div>
        }>
          <PolicyVaultScene
            warState={war.state}
            mode={war.mode}
            className="absolute inset-0 w-full h-full"
          />
        </Suspense>

        {/* Overlay label */}
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider border",
              isCompromised
                ? "border-crimson/25 bg-crimson/8 text-crimson"
                : "border-cyan/20 bg-cyan/5 text-cyan"
            )}
          >
            <motion.div
              className={cn(
                "w-1 h-1 rounded-full",
                isCompromised ? "bg-crimson" : "bg-cyan"
              )}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            {isCompromised ? "Attack simulation" : "Policy enforced"}
          </div>
        </div>

        {/* Bottom vignette */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
      </motion.div>

      {/* Interaction panel */}
      <motion.div
        className={cn(
          "rounded-2xl border p-4 transition-all duration-500",
          isCompromised
            ? "border-crimson/20 bg-[#0d0404]"
            : "border-[rgba(255,255,255,0.07)] bg-[#0a0a0a]"
        )}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-0">
          {/* LEFT — Agent terminal */}
          <div className="flex flex-col gap-3 lg:pr-4">
            <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-[rgba(237,237,237,0.28)]">
              Agent
            </span>
            <AgentTerminal
              mode={war.mode}
              state={war.state}
              onAttempt={handleAttempt}
              onToggleMode={toggleMode}
              onRevoke={war.revoke}
              onReset={war.reset}
              attempts={WAR_ROOM_ATTEMPTS}
            />
          </div>

          {/* CENTER — Beam + Gate */}
          <div className="flex flex-col items-center gap-1 lg:px-4 w-full lg:w-52">
            {/* Beam: agent → gate */}
            <TransactionBeam state={beamState} mode={beamMode} direction="ltr" />

            <PolicyGate state={war.state} mode={war.mode} />

            {/* Beam: gate → vault (only passes when allowed) */}
            <TransactionBeam
              state={beamState === "blocked" ? "idle" : beamState}
              mode="allowed"
              direction="ltr"
            />
          </div>

          {/* RIGHT — Vault + Proof */}
          <div className="flex flex-col gap-3 lg:pl-4">
            <VaultCard
              balance={war.vaultBalance}
              initialBalance={war.initialBalance}
              state={war.state}
              destination={activeDest}
            />

            <ProofRevealCard
              visible={war.state === "proof_revealed" || war.state === "blocked"}
              rule={war.lastRule}
              mode={war.lastResult === "allowed" ? "allowed" : "blocked"}
            />
          </div>
        </div>
      </motion.div>

      {/* Terminal logs */}
      <TerminalLog logs={war.logs} mode={war.mode} />
    </div>
  );
}
