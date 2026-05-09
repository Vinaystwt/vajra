export const PROGRAM_ID = "APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD";
export const PROGRAM_EXPLORER =
  "https://explorer.solana.com/address/APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD?cluster=devnet";
export const CLUSTER = "devnet";

export const DECIMALS = 6;

export function lamportsToUi(lamports: number | string): number {
  return Number(lamports) / Math.pow(10, DECIMALS);
}

export function uiToLamports(ui: number): number {
  return ui * Math.pow(10, DECIMALS);
}

export function formatUsd(lamports: number | string, decimals = 2): string {
  const ui = lamportsToUi(lamports);
  return ui.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function shortKey(key: string, head = 4, tail = 4): string {
  if (!key || key.length <= head + tail + 3) return key;
  return `${key.slice(0, head)}…${key.slice(-tail)}`;
}

export function explorerTx(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

export function explorerAddress(addr: string): string {
  return `https://explorer.solana.com/address/${addr}?cluster=devnet`;
}

export const GUARD_LABELS: Record<string, string> = {
  all_clear: "All Clear",
  velocity: "Velocity Limit Exceeded",
  perTxCap: "Per-Tx Cap Exceeded",
  destination: "Destination Not Allowed",
  periodBudget: "Period Budget Exceeded",
  revoked: "Policy Revoked",
  vaultAuthority: "Vault Authority Check (Raw Drain)",
  ownerRecovery: "Owner Recovery",
};

export const NAV_LINKS = [
  { href: "/attack-lab", label: "Attack Lab", accent: "crimson" },
  { href: "/proofs", label: "Proofs" },
  { href: "/developers", label: "Developers" },
  { href: "/why", label: "Why Vajra" },
];
