import { loadProofPacket } from "./proof-utils";

async function main() {
  const packet = loadProofPacket();
  for (const attempt of packet.attempts.filter(
    (entry) => entry.result === "blocked",
  )) {
    console.log(
      `${attempt.attemptType}: blocked by ${attempt.ruleTriggered}; avoidedLoss=${attempt.avoidedLoss}; vaultDelta=${attempt.vaultDelta}`,
    );
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
