import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { StatusBadge } from "../ui/StatusBadge";
import { GuardReasonBadge } from "../ui/GuardReasonBadge";
import { RawLogViewer } from "./RawLogViewer";
import { JsonPreview } from "./JsonPreview";
import { CopyButton } from "../ui/CopyButton";
import type { DevnetProofRecord } from "../../lib/types";
import { formatTimestamp } from "../../lib/utils";

interface Props {
  record: DevnetProofRecord | null;
  onClose: () => void;
}

export function ProofDetailDrawer({ record, onClose }: Props) {
  return (
    <AnimatePresence>
      {record && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md z-50 bg-[#111111] border-l border-[rgba(255,255,255,0.08)] overflow-y-auto flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.08)] sticky top-0 bg-[#111111] z-10">
              <div className="flex items-center gap-3">
                <StatusBadge status={record.status} />
                <span className="text-sm font-medium text-[rgba(237,237,237,0.8)]">
                  {record.action}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-[rgba(237,237,237,0.5)] hover:text-[rgba(237,237,237,0.9)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-5 p-5">
              {/* Cached badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
                  Cached Devnet Proof
                </span>
                <span className="ml-auto text-[10px] font-mono text-[rgba(237,237,237,0.25)]">
                  {formatTimestamp(record.timestamp)}
                </span>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Vault Delta",
                    value: record.status === "blocked" ? "0.00 DemoUSD" : `${record.vaultBalanceDelta.toFixed(2)} DemoUSD`,
                    highlight: record.status === "blocked",
                  },
                  {
                    label: "Inner Transfers",
                    value: String(record.innerTransfers),
                    highlight: record.status === "blocked" && record.innerTransfers === 0,
                  },
                  {
                    label: "Amount",
                    value: record.amount != null ? `${Number(record.amount).toFixed(2)} DemoUSD` : "—",
                  },
                  {
                    label: "Rule Triggered",
                    value: null,
                    badge: <GuardReasonBadge rule={record.ruleTriggered} />,
                  },
                ].map((m) => (
                  <div key={m.label} className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
                      {m.label}
                    </span>
                    {m.badge ?? (
                      <span
                        className={
                          m.highlight
                            ? "text-sm font-mono text-crimson font-semibold"
                            : "text-sm font-mono text-[rgba(237,237,237,0.75)]"
                        }
                      >
                        {m.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Vault before/after */}
              <div className="panel p-4 flex flex-col gap-3">
                <span className="text-xs font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
                  Vault Balance
                </span>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Before", value: record.vaultBalanceBefore },
                    { label: "After", value: record.vaultBalanceAfter },
                  ].map((v) => (
                    <div key={v.label} className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-[rgba(237,237,237,0.35)]">{v.label}</span>
                      <span className="font-mono text-lg text-[rgba(237,237,237,0.85)]">
                        {v.value != null ? Number(v.value).toFixed(2) : "—"}
                      </span>
                      <span className="text-[9px] text-[rgba(237,237,237,0.3)]">DemoUSD</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
                  Transaction Signature
                </span>
                <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-[rgba(255,255,255,0.07)] rounded-lg">
                  <span className="text-[11px] font-mono text-[rgba(237,237,237,0.5)] truncate flex-1">
                    {record.signature}
                  </span>
                  <CopyButton text={record.signature} />
                </div>
                {record.explorerUrl && (
                  <a
                    href={record.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-mono text-cyan/70 hover:text-cyan transition-colors w-fit"
                  >
                    View on Solana Explorer
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>

              {/* Raw logs */}
              {record.rawLogs && record.rawLogs.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
                    Program Logs
                  </span>
                  <RawLogViewer logs={record.rawLogs} />
                </div>
              )}

              {/* JSON preview */}
              <JsonPreview data={record} label="Full proof record" />

              {/* Enforcement statement for blocked */}
              {record.status === "blocked" && (
                <div className="px-4 py-3 bg-crimson/5 border border-crimson/15 rounded-xl">
                  <p className="text-xs text-[rgba(237,237,237,0.6)] leading-relaxed">
                    Vajra program rejected the transfer before funds moved. Vault delta is 0.00 DemoUSD. Inner token transfers: 0.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
