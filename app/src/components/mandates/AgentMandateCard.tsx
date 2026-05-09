import type { AgentMandate } from "../../lib/types";
import { cn } from "../../lib/utils";

interface Props {
  mandate: AgentMandate;
  featured?: boolean;
}

interface StatItem {
  label: string;
  value: string;
}

function buildStats(mandate: AgentMandate): StatItem[] {
  const stats: StatItem[] = [];

  if (mandate.recommended_total_budget ?? mandate.policy_config?.totalBudget) {
    stats.push({
      label: "Total Budget",
      value: mandate.recommended_total_budget ?? mandate.policy_config?.totalBudget ?? "—",
    });
  }
  if (mandate.recommended_per_tx_cap ?? mandate.policy_config?.perTxCap) {
    stats.push({
      label: "Per-Tx Cap",
      value: mandate.recommended_per_tx_cap ?? mandate.policy_config?.perTxCap ?? "—",
    });
  }
  if (mandate.recommended_period_budget ?? mandate.policy_config?.periodBudget) {
    stats.push({
      label: "Period Budget",
      value: mandate.recommended_period_budget ?? mandate.policy_config?.periodBudget ?? "—",
    });
  }
  if (mandate.recommended_velocity_limit) {
    stats.push({ label: "Velocity", value: mandate.recommended_velocity_limit });
  }
  if (mandate.recommended_expiry) {
    stats.push({ label: "Expiry", value: mandate.recommended_expiry });
  }
  if (mandate.allowed_destination_model) {
    stats.push({ label: "Destinations", value: mandate.allowed_destination_model });
  }

  return stats;
}

export function AgentMandateCard({ mandate, featured = false }: Props) {
  const stats = buildStats(mandate);

  return (
    <div
      className={cn(
        "panel p-5 flex flex-col gap-4 transition-all duration-200",
        featured
          ? "border-cyan/30 glow-cyan ring-1 ring-cyan/20"
          : "hover:border-cyan/20",
        "hover:shadow-[0_0_24px_rgba(0,229,255,0.06)]"
      )}
    >
      {/* Top section */}
      <div className="flex flex-col gap-0.5">
        {featured && (
          <span className="text-[9px] font-mono uppercase tracking-widest text-cyan mb-1">
            Featured
          </span>
        )}
        <h3
          className={cn(
            "font-semibold leading-tight",
            featured ? "text-lg text-[rgba(237,237,237,0.95)]" : "text-base text-[rgba(237,237,237,0.9)]"
          )}
        >
          {mandate.name}
        </h3>
        <p className="text-xs text-muted font-mono">{mandate.target_user}</p>
      </div>

      {/* Stats grid */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted">
                {s.label}
              </span>
              <span className="text-sm font-mono text-[rgba(237,237,237,0.8)] truncate">
                {s.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-[rgba(255,255,255,0.05)]" />

      {/* Use case */}
      <p className="text-sm text-secondary leading-relaxed line-clamp-3">
        {mandate.use_case}
      </p>

      {/* Revoke behavior */}
      {mandate.revoke_behavior && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted mt-0.5 shrink-0">
            Revoke
          </span>
          <span className="text-[11px] font-mono text-[rgba(237,237,237,0.55)] leading-relaxed">
            {mandate.revoke_behavior}
          </span>
        </div>
      )}
    </div>
  );
}
