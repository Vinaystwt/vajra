import type { AgentMandate, CreatePolicyInput } from "./types.js";

export const agentMandates: AgentMandate[] = [
  {
    id: "stablecoin-agent",
    name: "Stablecoin Agent Mandate",
    target_user:
      "Operators giving bots a bounded DemoUSD or SPL-token allowance.",
    use_case:
      "Recurring merchant, API, compute, or ops payments from a PolicyPDA vault.",
    risk_model:
      "Limits blast radius with per-transaction cap, period budget, destination allowlist, velocity limit, expiry, and revoke.",
    recommended_total_budget: "100000000",
    recommended_per_tx_cap: "5000000",
    recommended_period_budget: "25000000",
    recommended_velocity_limit: "20 slots",
    recommended_expiry: "7 days or one campaign window",
    allowed_destination_model:
      "Pre-approve merchant token accounts; rotate by adding a new destination rule.",
    revoke_behavior:
      "Owner can revoke immediately and withdraw remaining vault funds.",
    verifier_notes:
      "Merchants verify the signature with the Vajra verifier before fulfilling service.",
    sdk_snippet:
      "const mandate = getMandate('stablecoin-agent'); const policy = mandateToPolicyConfig(mandate);",
    demo_receipt_reference: "proofs/latest/receipts.json",
  },
  {
    id: "api-buyer",
    name: "API Buyer Mandate",
    target_user: "Agents buying protected API or data access.",
    use_case: "Small repeated payments to a fixed API merchant token account.",
    risk_model:
      "Low per-call cap, short period budget, and destination allowlist stop overpayment or destination swapping.",
    recommended_total_budget: "50000000",
    recommended_per_tx_cap: "2000000",
    recommended_period_budget: "10000000",
    recommended_velocity_limit: "5 slots",
    recommended_expiry: "24 hours",
    allowed_destination_model: "One merchant token account per protected API.",
    revoke_behavior:
      "Owner revokes when API key, merchant, or campaign changes.",
    verifier_notes:
      "API checks receipt status allowed and expected destination before returning protected payload.",
    sdk_snippet: "const mandate = getMandate('api-buyer');",
    demo_receipt_reference: "examples/x402-vajra/proofs/x402-vajra-proof.json",
  },
  {
    id: "defi-bot",
    name: "DeFi Bot Mandate",
    target_user: "Automated treasury or strategy bots.",
    use_case: "Bounded ops payments to pre-approved token accounts.",
    risk_model:
      "Higher total budget with strict destination rules and slower velocity.",
    recommended_total_budget: "500000000",
    recommended_per_tx_cap: "50000000",
    recommended_period_budget: "150000000",
    recommended_velocity_limit: "50 slots",
    recommended_expiry: "3 days",
    allowed_destination_model:
      "Protocol-owned token accounts that the operator approves in advance.",
    revoke_behavior:
      "Owner revokes if strategy code or destination list changes.",
    verifier_notes:
      "Verifier confirms the payment was routed through the deployed Vajra program.",
    sdk_snippet:
      "const policy = mandateToPolicyConfig(getMandate('defi-bot')!);",
  },
  {
    id: "dao-ops",
    name: "DAO Ops Mandate",
    target_user: "DAO operators automating small recurring payouts.",
    use_case:
      "Routine service-provider payments without handing an agent treasury authority.",
    risk_model:
      "Moderate caps, daily budget windows, explicit allowlist, owner recovery.",
    recommended_total_budget: "1000000000",
    recommended_per_tx_cap: "25000000",
    recommended_period_budget: "100000000",
    recommended_velocity_limit: "20 slots",
    recommended_expiry: "30 days",
    allowed_destination_model: "Approved contributor or vendor token accounts.",
    revoke_behavior:
      "Owner revokes at end of mandate or after vendor rotation.",
    verifier_notes:
      "Auditors can compare receipt CSV rows against policy state and transaction logs.",
    sdk_snippet: "listMandates().find((m) => m.id === 'dao-ops')",
  },
  {
    id: "market-maker",
    name: "Market Maker Mandate",
    target_user:
      "High-frequency automated signers with bounded payout authority.",
    use_case: "Rapid but capped transfers to a small set of approved venues.",
    risk_model:
      "Higher period budget, tight destination set, and minimum slot interval.",
    recommended_total_budget: "5000000000",
    recommended_per_tx_cap: "100000000",
    recommended_period_budget: "1000000000",
    recommended_velocity_limit: "1 slot",
    recommended_expiry: "1 day",
    allowed_destination_model: "Venue-specific token accounts only.",
    revoke_behavior: "Owner revokes if venue key, signer, or strategy changes.",
    verifier_notes:
      "Verification should pin expected destination and amount for each payment.",
    sdk_snippet: "const mandate = getMandate('market-maker');",
  },
  {
    id: "payroll-ops",
    name: "Payroll/Ops Mandate",
    target_user: "Ops automation that sends recurring fixed payouts.",
    use_case:
      "Scheduled payouts to known recipients without raw treasury key exposure.",
    risk_model:
      "High interval spacing, explicit recipient allowlist, long expiry only when operationally needed.",
    recommended_total_budget: "2000000000",
    recommended_per_tx_cap: "250000000",
    recommended_period_budget: "500000000",
    recommended_velocity_limit: "1000 slots",
    recommended_expiry: "30 days",
    allowed_destination_model:
      "Recipient token accounts approved by the owner.",
    revoke_behavior: "Owner revokes after payout cycle or recipient change.",
    verifier_notes:
      "Receipt proves whether funds moved and which rule applied.",
    sdk_snippet: "const mandate = getMandate('payroll-ops');",
  },
];

export function listMandates(): AgentMandate[] {
  return [...agentMandates];
}

export function getMandate(id: string): AgentMandate | undefined {
  return agentMandates.find((mandate) => mandate.id === id);
}

export function mandateToPolicyConfig(
  mandate: AgentMandate,
): Pick<
  CreatePolicyInput,
  | "totalBudget"
  | "perTxCap"
  | "periodBudget"
  | "periodDurationSlots"
  | "minSlotInterval"
> {
  return {
    totalBudget: mandate.recommended_total_budget,
    perTxCap: mandate.recommended_per_tx_cap,
    periodBudget: mandate.recommended_period_budget,
    periodDurationSlots: mandate.id === "api-buyer" ? "7200" : "216000",
    minSlotInterval: mandate.recommended_velocity_limit.split(" ")[0],
  };
}

export function explainMandateRisk(mandate: AgentMandate): string[] {
  return [
    mandate.risk_model,
    `Destination model: ${mandate.allowed_destination_model}`,
    `Revoke behavior: ${mandate.revoke_behavior}`,
    "Mandates are implementation templates, not legal compliance rules.",
  ];
}
