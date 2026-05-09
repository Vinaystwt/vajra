// Amount formatting: 1 DemoUSD = 1_000_000 micro-units
export function formatDemoUSD(micro: string | number | undefined): string {
  if (micro === undefined || micro === null) return "0.00 DemoUSD";
  const num = typeof micro === "string" ? parseFloat(micro) : micro;
  if (isNaN(num)) return "0.00 DemoUSD";
  const dollars = num / 1_000_000;
  return `${dollars.toFixed(2)} DemoUSD`;
}

export function shortSig(sig: string, chars = 8): string {
  if (!sig || sig.length <= chars * 2) return sig;
  return `${sig.slice(0, chars)}…${sig.slice(-chars)}`;
}

export function explorerUrl(sig: string, network = "devnet"): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=${network}`;
}

export function classificationLabel(c: string): string {
  switch (c) {
    case "vajra_blocked":
      return "Vajra Blocked";
    case "not_vajra":
      return "Not Vajra (Raw Wallet)";
    case "vajra_allowed":
      return "Vajra Allowed";
    default:
      return c
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
  }
}

export function receiptStatusColor(
  status: string
): "crimson" | "emerald" | "amber" {
  switch (status) {
    case "allowed":
      return "emerald";
    case "blocked":
      return "crimson";
    case "raw_wallet_drained":
      return "amber";
    default:
      return "amber";
  }
}
