import { ExternalLink } from "lucide-react";
import type { Receipt } from "../../lib/types";
import { shortSig, receiptStatusColor, classificationLabel } from "../../lib/proofUtils";
import { cn } from "../../lib/utils";

interface Props {
  receipt: Receipt;
  onOpen?: (r: Receipt) => void;
}

function StatusBadge({ status }: { status: string }) {
  const color = receiptStatusColor(status);
  const colorMap = {
    crimson: "bg-crimson/10 text-crimson border-crimson/20",
    emerald: "bg-emerald/10 text-emerald border-emerald/20",
    amber: "bg-amber/10 text-amber border-amber/20",
  };
  const label =
    status === "allowed"
      ? "Allowed"
      : status === "blocked"
      ? "Blocked"
      : status === "raw_wallet_drained"
      ? "Raw Wallet (Not Vajra)"
      : status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest border",
        colorMap[color]
      )}
    >
      {label}
    </span>
  );
}

function DescriptionLine({ status, ruleTriggered }: { status: string; ruleTriggered?: string }) {
  if (status === "allowed") return <span className="text-emerald">Allowed</span>;
  if (status === "blocked")
    return (
      <span className="text-crimson">
        Blocked by {ruleTriggered ?? "policy"}
      </span>
    );
  if (status === "raw_wallet_drained")
    return <span className="text-amber">Raw Wallet (Not Vajra)</span>;
  return <span className="text-muted">{classificationLabel(status)}</span>;
}

export function ReceiptCard({ receipt, onOpen }: Props) {
  const color = receiptStatusColor(receipt.status);
  const borderMap = {
    crimson: "hover:border-crimson/30",
    emerald: "hover:border-emerald/30",
    amber: "hover:border-amber/30",
  };

  const explorerHref = receipt.explorer_url ?? `https://explorer.solana.com/tx/${receipt.signature}?cluster=devnet`;

  return (
    <div
      className={cn(
        "panel p-4 flex flex-col gap-3 cursor-pointer transition-all duration-200",
        borderMap[color],
        onOpen ? "cursor-pointer" : ""
      )}
      onClick={() => onOpen?.(receipt)}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => {
        if (onOpen && (e.key === "Enter" || e.key === " ")) onOpen(receipt);
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={receipt.status} />
        <span className="text-[10px] font-mono text-muted uppercase tracking-widest ml-auto">
          {receipt.attempt_type}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm font-medium">
        <DescriptionLine status={receipt.status} ruleTriggered={receipt.rule_triggered} />
      </p>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono">
        {receipt.vault_delta !== undefined && (
          <>
            <span className="text-muted">Vault Delta</span>
            <span className={color === "crimson" ? "text-crimson" : "text-[rgba(237,237,237,0.75)]"}>
              {receipt.vault_delta} DemoUSD
            </span>
          </>
        )}
        {receipt.inner_token_transfers !== undefined && (
          <>
            <span className="text-muted">Inner Transfers</span>
            <span className="text-[rgba(237,237,237,0.75)]">{receipt.inner_token_transfers}</span>
          </>
        )}
      </div>

      {/* Signature row */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[rgba(255,255,255,0.05)]">
        <span className="text-[10px] font-mono text-muted truncate flex-1">
          {shortSig(receipt.signature)}
        </span>
        <a
          href={explorerHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-[10px] font-mono text-cyan/60 hover:text-cyan transition-colors shrink-0"
        >
          Explorer <ExternalLink size={10} />
        </a>
      </div>

      {/* Receipt hash if present */}
      {receipt.receipt_hash && (
        <div className="text-[10px] font-mono text-muted truncate">
          hash: {shortSig(receipt.receipt_hash, 6)}
        </div>
      )}
    </div>
  );
}
