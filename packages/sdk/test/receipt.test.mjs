import assert from "node:assert/strict";
import {
  createReceipt,
  receiptToCsvRow,
  receiptToMarkdown,
  verifyReceiptHash,
} from "../dist/src/receipt.js";
import { getMandate, mandateToPolicyConfig } from "../dist/src/mandates.js";
import { verifyVajraPaymentFixture } from "../dist/src/verify.js";

const programId = "APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD";
const fixtureCommon = {
  network: "fixture",
  programId,
  policy: "Policy11111111111111111111111111111111111111",
  owner: "Owner111111111111111111111111111111111111111",
  agent: "Agent111111111111111111111111111111111111111",
  vault: "Vault111111111111111111111111111111111111111",
  mint: "DemoUSD111111111111111111111111111111111111",
  destination: "Merchant11111111111111111111111111111111111",
};

const baseInput = {
  network: "fixture",
  program_id: "Program1111111111111111111111111111111111",
  signature: "fixture_signature",
  created_at: "2026-01-01T00:00:00.000Z",
  attempt_type: "blocked_spend",
  status: "blocked",
  requested_amount: "100",
  vault_balance_before: "500",
  vault_balance_after: "500",
  vault_delta: "0",
  inner_token_transfers: 0,
  rule_triggered: "perTxCap",
  verifier: {
    verified: true,
    method: "fixture",
    checked_at: "2026-01-01T00:00:00.000Z",
  },
};
const baseReceipt = createReceipt(baseInput);
const sameReceipt = createReceipt(baseInput);

assert.equal(baseReceipt.receipt_hash, sameReceipt.receipt_hash);
assert.equal(verifyReceiptHash(baseReceipt), true);
assert.equal(baseReceipt.vault_delta, "0");
assert.match(receiptToMarkdown(baseReceipt), /Vajra Execution Receipt/);
assert.match(receiptToMarkdown(baseReceipt), /Status: blocked/);
assert.match(receiptToMarkdown(baseReceipt), /Rule: perTxCap/);
assert.match(receiptToMarkdown(baseReceipt), /Vault delta: 0/);
assert.match(receiptToCsvRow(baseReceipt), /fixture_signature/);
const csvReceipt = createReceipt({
  ...baseInput,
  signature: "csv_signature",
  destination_label: "Merchant, with comma\nand newline",
});
assert.match(
  receiptToCsvRow(csvReceipt),
  /"Merchant, with comma\\nand newline"/,
);

const missingOptional = createReceipt({
  network: "fixture",
  program_id: "Program1111111111111111111111111111111111",
  signature: "missing_optional",
  attempt_type: "verification_only",
  status: "unknown",
  requested_amount: "0",
});
assert.equal(missingOptional.policy, "");
assert.equal(missingOptional.vault_balance_before, "unknown");

const allowed = verifyVajraPaymentFixture({
  ...fixtureCommon,
  signature: "fixture_allowed_vajra_payment",
  err: null,
  requestedAmount: "5000000",
  actualInnerTransferAmount: "5000000",
  vaultBalanceBefore: "100000000",
  vaultBalanceAfter: "95000000",
  innerTokenTransfers: 1,
  logs: [
    `Program ${programId} invoke [1]`,
    "Program log: VAJRA_GUARD:12:all_clear_cpi_transfer",
  ],
});
assert.equal(allowed.classification, "vajra_allowed");
assert.equal(allowed.verified, true);

const blocked = verifyVajraPaymentFixture({
  ...fixtureCommon,
  signature: "fixture_blocked_vajra_payment",
  err: { InstructionError: [0, { Custom: 6007 }] },
  requestedAmount: "50000000",
  actualInnerTransferAmount: "0",
  vaultBalanceBefore: "95000000",
  vaultBalanceAfter: "95000000",
  innerTokenTransfers: 0,
  logs: ["Program log: AnchorError thrown. Error Code: PerTxCapExceeded."],
});
assert.equal(blocked.classification, "vajra_blocked");
assert.equal(blocked.receipt.vault_delta, "0");
assert.equal(blocked.receipt.inner_token_transfers, 0);

