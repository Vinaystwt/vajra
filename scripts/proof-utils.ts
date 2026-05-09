import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export type AttemptResult = "allowed" | "blocked";

export interface ProofAttempt {
  policy: string;
  agent: string;
  vault: string;
  mint: string;
  attemptType: string;
  amount: string;
  destination: string;
  result: AttemptResult;
  ruleTriggered: string;
  signature?: string;
  explorerUrl?: string;
  vaultBalanceBefore: string;
  vaultBalanceAfter: string;
  vaultDelta: string;
  avoidedLoss: string;
  timestamp: string;
  logs: string[];
  errorSummary?: string;
}

export interface ProofPacket {
  product: "Vajra";
  headline: "Your agent can spend. It cannot drain.";
  generatedAt: string;
  cluster: string;
  attempts: ProofAttempt[];
}

export const PROOFS_DIR = path.join(__dirname, "../proofs");
export const DEMO_RESULTS_PATH = path.join(
  PROOFS_DIR,
  "latest-demo-results.json",
);

export function ensureProofDir() {
  mkdirSync(PROOFS_DIR, { recursive: true });
}

export function writeProofPacket(packet: ProofPacket, basename = "demo-proof") {
  ensureProofDir();
  const jsonPath = path.join(PROOFS_DIR, `${basename}.json`);
  const mdPath = path.join(PROOFS_DIR, `${basename}.md`);
  const csvPath = path.join(PROOFS_DIR, `${basename}.csv`);

  writeFileSync(jsonPath, JSON.stringify(packet, null, 2));
  writeFileSync(mdPath, toMarkdown(packet));
  writeFileSync(csvPath, toCsv(packet));

  return { jsonPath, mdPath, csvPath };
}

export function loadProofPacket(inputPath = DEMO_RESULTS_PATH): ProofPacket {
  if (!existsSync(inputPath)) {
    throw new Error(
      `No proof packet found at ${inputPath}. Run scripts/full-demo.ts first or pass a packet path.`,
    );
  }
  return JSON.parse(readFileSync(inputPath, "utf8")) as ProofPacket;
}

export function toMarkdown(packet: ProofPacket): string {
  const rows = packet.attempts
    .map((attempt) => {
      return `| ${attempt.attemptType} | ${attempt.amount} | ${attempt.result} | ${attempt.ruleTriggered} | ${attempt.vaultBalanceBefore} | ${attempt.vaultBalanceAfter} | ${attempt.avoidedLoss} |`;
    })
    .join("\n");

  return `# Vajra Proof Report

${packet.headline}

Generated: ${packet.generatedAt}

Cluster: ${packet.cluster}

| Attempt | Amount | Result | Rule | Vault Before | Vault After | Avoided Loss |
| --- | ---: | --- | --- | ---: | ---: | ---: |
${rows}

## Notes

Allowed spends reduce the vault balance. Blocked spends leave the vault balance unchanged. Raw drain attempts fail because the delegated signer is not the vault authority.
`;
}

export function toCsv(packet: ProofPacket): string {
  const header = [
    "timestamp",
    "policy",
    "agent",
    "vault",
    "mint",
    "attemptType",
    "amount",
    "destination",
    "result",
    "ruleTriggered",
    "signature",
    "explorerUrl",
    "vaultBalanceBefore",
    "vaultBalanceAfter",
    "vaultDelta",
    "avoidedLoss",
    "errorSummary",
  ];
  const rows = packet.attempts.map((attempt) =>
    header
      .map((key) =>
        JSON.stringify(
          String((attempt as unknown as Record<string, unknown>)[key] ?? ""),
        ),
      )
      .join(","),
  );
  return [header.join(","), ...rows].join("\n") + "\n";
}
