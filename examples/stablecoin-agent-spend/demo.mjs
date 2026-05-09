import {
  getMandate,
  receiptToMarkdown,
  verifyVajraPaymentFixture,
} from "@vinaystwt/vajra-sdk";

const mandate = getMandate("stablecoin-agent");
const allowed = verifyVajraPaymentFixture({
  network: "fixture",
  programId: "APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD",
  signature: "stablecoin_fixture_allowed",
  err: null,
  mint: "DemoUSD111111111111111111111111111111111111",
  destination: "MerchantDemoUSDAccount111111111111111111111",
  requestedAmount: "5000000",
  actualInnerTransferAmount: "5000000",
  vaultBalanceBefore: "100000000",
  vaultBalanceAfter: "95000000",
  innerTokenTransfers: 1,
  ruleTriggered: "all_clear",
  logs: ["Program log: VAJRA_GUARD:12:all_clear_cpi_transfer"],
});
const blocked = verifyVajraPaymentFixture({
  network: "fixture",
  programId: "APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD",
  signature: "stablecoin_fixture_blocked",
  err: { InstructionError: [0, { Custom: 6007 }] },
  mint: "DemoUSD111111111111111111111111111111111111",
  destination: "AttackerDemoUSDAccount111111111111111111111",
  requestedAmount: "50000000",
  actualInnerTransferAmount: "0",
  vaultBalanceBefore: "95000000",
  vaultBalanceAfter: "95000000",
  innerTokenTransfers: 0,
  ruleTriggered: "perTxCap",
  logs: ["Program log: AnchorError thrown. Error Code: PerTxCapExceeded."],
});

console.log("Mandate:", mandate.name);
console.log("Demo token: DemoUSD test SPL mint");
console.log(
  "Allowed:",
  allowed.receipt.status,
  allowed.receipt.requested_amount,
);
console.log("Blocked:", blocked.receipt.status, blocked.receipt.rule_triggered);
console.log(
  receiptToMarkdown(blocked.receipt).split("\n").slice(0, 8).join("\n"),
);