const nonVajra = verifyVajraPaymentFixture({
  network: "fixture",
  programId: "11111111111111111111111111111111",
  signature: "fixture_non_vajra_transfer",
  err: null,
  requestedAmount: "1000000",
  innerTokenTransfers: 1,
  logs: ["Program 11111111111111111111111111111111 success"],
});
assert.equal(nonVajra.classification, "not_vajra");

const rawDrain = verifyVajraPaymentFixture({
  network: "fixture",
  programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  signature: "fixture_raw_wallet_drain",
  err: null,
  requestedAmount: "50000000",
  actualInnerTransferAmount: "50000000",
  innerTokenTransfers: 1,
  logs: ["Raw wallet transfer signed by hot key."],
});
assert.equal(rawDrain.classification, "not_vajra");

const expectedProgramMismatch = verifyVajraPaymentFixture(
  {
    ...fixtureCommon,
    signature: "fixture_program_mismatch",
    err: null,
    requestedAmount: "5000000",
    innerTokenTransfers: 1,
    logs: ["Program log: VAJRA_GUARD:12:all_clear_cpi_transfer"],
  },
  { expectedProgramId: "DifferentProgram111111111111111111111111111" },
);
assert.equal(expectedProgramMismatch.classification, "not_vajra");

const missingLogs = verifyVajraPaymentFixture({
  ...fixtureCommon,
  signature: "fixture_missing_logs",
  err: { InstructionError: [0, { Custom: 6007 }] },
  requestedAmount: "50000000",
  vaultBalanceBefore: "95000000",
  vaultBalanceAfter: "95000000",
  innerTokenTransfers: 0,
});
assert.equal(missingLogs.classification, "vajra_blocked");
assert.equal(missingLogs.receipt.logs.length, 0);

const wrongDestination = verifyVajraPaymentFixture(
  {
    ...fixtureCommon,
    signature: "fixture_wrong_destination_check",
    err: null,
    requestedAmount: "5000000",
    actualInnerTransferAmount: "5000000",
    vaultBalanceBefore: "100000000",
    vaultBalanceAfter: "95000000",
    innerTokenTransfers: 1,
    logs: ["Program log: VAJRA_GUARD:12:all_clear_cpi_transfer"],
  },
  { expectedDestination: "WrongDestination111111111111111111111111111" },
);
assert.equal(wrongDestination.verified, false);
assert.ok(wrongDestination.errors.length > 0);

const missingDerivedDestination = verifyVajraPaymentFixture(
  {
    network: "fixture",
    programId,
    signature: "fixture_missing_destination",
    err: null,
    requestedAmount: "5000000",
    innerTokenTransfers: 1,
    logs: ["Program log: VAJRA_GUARD:12:all_clear_cpi_transfer"],
  },
  { expectedDestination: "Merchant11111111111111111111111111111111111" },
);
assert.equal(missingDerivedDestination.verified, false);
assert.match(
  missingDerivedDestination.errors.join("\n"),
  /could not derive destination/,
);

const mandate = getMandate("stablecoin-agent");
assert.ok(mandate);
assert.equal(mandateToPolicyConfig(mandate).perTxCap, "5000000");

const requiredSchemaFields = [
  "receipt_version",
  "receipt_id",
  "created_at",
  "network",
  "program_id",
  "signature",
  "explorer_url",
  "policy",
  "policy_id",
  "agent",
  "owner",
  "vault",
  "mint",
  "source",
  "destination",
  "destination_label",
  "attempt_type",
  "status",
  "requested_amount",
  "actual_inner_transfer_amount",
  "vault_balance_before",
  "vault_balance_after",
  "vault_delta",
  "inner_token_transfers",
  "rule_triggered",
  "guard_error",
  "logs",
  "raw_transaction_summary",
  "receipt_hash",
  "verifier",
];
for (const key of requiredSchemaFields) {
  assert.ok(key in baseReceipt, `Missing receipt field ${key}`);
}

console.log("SDK receipt/verifier/mandate tests passed.");
