import { useReducer, useCallback } from "react";
import type { WarRoomState, WarRoomMode } from "../lib/types";

interface WarRoomStateData {
  state: WarRoomState;
  mode: WarRoomMode;
  vaultBalance: number;
  initialBalance: number;
  lastAttemptId: string | null;
  lastResult: "allowed" | "blocked" | null;
  lastRule: string | null;
  logs: string[];
  totalSpent: number;
}

type Action =
  | { type: "SET_MODE"; mode: WarRoomMode }
  | { type: "START_ATTEMPT"; id: string; logs: string[] }
  | { type: "COMPLETE_ALLOWED"; amount: number }
  | { type: "COMPLETE_BLOCKED"; rule: string }
  | { type: "REVEAL_PROOF" }
  | { type: "REVOKE" }
  | { type: "RESET" }
  | { type: "APPEND_LOG"; line: string };

const INITIAL: WarRoomStateData = {
  state: "idle",
  mode: "normal",
  vaultBalance: 10000,
  initialBalance: 10000,
  lastAttemptId: null,
  lastResult: null,
  lastRule: null,
  logs: ["[System] War Room initialized. Vault locked to PolicyPDA."],
  totalSpent: 0,
};

function reducer(s: WarRoomStateData, a: Action): WarRoomStateData {
  switch (a.type) {
    case "SET_MODE":
      return {
        ...s,
        mode: a.mode,
        state: a.mode === "compromised" ? "compromised_idle" : "idle",
        logs: [
          ...s.logs,
          a.mode === "compromised"
            ? "[ALERT] COMPROMISED MODE — agent key treated as attacker"
            : "[System] Normal mode restored",
        ],
      };
    case "START_ATTEMPT":
      return {
        ...s,
        state:
          s.mode === "compromised" ? "attack_animating" : "normal_animating",
        lastAttemptId: a.id,
        logs: [...s.logs, ...a.logs],
      };
    case "COMPLETE_ALLOWED":
      return {
        ...s,
        state: "normal_success",
        lastResult: "allowed",
        lastRule: "all_clear",
        vaultBalance: Math.max(0, s.vaultBalance - a.amount),
        totalSpent: s.totalSpent + a.amount,
        logs: [
          ...s.logs,
          `[PASS] Transfer complete. Vault: ${(s.vaultBalance - a.amount).toFixed(2)} DemoUSD`,
        ],
      };
    case "COMPLETE_BLOCKED":
      return {
        ...s,
        state: "blocked",
        lastResult: "blocked",
        lastRule: a.rule,
        logs: [
          ...s.logs,
          `[BLOCKED] ${a.rule} — vault balance unchanged: ${s.vaultBalance.toFixed(2)} DemoUSD`,
        ],
      };
    case "REVEAL_PROOF":
      return { ...s, state: "proof_revealed" };
    case "REVOKE":
      return {
        ...s,
        state: "revoked",
        logs: [...s.logs, "[OWNER] Policy revoked. All future transfers blocked."],
      };
    case "RESET":
      return {
        ...INITIAL,
        logs: ["[System] War Room reset. Vault restored to 10,000.00 DemoUSD."],
      };
    case "APPEND_LOG":
      return { ...s, logs: [...s.logs, a.line] };
    default:
      return s;
  }
}

export function useWarRoomState() {
  const [data, dispatch] = useReducer(reducer, INITIAL);

  const setMode = useCallback((mode: WarRoomMode) => dispatch({ type: "SET_MODE", mode }), []);
  const startAttempt = useCallback((id: string, logs: string[]) =>
    dispatch({ type: "START_ATTEMPT", id, logs }), []);
  const completeAllowed = useCallback((amount: number) =>
    dispatch({ type: "COMPLETE_ALLOWED", amount }), []);
  const completeBlocked = useCallback((rule: string) =>
    dispatch({ type: "COMPLETE_BLOCKED", rule }), []);
  const revealProof = useCallback(() => dispatch({ type: "REVEAL_PROOF" }), []);
  const revoke = useCallback(() => dispatch({ type: "REVOKE" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { ...data, setMode, startAttempt, completeAllowed, completeBlocked, revealProof, revoke, reset };
}
