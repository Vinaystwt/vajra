import type { Connection, PublicKey } from "@solana/web3.js";
import { createReceipt, explorerUrl } from "./receipt.js";
import type {
  ReceiptStatus,
  VajraPaymentClassification,
  VajraReceipt,
  VajraTransactionFixture,
  VerifyPaymentOptions,
  VerifyPaymentResult,
} from "./types.js";

const DEFAULT_VAJRA_PROGRAM_ID = "APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD";

function keyToString(value?: PublicKey | string): string | undefined {
  return typeof value === "string" ? value : value?.toBase58();
}

function amountToString(value?: string | number | bigint): string | undefined {
  return value === undefined ? undefined : value.toString();
}

function ruleFromLogs(logs: string[]): string {
  const joined = logs.join("\n");
  if (/VelocityLimitExceeded/i.test(joined)) return "velocity";
  if (/PeriodBudgetExceeded/i.test(joined)) return "periodBudget";
  if (/PerTxCapExceeded/i.test(joined)) return "perTxCap";
  if (/TotalBudgetExceeded/i.test(joined)) return "totalBudget";
  if (/DestinationNotAllowed/i.test(joined)) return "destination";
  if (/PolicyRevoked/i.test(joined)) return "revoked";
  if (/PolicyExpired/i.test(joined)) return "expiry";
  if (/InvalidVaultAuthority|custom program error: 0x4/i.test(joined)) {
    return "vaultAuthority";
  }
  if (/VAJRA_GUARD:12:all_clear/i.test(joined)) return "all_clear";
  return "unknown";
}

function guardErrorFromLogs(logs: string[]): string {
  return (
    logs.find((log) => /Error Code:|custom program error/i.test(log)) ?? ""
  );
}

function classify(
  hasProgram: boolean,
  err: unknown,
  innerTransfers: number,
): VajraPaymentClassification {
  if (!hasProgram) return "not_vajra";
  if (err) return "vajra_blocked";
  if (innerTransfers > 0) return "vajra_allowed";
  return "unknown";
}

function statusFor(classification: VajraPaymentClassification): ReceiptStatus {
  if (classification === "vajra_allowed") return "allowed";
  if (classification === "vajra_blocked") return "blocked";
  if (classification === "not_vajra") return "not_vajra";
  return "unknown";
}

function validateExpectations(
  receipt: VajraReceipt,
  options: VerifyPaymentOptions,
): string[] {
  const errors: string[] = [];
  const checks: Array<[string, string | undefined, string]> = [
    ["policy", keyToString(options.expectedPolicy), receipt.policy],
    ["vault", keyToString(options.expectedVault), receipt.vault],
    [
      "destination",
      keyToString(options.expectedDestination),
      receipt.destination,
    ],
    ["mint", keyToString(options.expectedMint), receipt.mint],
    [
      "amount",
      amountToString(options.expectedAmount),
      receipt.requested_amount,
    ],
  ];
  for (const [name, expected, actual] of checks) {
    if (!expected) continue;
    if (!actual || actual === "unknown") {
      errors.push(
        `Expected ${name} ${expected}, but verifier could not derive ${name}.`,
      );
    } else if (expected !== actual) {
      errors.push(`Expected ${name} ${expected}, got ${actual}.`);
    }
  }
  return errors;
}

function fixtureLogs(fixture: VajraTransactionFixture): string[] {
  return fixture.logs ?? [];
}

export function verifyVajraPaymentFixture(
  fixture: VajraTransactionFixture,
  options: VerifyPaymentOptions = {},
): VerifyPaymentResult {
  const expectedProgram =
    keyToString(options.expectedProgramId) ?? DEFAULT_VAJRA_PROGRAM_ID;
  const logs = fixtureLogs(fixture);
  const hasProgram = fixture.programId === expectedProgram;
  const innerTransfers = fixture.innerTokenTransfers ?? 0;
  const classification = classify(hasProgram, fixture.err, innerTransfers);
  const ruleTriggered = fixture.ruleTriggered ?? ruleFromLogs(logs);
  const status = statusFor(classification);
  const before = fixture.vaultBalanceBefore ?? "unknown";
  const after = fixture.vaultBalanceAfter ?? "unknown";
  const vaultDelta =
    before !== "unknown" && after !== "unknown"
      ? (BigInt(after) - BigInt(before)).toString()
      : "unknown";

  const receipt = createReceipt({
    network: options.network ?? fixture.network,
    program_id: fixture.programId,
    signature: fixture.signature,
    explorer_url: explorerUrl(
      fixture.signature,
      options.network ?? fixture.network,
    ),
    policy: fixture.policy,
    policy_id: fixture.policyId,
    agent: fixture.agent,
    owner: fixture.owner,
    vault: fixture.vault,
    mint: fixture.mint,
    source: fixture.source,
    destination: fixture.destination,
    destination_label: fixture.destinationLabel,
    attempt_type:
      classification === "vajra_allowed"
        ? "allowed_spend"
        : classification === "not_vajra"
          ? "verification_only"
          : "blocked_spend",
    status,
    requested_amount:
      fixture.requestedAmount ?? amountToString(options.expectedAmount) ?? "0",
    actual_inner_transfer_amount:
      fixture.actualInnerTransferAmount ??
      (innerTransfers > 0 ? (fixture.requestedAmount ?? "unknown") : "0"),
    vault_balance_before: before,
    vault_balance_after: after,
    vault_delta: vaultDelta,
    inner_token_transfers: innerTransfers,
    rule_triggered: ruleTriggered,
    guard_error: fixture.guardError ?? guardErrorFromLogs(logs),
    logs,
    raw_transaction_summary: { err: fixture.err, fixture: true },
    verifier: {
      verified: classification !== "unknown",
      method: "fixture_log_and_balance_check",
      checked_at: new Date().toISOString(),
    },
  });
  const errors = validateExpectations(receipt, options);
  return {
    verified: receipt.verifier.verified && errors.length === 0,
    classification,
    signature: fixture.signature,
    explorerUrl: receipt.explorer_url,
    policy: receipt.policy || undefined,
    vault: receipt.vault || undefined,
    agent: receipt.agent || undefined,
    destination: receipt.destination || undefined,
    amount: receipt.requested_amount,
    status: receipt.status,
    ruleTriggered,
    vaultDelta,
    innerTokenTransfers: innerTransfers,
    errors,
    receipt,
  };
}

