import { createHash } from "node:crypto";
import type {
  ReceiptNetwork,
  VajraReceipt,
  VajraReceiptInput,
} from "./types.js";

const EMPTY = "";

function normalizeNetwork(network: ReceiptNetwork): ReceiptNetwork {
  return network;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, inner]) => [key, stableValue(inner)]),
    );
  }
  return value;
}

export function stableJson(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

export function receiptHash(
  receipt: Omit<VajraReceipt, "receipt_hash">,
): string {
  return createHash("sha256").update(stableJson(receipt)).digest("hex");
}

export function createReceipt(input: VajraReceiptInput): VajraReceipt {
  const createdAt = input.created_at ?? new Date().toISOString();
  const base: Omit<VajraReceipt, "receipt_hash"> = {
    receipt_version: "1.0",
    receipt_id: input.receipt_id ?? `${input.network}:${input.signature}`,
    created_at: createdAt,
    network: normalizeNetwork(input.network),
    program_id: input.program_id,
    signature: input.signature,
    explorer_url:
      input.explorer_url ?? explorerUrl(input.signature, input.network),
    policy: input.policy ?? EMPTY,
    policy_id: input.policy_id ?? EMPTY,
    agent: input.agent ?? EMPTY,
    owner: input.owner ?? EMPTY,
    vault: input.vault ?? EMPTY,
    mint: input.mint ?? EMPTY,
    source: input.source ?? EMPTY,
    destination: input.destination ?? EMPTY,
    destination_label: input.destination_label ?? EMPTY,
    attempt_type: input.attempt_type,
    status: input.status,
    requested_amount: input.requested_amount,
    actual_inner_transfer_amount: input.actual_inner_transfer_amount ?? "0",
    vault_balance_before: input.vault_balance_before ?? "unknown",
    vault_balance_after: input.vault_balance_after ?? "unknown",
    vault_delta: input.vault_delta ?? "unknown",
    inner_token_transfers: input.inner_token_transfers ?? 0,
    rule_triggered: input.rule_triggered ?? "unknown",
    guard_error: input.guard_error ?? EMPTY,
    logs: input.logs ?? [],
    raw_transaction_summary: input.raw_transaction_summary ?? {},
    verifier: input.verifier ?? {
      verified: false,
      method: "unverified_receipt",
      checked_at: createdAt,
    },
  };

  return { ...base, receipt_hash: receiptHash(base) };
}

export function verifyReceiptHash(receipt: VajraReceipt): boolean {
  const { receipt_hash: _hash, ...base } = receipt;
  return receipt.receipt_hash === receiptHash(base);
}

export function receiptToMarkdown(receipt: VajraReceipt): string {
  return `# Vajra Execution Receipt

- Receipt: ${receipt.receipt_id}
- Network: ${receipt.network}
- Signature: ${receipt.signature}
- Status: ${receipt.status}
- Attempt: ${receipt.attempt_type}
- Rule: ${receipt.rule_triggered}
- Requested amount: ${receipt.requested_amount}
- Actual inner transfer amount: ${receipt.actual_inner_transfer_amount}
- Inner token transfers: ${receipt.inner_token_transfers}
- Vault before: ${receipt.vault_balance_before}
- Vault after: ${receipt.vault_balance_after}
- Vault delta: ${receipt.vault_delta}
- Policy: ${receipt.policy}
- Vault: ${receipt.vault}
- Destination: ${receipt.destination}
- Explorer: ${receipt.explorer_url}
- Receipt hash: ${receipt.receipt_hash}

## Verification

Verified: ${receipt.verifier.verified ? "yes" : "no"}

Method: ${receipt.verifier.method}

Checked at: ${receipt.verifier.checked_at}

## Logs

${receipt.logs.length ? receipt.logs.map((log) => `- ${log}`).join("\n") : "- No logs available."}
`;
}

export function receiptToCsvRow(receipt: VajraReceipt): string {
  const header = receiptCsvHeader();
  return header
    .map((key) => JSON.stringify(String((receipt as any)[key] ?? "")))
    .join(",");
}

export function receiptCsvHeader(): string[] {
  return [
    "receipt_id",
    "created_at",
    "network",
    "signature",
    "status",
    "attempt_type",
    "rule_triggered",
    "policy",
    "vault",
    "mint",
    "destination",
    "destination_label",
    "requested_amount",
    "actual_inner_transfer_amount",
    "vault_balance_before",
    "vault_balance_after",
    "vault_delta",
    "inner_token_transfers",
    "guard_error",
    "receipt_hash",
  ];
}

export function receiptsToCsv(receipts: VajraReceipt[]): string {
  const header = receiptCsvHeader();
  return (
    [
      header.join(","),
      ...receipts.map((receipt) => receiptToCsvRow(receipt)),
    ].join("\n") + "\n"
  );
}

export function explorerUrl(
  signature: string,
  network: ReceiptNetwork,
): string {
  if (network === "fixture") return `fixture://${signature}`;
  const clusterParam = network === "mainnet-beta" ? "" : `?cluster=${network}`;
  return `https://explorer.solana.com/tx/${signature}${clusterParam}`;
}
