import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface Node {
  label: string;
  sub?: string;
  accent?: "cyan" | "crimson" | "default" | "emerald";
}

const nodes: Node[] = [
  { label: "Owner Wallet", sub: "createPolicy / fundVault", accent: "default" },
  { label: "PolicyPDA", sub: "Budget · Cap · Expiry · Agent", accent: "cyan" },
  { label: "SPL Vault ATA", sub: "authority = PolicyPDA", accent: "cyan" },
  { label: "Agent Key", sub: "executeGuardedTransfer", accent: "default" },
  { label: "12 Guard Checks", sub: "Program enforcement boundary", accent: "emerald" },
  { label: "Destination ATA", sub: "Allowlisted recipients only", accent: "default" },
];

const accentColor = {
  cyan: "border-cyan/25 bg-cyan/5 text-cyan",
  crimson: "border-crimson/25 bg-crimson/5 text-crimson",
  emerald: "border-emerald/25 bg-emerald/5 text-emerald",
  default: "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-[#EDEDED]",
};

export function ArchitectureDiagram() {
  return (
    <div className="flex flex-col gap-3 items-center w-full max-w-sm mx-auto">
      {nodes.map((node, i) => (
        <motion.div
          key={node.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.3 }}
          className="w-full flex flex-col items-center gap-1"
        >
          <div
            className={cn(
              "w-full rounded-xl border px-4 py-3 flex flex-col gap-0.5",
              accentColor[node.accent ?? "default"]
            )}
          >
            <span className="text-sm font-semibold">{node.label}</span>
            {node.sub && (
              <span className="text-xs opacity-60 font-mono">{node.sub}</span>
            )}
          </div>
          {i < nodes.length - 1 && (
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-px h-4 bg-gradient-to-b from-[rgba(255,255,255,0.15)] to-[rgba(255,255,255,0.04)]" />
              <svg width="12" height="6" viewBox="0 0 12 6" fill="none">
                <path d="M6 6L0 0H12L6 6Z" fill="rgba(255,255,255,0.2)" />
              </svg>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
