import {
  getMandate,
  mandateToPolicyConfig,
  verifyVajraPaymentFixture,
} from "@vinaystwt/vajra-sdk";

const mandate = getMandate("api-buyer");
const policyConfig = mandateToPolicyConfig(mandate);

const allowed = verifyVajraPaymentFixture({
  network: "fixture",
  programId: "APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD",
  signature: "autonomous_agent_allowed_fixture",
  err: null,
  requestedAmount: "2000000",
  actualInnerTransferAmount: "2000000",
  vaultBalanceBefore: "50000000",
  vaultBalanceAfter: "48000000",
  innerTokenTransfers: 1,
  ruleTriggered: "all_clear",
  logs: ["Program log: VAJRA_GUARD:12:all_clear_cpi_transfer"],
});

const blocked = verifyVajraPaymentFixture({
  network: "fixture",
  programId: "APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD",
  signature: "autonomous_agent_blocked_fixture",
  err: { InstructionError: [0, { Custom: 6009 }] },
  requestedAmount: "2000000",
  actualInnerTransferAmount: "0",
  vaultBalanceBefore: "48000000",
  vaultBalanceAfter: "48000000",
  innerTokenTransfers: 0,
  ruleTriggered: "destination",
  logs: ["Program log: AnchorError thrown. Error Code: DestinationNotAllowed."],
});

console.log("Mandate:", mandate.name);
console.log("Policy config:", policyConfig);
console.log(
  "Allowed receipt:",
  allowed.receipt.status,
  allowed.receipt.rule_triggered,
);
console.log(
  "Blocked receipt:",
  blocked.receipt.status,
  blocked.receipt.rule_triggered,
);
console.log("Verifier accepted allowed receipt:", allowed.verified);
console.log("Verifier rejected attacker path:", blocked.verified);
