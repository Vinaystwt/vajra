import { cn } from "../../lib/utils";
import type { PolicyTemplate } from "../../lib/types";
import { lamportsToUi } from "../../lib/constants";

interface Props {
  template: PolicyTemplate;
  selected?: boolean;
  onSelect?: () => void;
}

export function TemplateCard({ template, selected, onSelect }: Props) {
  const budget = template.totalBudget != null ? lamportsToUi(Number(template.totalBudget)) : null;
  const cap = template.perTxCap != null ? lamportsToUi(Number(template.perTxCap)) : null;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "panel p-4 flex flex-col gap-3 text-left cursor-pointer transition-all duration-200 w-full",
        selected
          ? "border-cyan/25 bg-cyan/4"
          : "hover:border-[rgba(255,255,255,0.15)]"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[rgba(237,237,237,0.9)]">{template.name}</span>
        {selected && (
          <span className="text-[9px] font-mono uppercase tracking-wider text-cyan">Selected</span>
        )}
      </div>
      {template.description && (
        <span className="text-xs text-[rgba(237,237,237,0.5)]">{template.description}</span>
      )}
      {(budget || cap) && (
        <div className="flex gap-4 pt-1 border-t border-[rgba(255,255,255,0.05)]">
          {budget && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-mono text-[rgba(237,237,237,0.3)]">Budget</span>
              <span className="text-xs font-mono text-[rgba(237,237,237,0.6)]">
                {budget.toLocaleString()} DemoUSD
              </span>
            </div>
          )}
          {cap && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-mono text-[rgba(237,237,237,0.3)]">Per-tx cap</span>
              <span className="text-xs font-mono text-[rgba(237,237,237,0.6)]">
                {cap.toLocaleString()} DemoUSD
              </span>
            </div>
          )}
        </div>
      )}
    </button>
  );
}
