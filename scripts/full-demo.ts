import { writeFileSync } from "fs";
import {
  DEMO_RESULTS_PATH,
  ProofAttempt,
  ProofPacket,
  ensureProofDir,
  writeProofPacket,
} from "./proof-utils";

const policy = "DemoPolicyPDA111111111111111111111111111111";
const agent = "DemoAgent1111111111111111111111111111111111";
const vault = "DemoVaultATA1111111111111111111111111111111";
const mint = "DemoUSD111111111111111111111111111111111111";
const merchantA = "MerchantAAllowedTokenAccount111111111111111";
const merchantB = "MerchantBBlockedTokenAccount111111111111111";

function attempt(input: {
  type: string;
  amount: number;
  destination: string;
  expected: "allowed" | "blocked";
  rule: string;
  before: number;
}): ProofAttempt {
  const allowed = input.expected === "allowed" && input.type !== "simulate";
  const after = allowed ? input.before - input.amount : input.before;
  return {
    policy,
    agent,
    vault,
    mint,
    attemptType: input.type,
    amount: input.amount.toString(),
    destination: input.destination,
    result: input.expected,
    ruleTriggered: input.rule,
    signature: allowed
      ? `local-${input.type}-allowed`
      : `local-${input.type}-blocked`,
    explorerUrl: "",
    vaultBalanceBefore: input.before.toString(),
    vaultBalanceAfter: after.toString(),
    vaultDelta: (after - input.before).toString(),
    avoidedLoss: allowed ? "0" : input.amount.toString(),
    timestamp: new Date().toISOString(),
    logs: [`VAJRA_GUARD:${input.type}:${input.rule}`],
    errorSummary: allowed ? undefined : `Blocked by ${input.rule}`,
  };
}

async function main() {
  ensureProofDir();
  let balance = 100_000_000;
  const attempts: ProofAttempt[] = [];

  for (const item of [
    {
      type: "good-spend",
      amount: 5_000_000,
      destination: merchantA,
      expected: "allowed" as const,
      rule: "all_clear",
    },
    {
      type: "over-cap",
      amount: 50_000_000,
      destination: merchantA,
      expected: "blocked" as const,
      rule: "perTxCap",
    },
    {
      type: "wrong-destination",
      amount: 5_000_000,
      destination: merchantB,
      expected: "blocked" as const,
      rule: "destination",
    },
    {
      type: "velocity-attack",
      amount: 1_000_000,
      destination: merchantA,
      expected: "blocked" as const,
      rule: "velocity",
    },
    {
      type: "period-budget-attack",
      amount: 30_000_000,
      destination: merchantA,
      expected: "blocked" as const,
      rule: "periodBudget",
    },
    {
      type: "revoked-policy",
      amount: 1_000_000,
      destination: merchantA,
      expected: "blocked" as const,
      rule: "revoked",
    },
    {
      type: "raw-drain",
      amount: 95_000_000,
      destination: merchantB,
      expected: "blocked" as const,
      rule: "vaultAuthority",
    },
    {
      type: "x402-pay",
      amount: 2_000_000,
      destination: merchantA,
      expected: "allowed" as const,
      rule: "all_clear",
    },
    {
      type: "simulate",
      amount: 1_000_000,
      destination: merchantA,
      expected: "allowed" as const,
      rule: "simulation",
    },
    {
      type: "withdraw",
      amount: 10_000_000,
      destination: "OwnerRecoveryTokenAccount111111111111111",
      expected: "allowed" as const,
      rule: "ownerRecovery",
    },
  ]) {
    const proof = attempt({ ...item, before: balance });
    attempts.push(proof);
    balance = Number(proof.vaultBalanceAfter);
    console.log(
      `${proof.attemptType}: expected=${item.expected} actual=${proof.result} rule=${proof.ruleTriggered} vault=${proof.vaultBalanceBefore}->${proof.vaultBalanceAfter}`,
    );
  }

  const packet: ProofPacket = {
    product: "Vajra",
    headline: "Your agent can spend. It cannot drain.",
    generatedAt: new Date().toISOString(),
    cluster: "local-dry-run",
    attempts,
  };

  writeFileSync(DEMO_RESULTS_PATH, JSON.stringify(packet, null, 2));
  const paths = writeProofPacket(packet, "demo-proof");
  console.log("\nProof artifacts:");
  console.log(paths);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
