import { ExternalLink, ShieldCheck, ShieldOff } from "lucide-react";
import type { MerchantVerification } from "../../lib/types";
import { shortSig, classificationLabel } from "../../lib/proofUtils";
import { cn } from "../../lib/utils";

interface Props {
  data: MerchantVerification | null;
}

interface VerificationRow {
  label: string;
  classification: string;
  verified: boolean;
  explorerHref?: string;
  signature?: string;
  receiptHash?: string;
  destinationCheck?: string;
  note?: string;
}

export function MerchantVerifierPanel({ data }: Props) {
  const vajraRow: VerificationRow | null = data
    ? {
        label: "Vajra Allowance Vault Payment",
        classification: data.receipt?.status ?? "vajra_allowed",
        verified: data.verified,
        explorerHref:
          data.receipt?.explorer_url ??
          (data.receipt?.signature
            ? `https://explorer.solana.com/tx/${data.receipt.signature}?cluster=devnet`
            : undefined),
        signature: data.receipt?.signature,
        receiptHash: data.receipt?.receipt_hash,
        destinationCheck: data.expected_destination_check,
      }
    : null;

  const rawRow: VerificationRow = {
    label: "Raw Wallet Transfer",
    classification: "not_vajra",
    verified: false,
    destinationCheck: "irrelevant — no policy",
    note: "No policy governs this transfer.",
  };

  const rows: VerificationRow[] = [
    ...(vajraRow ? [vajraRow] : []),
    rawRow,
  ];

  return (
    <div className="panel p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-semibold text-[rgba(237,237,237,0.9)]">
          Merchant Verification
        </h3>
        <p className="text-sm text-muted leading-relaxed max-w-prose">
          A merchant or API can verify payment came through a Vajra-governed allowance vault.
        </p>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const isVerified = row.verified;
          const classLabel = classificationLabel(row.classification);

          return (
            <div
              key={row.label}
              className={cn(
                "rounded-xl p-4 border flex flex-col gap-3",
                isVerified
                  ? "bg-emerald/5 border-emerald/20"
                  : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)]"
              )}
            >
              {/* Row header */}
              <div className="flex items-center gap-3">
                {isVerified ? (
                  <ShieldCheck size={16} className="text-emerald shrink-0" />
                ) : (
                  <ShieldOff size={16} className="text-muted shrink-0" />
                )}
                <span className="text-sm font-medium text-[rgba(237,237,237,0.85)]">
                  {row.label}
                </span>
                <span
                  className={cn(
                    "ml-auto text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border",
                    isVerified
                      ? "bg-emerald/10 text-emerald border-emerald/20"
                      : "bg-[rgba(255,255,255,0.03)] text-muted border-[rgba(255,255,255,0.08)]"
                  )}
                >
                  {isVerified ? "Verified" : "Not Verified"}
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 gap-y-1.5 text-xs font-mono pl-7">
                <div className="flex gap-2">
                  <span className="text-muted min-w-[160px]">Classification</span>
                  <span className="text-[rgba(237,237,237,0.7)]">{classLabel}</span>
                </div>
                {row.destinationCheck && (
                  <div className="flex gap-2">
                    <span className="text-muted min-w-[160px]">Destination Check</span>
                    <span className="text-[rgba(237,237,237,0.7)]">{row.destinationCheck}</span>
                  </div>
                )}
                {row.signature && (
                  <div className="flex gap-2">
                    <span className="text-muted min-w-[160px]">Signature</span>
                    <span className="text-[rgba(237,237,237,0.5)]">{shortSig(row.signature)}</span>
                  </div>
                )}
                {row.receiptHash && (
                  <div className="flex gap-2">
                    <span className="text-muted min-w-[160px]">Receipt Hash</span>
                    <span className="text-[rgba(237,237,237,0.5)]">{shortSig(row.receiptHash, 6)}</span>
                  </div>
                )}
                {row.note && (
                  <div className="flex gap-2">
                    <span className="text-muted min-w-[160px]">Note</span>
                    <span className="text-muted italic">{row.note}</span>
                  </div>
                )}
              </div>

              {/* Explorer link */}
              {row.explorerHref && (
                <div className="pl-7">
                  <a
                    href={row.explorerHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-mono text-cyan/70 hover:text-cyan transition-colors w-fit"
                  >
                    View on Solana Explorer
                    <ExternalLink size={11} />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Note */}
      <p className="text-[10px] font-mono text-muted leading-relaxed">
        Verifier compares against devnet proof artifacts. CLI verifier available in the SDK.
      </p>
    </div>
  );
}
