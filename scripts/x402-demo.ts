import { writeProofPacket } from "./proof-utils";

async function main() {
  const now = new Date().toISOString();
  const packet = {
    product: "Vajra" as const,
    headline: "Your agent can spend. It cannot drain." as const,
    generatedAt: now,
    cluster: "local-402-style",
    attempts: [
      {
        policy: "X402PolicyPDA111111111111111111111111111111",
        agent: "X402BuyerAgent11111111111111111111111111111",
        vault: "X402Vault111111111111111111111111111111111",
        mint: "DemoUSD111111111111111111111111111111111111",
        attemptType: "x402-pay",
        amount: "2000000",
        destination: "ProtectedApiMerchantTokenAccount111111111",
        result: "allowed" as const,
        ruleTriggered: "all_clear",
        signature: "local-x402-allowed",
        explorerUrl: "",
        vaultBalanceBefore: "100000000",
        vaultBalanceAfter: "98000000",
        vaultDelta: "-2000000",
        avoidedLoss: "0",
        timestamp: now,
        logs: ["HTTP 402 payment required", "VAJRA_GUARD:x402-pay:all_clear"],
      },
      {
        policy: "X402PolicyPDA111111111111111111111111111111",
        agent: "X402BuyerAgent11111111111111111111111111111",
        vault: "X402Vault111111111111111111111111111111111",
        mint: "DemoUSD111111111111111111111111111111111111",
        attemptType: "x402-pay-over-budget",
        amount: "50000000",
        destination: "ProtectedApiMerchantTokenAccount111111111",
        result: "blocked" as const,
        ruleTriggered: "perTxCap",
        signature: "local-x402-blocked",
        explorerUrl: "",
        vaultBalanceBefore: "98000000",
        vaultBalanceAfter: "98000000",
        vaultDelta: "0",
        avoidedLoss: "50000000",
        timestamp: now,
        logs: [
          "HTTP 402 payment required",
          "VAJRA_GUARD:x402-pay-over-budget:perTxCap",
        ],
        errorSummary: "Blocked by perTxCap",
      },
    ],
  };
  const paths = writeProofPacket(packet, "x402-proof");
  console.log("x402-style local flow complete:");
  console.log(paths);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
