import { cn } from "../../lib/utils";
import { GUARD_LABELS } from "../../lib/constants";

interface Props {
  rule?: string | null;
}

const colorMap: Record<string, string> = {
  all_clear: "text-emerald bg-emerald/10 border-emerald/20",
  velocity: "text-crimson bg-crimson/10 border-crimson/20",
  perTxCap: "text-crimson bg-crimson/10 border-crimson/20",
  destination: "text-crimson bg-crimson/10 border-crimson/20",
  periodBudget: "text-amber bg-amber/10 border-amber/20",
  revoked: "text-crimson bg-crimson/10 border-crimson/20",
  vaultAuthority: "text-crimson bg-crimson/10 border-crimson/20",
  ownerRecovery: "text-cyan bg-cyan/10 border-cyan/20",
};

export function GuardReasonBadge({ rule }: Props) {
  if (!rule) return <span className="text-[rgba(237,237,237,0.42)] text-xs">—</span>;
  const label = GUARD_LABELS[rule] ?? rule;
  const cls = colorMap[rule] ?? "text-[rgba(237,237,237,0.68)] bg-white/5 border-white/10";
  return (
    <span
      className={cn(
        "inline-flex items-center border rounded font-mono text-[10px] px-2 py-0.5 tracking-wide",
        cls
      )}
    >
      {label}
    </span>
  );
}
