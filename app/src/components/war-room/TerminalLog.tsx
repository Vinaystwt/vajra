/**
 * TerminalLog — streaming terminal with line-by-line color coding.
 * Lines animate in sequentially. Cursor blinks on last line.
 */
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";

interface Props {
  logs: string[];
  mode: "normal" | "compromised";
}

function lineColor(line: string): string {
  if (line.includes("[FAIL]") || line.includes("Error:") || line.includes("REJECTED")) return "text-crimson";
  if (line.includes("[PASS]") || line.includes("complete") || line.includes("initialized")) return "text-emerald/90";
  if (line.includes("[ALERT]") || line.includes("COMPROMISED") || line.includes("attacker")) return "text-amber";
  if (line.includes("ENFORCEMENT") || line.includes("BLOCKED")) return "text-crimson font-semibold";
  if (line.includes("PolicyPDA") || line.includes("VAJRA_GUARD")) return "text-cyan/80";
  if (line.includes("[System]") || line.includes("[OWNER]")) return "text-[rgba(237,237,237,0.75)]";
  if (line.startsWith(">")) return "text-[rgba(237,237,237,0.95)]";
  return "text-[rgba(237,237,237,0.52)]";
}

function linePrefix(line: string): string {
  if (line.includes("[FAIL]") || line.includes("Error:") || line.includes("REJECTED")) return "✗ ";
  if (line.includes("[PASS]") || line.startsWith("[System]")) return "";
  if (line.includes("ENFORCEMENT ACTIVE")) return "⚡ ";
  return "";
}

export function TerminalLog({ logs, mode }: Props) {
  const reduced = useReducedMotionSafe();
  const containerRef = useRef<HTMLDivElement>(null);
  const isCompromised = mode === "compromised";

  // Scroll the overflow container to bottom — do NOT use scrollIntoView,
  // which propagates up to window and pulls the page away from the hero.
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden",
        isCompromised ? "border-crimson/20" : "border-[rgba(255,255,255,0.07)]"
      )}
    >
      {/* Terminal chrome */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 border-b",
          isCompromised
            ? "bg-[rgba(225,29,72,0.06)] border-crimson/12"
            : "bg-[#0d0d0d] border-[rgba(255,255,255,0.05)]"
        )}
      >
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[rgba(225,29,72,0.5)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[rgba(245,158,11,0.5)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[rgba(16,185,129,0.5)]" />
        </div>
        <span className="text-[10px] font-mono text-[rgba(237,237,237,0.28)] ml-1">
          {isCompromised ? "agent@attacker:~$" : "agent@vajra:~$"}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <motion.div
            className={cn("w-1.5 h-1.5 rounded-full", isCompromised ? "bg-crimson" : "bg-emerald")}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          <span className="text-[9px] font-mono text-[rgba(237,237,237,0.25)] uppercase tracking-wider">
            {isCompromised ? "attack-sim" : "live"}
          </span>
        </div>
      </div>

      {/* Log lines — overflow-y-auto container; scroll happens here, not window */}
      <div
        ref={containerRef}
        className="bg-[#070707] p-4 font-mono text-[11px] leading-5 overflow-y-auto max-h-56"
      >
        <AnimatePresence initial={false}>
          {logs.map((line, i) => (
            <motion.div
              key={`${i}-${line.slice(0, 20)}`}
              initial={reduced ? { opacity: 1 } : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, delay: reduced ? 0 : Math.min(i * 0.04, 0.25) }}
              className={cn("flex gap-2.5 py-[1px]", lineColor(line))}
            >
              {/* Line number / timestamp */}
              <span className="text-[rgba(237,237,237,0.18)] shrink-0 select-none w-5 text-right">
                {(i + 1).toString()}
              </span>
              {/* Content */}
              <span className="break-all whitespace-pre-wrap">
                {linePrefix(line)}{line || " "}
              </span>
              {/* Blinking cursor on last line */}
              {i === logs.length - 1 && !reduced && (
                <motion.span
                  className="inline-block w-[6px] h-[13px] bg-current ml-0.5 shrink-0 self-center"
                  animate={{ opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
