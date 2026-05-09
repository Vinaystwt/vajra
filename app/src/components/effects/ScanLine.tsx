/** Subtle scan line that moves down the screen — adds cybernetic atmosphere. */
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";

interface Props {
  className?: string;
  color?: string;
  speed?: string;
}

export function ScanLine({ className = "", color = "rgba(0,229,255,0.04)", speed = "5s" }: Props) {
  const reduced = useReducedMotionSafe();
  if (reduced) return null;
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden
    >
      <div
        className="absolute left-0 right-0 h-[2px] animate-scan-line"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          animationDuration: speed,
        }}
      />
    </div>
  );
}