export async function verifyVajraPayment(
  connection: Connection,
  signature: string,
  options: VerifyPaymentOptions = {},
): Promise<VerifyPaymentResult> {
  const expectedProgram =
    keyToString(options.expectedProgramId) ?? DEFAULT_VAJRA_PROGRAM_ID;
  const network = options.network ?? "devnet";
  try {
    const tx = await connection.getParsedTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (!tx) {
      const receipt = createReceipt({
        network,
        program_id: expectedProgram,
        signature,
        attempt_type: "verification_only",
        status: "unknown",
        requested_amount: amountToString(options.expectedAmount) ?? "0",
        rule_triggered: "missing_transaction",
        guard_error: "Transaction was not found by the configured RPC.",
        verifier: {
          verified: false,
          method: "rpc_getParsedTransaction",
          checked_at: new Date().toISOString(),
        },
      });
      return {
        verified: false,
        classification: "unknown",
        signature,
        explorerUrl: receipt.explorer_url,
        errors: ["Transaction not found."],
        receipt,
      };
    }

    const logs = tx.meta?.logMessages ?? [];
    const hasProgram =
      logs.some(
        (log) => log.includes(expectedProgram) || log.includes("VAJRA_GUARD"),
      ) ||
      JSON.stringify(tx.transaction.message.instructions).includes(
        expectedProgram,
      );
    const innerInstructions = tx.meta?.innerInstructions ?? [];
    const tokenTransferInfos: Array<Record<string, unknown>> = [];
    for (const group of innerInstructions) {
      for (const ix of group.instructions as any[]) {
        const parsedType = ix.parsed?.type;
        if (parsedType === "transfer" || parsedType === "transferChecked") {
          tokenTransferInfos.push(ix.parsed?.info ?? {});
        }
      }
    }
    const innerTokenTransfers = tokenTransferInfos.length;
    const firstTransfer = tokenTransferInfos[0] ?? {};
    const derivedSource =
      typeof firstTransfer.source === "string" ? firstTransfer.source : "";
    const derivedDestination =
      typeof firstTransfer.destination === "string"
        ? firstTransfer.destination
        : "";
    const derivedMint =
      typeof firstTransfer.mint === "string"
        ? firstTransfer.mint
        : typeof firstTransfer.tokenAmount === "object" &&
            firstTransfer.tokenAmount &&
            "mint" in firstTransfer.tokenAmount
          ? String((firstTransfer.tokenAmount as any).mint)
          : "";
    const derivedAmount =
      typeof firstTransfer.amount === "string"
        ? firstTransfer.amount
        : typeof firstTransfer.tokenAmount === "object" &&
            firstTransfer.tokenAmount &&
            "amount" in firstTransfer.tokenAmount
          ? String((firstTransfer.tokenAmount as any).amount)
          : (amountToString(options.expectedAmount) ?? "unknown");
    const classification = classify(
      hasProgram,
      tx.meta?.err ?? null,
      innerTokenTransfers,
    );
    const receipt = createReceipt({
      network,
      program_id: expectedProgram,
      signature,
      attempt_type:
        classification === "vajra_allowed"
          ? "allowed_spend"
          : classification === "not_vajra"
            ? "verification_only"
            : "blocked_spend",
      status: statusFor(classification),
      requested_amount: amountToString(options.expectedAmount) ?? "unknown",
      actual_inner_transfer_amount:
        innerTokenTransfers > 0 ? derivedAmount : "0",
      source: derivedSource,
      destination: derivedDestination,
      mint: derivedMint,
      inner_token_transfers: innerTokenTransfers,
      rule_triggered: ruleFromLogs(logs),
      guard_error: guardErrorFromLogs(logs),
      logs,
      raw_transaction_summary: {
        slot: tx.slot,
        blockTime: tx.blockTime,
        err: tx.meta?.err ?? null,
      },
      verifier: {
        verified: classification !== "unknown",
        method: "rpc_logs_and_inner_instruction_check",
        checked_at: new Date().toISOString(),
      },
    });
    const errors = validateExpectations(receipt, options);
    return {
      verified: receipt.verifier.verified && errors.length === 0,
      classification,
      signature,
      explorerUrl: receipt.explorer_url,
      amount: receipt.requested_amount,
      status: receipt.status,
      ruleTriggered: receipt.rule_triggered,
      vaultDelta: receipt.vault_delta,
      innerTokenTransfers,
      errors,
      receipt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const receipt = createReceipt({
      network,
      program_id: expectedProgram,
      signature,
      attempt_type: "verification_only",
      status: "unknown",
      requested_amount: amountToString(options.expectedAmount) ?? "0",
      rule_triggered: "rpc_error",
      guard_error: message,
      verifier: {
        verified: false,
        method: "rpc_getParsedTransaction",
        checked_at: new Date().toISOString(),
      },
    });
    return {
      verified: false,
      classification: "unknown",
      signature,
      explorerUrl: receipt.explorer_url,
      errors: [message],
      receipt,
    };
  }
}
