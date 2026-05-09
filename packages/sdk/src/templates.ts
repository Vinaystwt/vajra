import type { PolicyTemplate } from "./types.js";

export const policyTemplates: Record<string, PolicyTemplate> = {
  x402ApiBuyer: {
    id: "x402ApiBuyer",
    name: "x402 API Buyer",
    description:
      "Small API payments with a tight per-call cap and short velocity interval.",
    fields: {
      totalBudget: "100000000",
      perTxCap: "5000000",
      periodBudget: "25000000",
      periodDurationSlots: "7200",
      minSlotInterval: "2",
    },
  },
  defiRebalancer: {
    id: "defiRebalancer",
    name: "DeFi Rebalancer",
    description: "Moderate automation budget with slower spend cadence.",
    fields: {
      totalBudget: "500000000",
      perTxCap: "50000000",
      periodBudget: "150000000",
      periodDurationSlots: "43200",
      minSlotInterval: "50",
    },
  },
  daoOpsBot: {
    id: "daoOpsBot",
    name: "DAO Ops Bot",
    description:
      "Operational payments with conservative caps and daily budget windows.",
    fields: {
      totalBudget: "1000000000",
      perTxCap: "25000000",
      periodBudget: "100000000",
      periodDurationSlots: "216000",
      minSlotInterval: "20",
    },
  },
  payrollAgent: {
    id: "payrollAgent",
    name: "Payroll Agent",
    description:
      "Scheduled payroll-like disbursement with high interval spacing.",
    fields: {
      totalBudget: "2000000000",
      perTxCap: "250000000",
      periodBudget: "500000000",
      periodDurationSlots: "432000",
      minSlotInterval: "1000",
    },
  },
  computeDataBuyer: {
    id: "computeDataBuyer",
    name: "Compute/Data Buyer",
    description:
      "Usage-based compute or data purchases with a low per-call cap.",
    fields: {
      totalBudget: "200000000",
      perTxCap: "10000000",
      periodBudget: "50000000",
      periodDurationSlots: "21600",
      minSlotInterval: "5",
    },
  },
  marketMaker: {
    id: "marketMaker",
    name: "Market Maker",
    description:
      "Higher-frequency allowed spending with strict destination and period limits.",
    fields: {
      totalBudget: "5000000000",
      perTxCap: "100000000",
      periodBudget: "1000000000",
      periodDurationSlots: "7200",
      minSlotInterval: "1",
    },
  },
  protocolOpsBot: {
    id: "protocolOpsBot",
    name: "Protocol Ops Bot",
    description:
      "Protocol maintenance payments with owner recovery and strong total budget.",
    fields: {
      totalBudget: "1500000000",
      perTxCap: "50000000",
      periodBudget: "200000000",
      periodDurationSlots: "86400",
      minSlotInterval: "25",
    },
  },
};
