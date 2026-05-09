/**
 * GlitchText — text with periodic glitch distortion.
 * Used for CompromisedAgent and dramatic headers.
 * Respects prefers-reduced-motion.
 */
import { useEffect, useRef } from "react";
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";

interface Props {
  children: string;
  className?: string;
  active?: boolean; // glitch only when true
  intensity?: "low" | "medium" | "high";
}

export function GlitchText({ children, className = "", active = true, intensity = "medium" }: Props) {
  const reduced = useReducedMotionSafe();
  const spanRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reduced || !active) return;
    const span = spanRef.current;
    if (!span) return;

    const chars = "▓▒░█▀▄╬╠╣╦╩═║│┤├┼┬┴╔╗╚╝abcdefXYZ01";
    const originalText = children;
    function doGlitch() {
      if (!span) return;
      let iterations = 0;
      const interval = setInterval(() => {
        span.textContent = originalText
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < iterations) return originalText[i];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");

        iterations += 0.7;
        if (iterations >= originalText.length) {
          clearInterval(interval);
          span.textContent = originalText;
        }
      }, 30);

      timerRef.current = setTimeout(() => {
        clearInterval(interval);
        if (span) span.textContent = originalText;
      }, 500);
    }

    // Random intervals
    function scheduleGlitch() {
      const delay = 2000 + Math.random() * 4000;
      timerRef.current = setTimeout(() => {
        doGlitch();
        scheduleGlitch();
      }, delay);
    }

    scheduleGlitch();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (span) span.textContent = originalText;
    };
  }, [active, children, intensity, reduced]);

  return (
    <span ref={spanRef} className={className}>
      {children}
    </span>
  );
}
