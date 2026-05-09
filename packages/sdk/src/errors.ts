import type { VajraError } from "./types.js";

const ERROR_MAP: Record<string, VajraError> = {
  "6000": {
    code: 6000,
    name: "InvalidBudget",
    message: "Budget must be positive and perTxCap must be within totalBudget.",
  },
  "6001": {
    code: 6001,
    name: "ExpiryInPast",
    message: "Expiry slot must be in the future.",
  },
  "6002": {
    code: 6002,
    name: "Unauthorized",
    message: "Signer is not authorized for this policy.",
  },
  "6003": {
    code: 6003,
    name: "PolicyRevoked",
    message: "Policy has been revoked.",
    ruleTriggered: "revoked",
  },
  "6004": {
    code: 6004,
    name: "PolicyExpired",
    message: "Policy has expired.",
    ruleTriggered: "expiry",
  },
  "6005": {
    code: 6005,
    name: "InvalidDelegateSigner",
    message: "Delegated signer does not match policy.",
    ruleTriggered: "delegatedSigner",
  },
  "6006": {
    code: 6006,
    name: "AmountZero",
    message: "Amount must be greater than zero.",
    ruleTriggered: "amount",
  },
  "6007": {
    code: 6007,
    name: "PerTxCapExceeded",
    message: "Amount exceeds the per-transaction cap.",
    ruleTriggered: "perTxCap",
  },
  "6008": {
    code: 6008,
    name: "TotalBudgetExceeded",
    message: "Spend would exceed the total budget.",
    ruleTriggered: "totalBudget",
  },
  "6009": {
    code: 6009,
    name: "DestinationNotAllowed",
    message: "Destination is not on the allowlist.",
    ruleTriggered: "destination",
  },
  "6010": {
    code: 6010,
    name: "MintMismatch",
    message: "Destination mint does not match allowed mint.",
    ruleTriggered: "mint",
  },
  "6011": {
    code: 6011,
    name: "VaultMintMismatch",
    message: "Vault mint does not match allowed mint.",
    ruleTriggered: "vaultMint",
  },
  "6012": {
    code: 6012,
    name: "InvalidVaultAuthority",
    message: "Vault authority is not the PolicyPDA.",
    ruleTriggered: "vaultAuthority",
  },
  "6013": {
    code: 6013,
    name: "VaultInsufficientBalance",
    message: "Vault balance is insufficient.",
    ruleTriggered: "vaultBalance",
  },
  "6014": {
    code: 6014,
    name: "ArithmeticOverflow",
    message: "Checked arithmetic overflow.",
  },
  "6015": {
    code: 6015,
    name: "DestinationAlreadyExists",
    message: "Destination already exists.",
  },
  "6016": {
    code: 6016,
    name: "PeriodBudgetExceeded",
    message: "Spend would exceed the current period budget.",
    ruleTriggered: "periodBudget",
  },
  "6017": {
    code: 6017,
    name: "VelocityLimitExceeded",
    message: "Spend violates the minimum slot interval.",
    ruleTriggered: "velocity",
  },
  "6018": {
    code: 6018,
    name: "FeeBpsTooHigh",
    message: "Fee basis points exceed the configured maximum.",
  },
  "6019": {
    code: 6019,
    name: "InvalidWithdrawalDestination",
    message: "Withdrawal destination must be owned by the policy owner.",
    ruleTriggered: "withdrawDestination",
  },
};

export function explainError(error: unknown): VajraError {
  const text =
    typeof error === "string"
      ? error
      : JSON.stringify(error, Object.getOwnPropertyNames(error));
  for (const entry of Object.values(ERROR_MAP)) {
    if (
      text.includes(entry.name) ||
      (entry.code && text.includes(entry.code.toString()))
    ) {
      return entry;
    }
  }
  return {
    name: "UnknownVajraError",
    message: text || "Unknown Vajra error",
  };
}

export { ERROR_MAP };
