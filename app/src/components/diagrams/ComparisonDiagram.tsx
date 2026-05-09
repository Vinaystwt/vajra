import { motion } from "framer-motion";
import { X, CheckCircle2, Minus } from "lucide-react";
import { cn } from "../../lib/utils";

interface CompRow {
  category: string;
  description: string;
  vajra: "yes" | "no" | "partial";
  note?: string;
}

const rows: CompRow[] = [
  {
    category: "Raw wallet",
    description: "One leaked key drains everything.",
    vajra: "no",
  },
  {
    category: "Backend allowlist",
    description: "Useful before signing, but the backend is not the fund authority.",
    vajra: "partial",
  },
  {
    category: "Session keys",
    description: "Scope signing permissions. Vajra removes treasury authority from the agent entirely.",
    vajra: "yes",
    note: "Complementary",
  },
  {
    category: "Multisigs",
    description: "Strong for human approval. Too slow for autonomous execution.",
    vajra: "partial",
    note: "Different use case",
  },
  {
    category: "Audit logs",
    description: "Explain the loss after it happened.",
    vajra: "no",
  },
  {
    category: "Vajra",
    description: "Program-owned vaults. The agent cannot bypass policy because it is not the vault authority.",
    vajra: "yes",
    note: "This is Vajra",
  },
];

function Icon({ val }: { val: "yes" | "no" | "partial" }) {
  if (val === "yes") return <CheckCircle2 size={15} className="text-emerald" />;
  if (val === "no") return <X size={15} className="text-crimson" />;
  return <Minus size={15} className="text-amber" />;
}

export function ComparisonDiagram() {
  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
      <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-2.5 bg-[#0d0d0d] border-b border-[rgba(255,255,255,0.06)]">
        <span className="text-[9px] font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
          Approach
        </span>
        <span className="text-[9px] font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
          Fund authority is program?
        </span>
      </div>
      <div className="divide-y divide-[rgba(255,255,255,0.04)]">
        {rows.map((row, i) => (
          <motion.div
            key={row.category}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "grid grid-cols-[1fr_auto] gap-4 px-4 py-3.5 items-center",
              row.category === "Vajra" && "bg-cyan/3 border-l-2 border-l-cyan/30"
            )}
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    row.category === "Vajra" ? "text-cyan" : "text-[rgba(237,237,237,0.85)]"
                  )}
                >
                  {row.category}
                </span>
                {row.note && (
                  <span className="text-[9px] font-mono text-[rgba(237,237,237,0.3)] border border-[rgba(255,255,255,0.08)] px-1.5 py-0.5 rounded">
                    {row.note}
                  </span>
                )}
              </div>
              <p className="text-xs text-[rgba(237,237,237,0.45)] leading-relaxed max-w-md">
                {row.description}
              </p>
            </div>
            <div className="flex items-center justify-center w-8">
              <Icon val={row.vajra} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
