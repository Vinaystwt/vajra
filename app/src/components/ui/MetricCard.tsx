import { cn } from "../../lib/utils";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: string | number | ReactNode;
  sub?: string;
  accent?: "cyan" | "crimson" | "emerald" | "amber" | "default";
  icon?: ReactNode;
  className?: string;
}

const accentColor = {
  cyan: "text-cyan",
  crimson: "text-crimson",
  emerald: "text-emerald",
  amber: "text-amber",
  default: "text-[#EDEDED]",
};

export function MetricCard({ label, value, sub, accent = "default", icon, className }: Props) {
  return (
    <div
      className={cn(
        "panel p-5 flex flex-col gap-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-[rgba(237,237,237,0.42)]">
          {label}
        </span>
        {icon && <span className="text-[rgba(237,237,237,0.3)]">{icon}</span>}
      </div>
      <span className={cn("font-mono text-2xl font-semibold", accentColor[accent])}>
        {value}
      </span>
      {sub && <span className="text-xs text-[rgba(237,237,237,0.42)]">{sub}</span>}
    </div>
  );
}
