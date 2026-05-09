import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "../ui/StatusBadge";
import { GuardReasonBadge } from "../ui/GuardReasonBadge";
import { ExplorerLink } from "./ExplorerLink";
import type { DevnetProofRecord } from "../../lib/types";
import { formatTimestamp } from "../../lib/utils";
import { shortKey } from "../../lib/constants";

interface Props {
  records: DevnetProofRecord[];
  onSelect: (r: DevnetProofRecord) => void;
}

export function ProofExplorerTable({ records, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-[rgba(237,237,237,0.3)] font-mono border border-[rgba(255,255,255,0.06)] rounded-xl">
        No proof records loaded.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_1.5fr_100px_90px_80px_80px_100px_auto] gap-3 px-4 py-2.5 bg-[#0d0d0d] border-b border-[rgba(255,255,255,0.06)] text-[9px] font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
        <span>Time</span>
        <span>Attempt</span>
        <span>Status</span>
        <span>Rule</span>
        <span>Vault Δ</span>
        <span>Transfers</span>
        <span>Explorer</span>
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-[rgba(255,255,255,0.04)]">
        {records.map((r, i) => (
          <motion.div
            key={r.id ?? r.signature}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            onMouseEnter={() => setHovered(r.id ?? r.signature)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect(r)}
            className="grid grid-cols-[1fr_1.5fr_100px_90px_80px_80px_100px_auto] gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/2"
            style={{
              background:
                hovered === (r.id ?? r.signature)
                  ? r.status === "blocked"
                    ? "rgba(225,29,72,0.04)"
                    : "rgba(255,255,255,0.02)"
                  : "transparent",
            }}
          >
            <span className="text-xs font-mono text-[rgba(237,237,237,0.38)] truncate">
              {formatTimestamp(r.timestamp).split(", ")[1] ?? "—"}
            </span>
            <span className="text-xs text-[rgba(237,237,237,0.75)] font-medium truncate">
              {r.action}
            </span>
            <div>
              <StatusBadge status={r.status} small />
            </div>
            <div>
              <GuardReasonBadge rule={r.ruleTriggered} />
            </div>
            <span
              className={
                r.status === "blocked"
                  ? "text-xs font-mono text-crimson font-semibold"
                  : "text-xs font-mono text-[rgba(237,237,237,0.5)]"
              }
            >
              {r.status === "blocked" ? "0.00" : r.vaultBalanceDelta.toFixed(2)}
            </span>
            <span
              className={
                r.status === "blocked"
                  ? "text-xs font-mono text-crimson font-semibold"
                  : "text-xs font-mono text-[rgba(237,237,237,0.5)]"
              }
            >
              {r.innerTransfers}
            </span>
            <div>
              {r.explorerUrl ? (
                <ExplorerLink href={r.explorerUrl} label={shortKey(r.signature, 4, 4)} />
              ) : (
                <span className="text-xs font-mono text-[rgba(237,237,237,0.2)]">—</span>
              )}
            </div>
            <ChevronRight size={14} className="text-[rgba(237,237,237,0.2)] self-center" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
