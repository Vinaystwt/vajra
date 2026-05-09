import { cn } from "../../lib/utils";
import type { AttemptStatus } from "../../lib/types";

interface Props {
  status: AttemptStatus;
  small?: boolean;
}

const config = {
  allowed: {
    dot: "bg-emerald",
    text: "text-emerald",
    bg: "bg-emerald/10",
    border: "border-emerald/20",
    label: "Allowed",
  },
  blocked: {
    dot: "bg-crimson",
    text: "text-crimson",
    bg: "bg-crimson/10",
    border: "border-crimson/20",
    label: "Blocked",
  },
  failed: {
    dot: "bg-amber",
    text: "text-amber",
    bg: "bg-amber/10",
    border: "border-amber/20",
    label: "Failed",
  },
};

export function StatusBadge({ status, small }: Props) {
  const c = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border rounded-full font-mono font-medium uppercase tracking-wider",
        c.bg,
        c.border,
        c.text,
        small ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}
