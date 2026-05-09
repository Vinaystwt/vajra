import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { CopyButton } from "../ui/CopyButton";
import type { Receipt } from "../../lib/types";
import { shortSig } from "../../lib/proofUtils";

interface Props {
  receipt: Receipt | null;
  onClose: () => void;
}

type FieldRow = [string, string | number | boolean | undefined | null];

function buildRows(r: Receipt): FieldRow[] {
  return [
    ["receipt_id", r.receipt_id],
    ["created_at", r.created_at],
    ["network", r.network],
    ["program_id", r.program_id],
    ["attempt_type", r.attempt_type],
    ["status", r.status],
    ["rule_triggered", r.rule_triggered],
    ["guard_error", r.guard_error],
    ["policy", r.policy ?? r.policy_id],
    ["agent", r.agent],
    ["owner", r.owner],
    ["vault", r.vault],
    ["mint", r.mint],
    ["source", r.source],
    ["destination", r.destination],
    ["destination_label", r.destination_label],
    ["requested_amount", r.requested_amount],
    ["actual_inner_transfer_amount", r.actual_inner_transfer_amount],
    ["vault_balance_before", r.vault_balance_before],
    ["vault_balance_after", r.vault_balance_after],
    ["vault_delta", r.vault_delta],
    ["inner_token_transfers", r.inner_token_transfers],
    ["verifier.verified", r.verifier?.verified],
    ["verifier.method", r.verifier?.method],
    ["verifier.checked_at", r.verifier?.checked_at],
    ["receipt_hash", r.receipt_hash],
  ].filter(([, v]) => v !== undefined && v !== null && v !== "") as FieldRow[];
}

export function ReceiptDrawer({ receipt, onClose }: Props) {
  const explorerHref = receipt
    ? receipt.explorer_url ?? `https://explorer.solana.com/tx/${receipt.signature}?cluster=devnet`
    : "#";

  return (
    <AnimatePresence>
      {receipt && (
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
            className="fixed top-0 right-0 bottom-0 w-full max-w-lg z-50 bg-[#111111] border-l border-[rgba(255,255,255,0.08)] overflow-y-auto flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.08)] sticky top-0 bg-[#111111] z-10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono uppercase tracking-widest text-muted">Receipt</span>
                <span className="text-sm font-medium text-[rgba(237,237,237,0.8)]">
                  {receipt.attempt_type}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-[rgba(237,237,237,0.5)] hover:text-[rgba(237,237,237,0.9)] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-5 p-5">
              {/* Status badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
                  Status
                </span>
                <span className="ml-auto text-[10px] font-mono text-[rgba(237,237,237,0.7)]">
                  {receipt.status}
                </span>
              </div>

              {/* Fields table */}
              <div className="flex flex-col gap-0 border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
                {buildRows(receipt).map(([key, val], i) => (
                  <div
                    key={key}
                    className={`flex gap-3 px-3 py-2 ${i % 2 === 0 ? "bg-[rgba(255,255,255,0.015)]" : ""}`}
                  >
                    <span className="text-[10px] font-mono text-muted min-w-[140px] shrink-0 mt-0.5">
                      {key}
                    </span>
                    <span className="text-[11px] font-mono text-[rgba(237,237,237,0.7)] break-all">
                      {String(val)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Signature */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-muted">
                  Signature
                </span>
                <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-[rgba(255,255,255,0.07)] rounded-lg">
                  <span className="text-[11px] font-mono text-[rgba(237,237,237,0.5)] truncate flex-1">
                    {receipt.signature}
                  </span>
                  <CopyButton text={receipt.signature} />
                </div>
                <a
                  href={explorerHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-mono text-cyan/70 hover:text-cyan transition-colors w-fit"
                >
                  View on Solana Explorer
                  <ExternalLink size={11} />
                </a>
              </div>

              {/* Receipt hash */}
              {receipt.receipt_hash && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-muted">
                    Receipt Hash
                  </span>
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-[rgba(255,255,255,0.07)] rounded-lg">
                    <span className="text-[11px] font-mono text-[rgba(237,237,237,0.5)] truncate flex-1">
                      {shortSig(receipt.receipt_hash, 10)}
                    </span>
                    <CopyButton text={receipt.receipt_hash} />
                  </div>
                </div>
              )}

              {/* Logs */}
              {receipt.logs && receipt.logs.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-muted">
                    Program Logs
                  </span>
                  <div className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.07)] rounded-lg p-3 overflow-x-auto">
                    {receipt.logs.map((line, i) => (
                      <div key={i} className="text-[11px] font-mono text-[rgba(237,237,237,0.5)] leading-relaxed whitespace-pre">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* JSON block */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-muted">
                  Full Receipt JSON
                </span>
                <div className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.07)] rounded-lg p-3 overflow-x-auto">
                  <pre className="text-[10px] font-mono text-[rgba(237,237,237,0.45)] whitespace-pre-wrap break-all">
                    {JSON.stringify(receipt, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
