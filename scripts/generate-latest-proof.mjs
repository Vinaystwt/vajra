import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { format } from "prettier";
import {
  createReceipt,
  receiptToMarkdown,
  receiptsToCsv,
} from "../packages/sdk/dist/src/receipt.js";
import { verifyVajraPaymentFixture } from "../packages/sdk/dist/src/verify.js";
import { fixtures } from "./proof-fixtures.mjs";

const root = process.cwd();
const latestDir = path.join(root, "proofs/latest");
const publicDir = path.join(root, "app/public");
mkdirSync(latestDir, { recursive: true });
mkdirSync(publicDir, { recursive: true });

const comparisonPath = path.join(latestDir, "red-team-comparison.json");
if (!process.env.VAJRA_FORCE_FIXTURE_PROOF && existsSync(comparisonPath)) {
  const existing = JSON.parse(readFileSync(comparisonPath, "utf8"));
  if (
    existing.network === "devnet" &&
    existing.source === "fresh-devnet" &&
    existing.proof_type === "devnet-red-team"
  ) {
    console.log(
      "Preserved fresh devnet red-team proof bundle. Set VAJRA_FORCE_FIXTURE_PROOF=1 to regenerate the deterministic fixture bundle.",
    );
    process.exit(0);
  }
}

async function writeJson(filePath, value) {
  writeFileSync(
    filePath,
    await format(JSON.stringify(value), { parser: "json" }),
  );
}

async function writeMarkdown(filePath, value) {
  writeFileSync(filePath, await format(value, { parser: "markdown" }));
}

const allowed = verifyVajraPaymentFixture(fixtures.allowed).receipt;
const blocked = verifyVajraPaymentFixture(fixtures.blocked).receipt;
const raw = createReceipt({
  network: "fixture",
  program_id: fixtures.rawDrain.programId,
  signature: fixtures.rawDrain.signature,
  explorer_url: `fixture://${fixtures.rawDrain.signature}`,
  agent: fixtures.rawDrain.agent,
  mint: fixtures.rawDrain.mint,
  source: fixtures.rawDrain.source,
  destination: fixtures.rawDrain.destination,
  destination_label: fixtures.rawDrain.destinationLabel,
  attempt_type: "raw_wallet_drain",
  status: "raw_wallet_drained",
  requested_amount: fixtures.rawDrain.requestedAmount,
  actual_inner_transfer_amount: fixtures.rawDrain.actualInnerTransferAmount,
  vault_balance_before: fixtures.rawDrain.vaultBalanceBefore,
  vault_balance_after: fixtures.rawDrain.vaultBalanceAfter,
  vault_delta: "-50000000",
  inner_token_transfers: fixtures.rawDrain.innerTokenTransfers,
  rule_triggered: fixtures.rawDrain.ruleTriggered,
  logs: fixtures.rawDrain.logs,
  raw_transaction_summary: { fixture: true, path: "raw_wallet" },
  verifier: {
    verified: true,
    method: "fixture_raw_wallet_transfer",
    checked_at: new Date().toISOString(),
  },
});

const receipts = [allowed, blocked, raw];
const comparison = {
  generated_at: new Date().toISOString(),
  network: "fixture",
  thesis: "Raw key drains. Vajra survives. Anyone can verify it.",
  raw_wallet: {
    status: "drained",
    loss_amount: fixtures.rawDrain.actualInnerTransferAmount,
    signature: fixtures.rawDrain.signature,
  },
  vajra_allowance_vault: {
    status: "blocked",
    loss_amount: "0",
    avoided_loss: fixtures.blocked.requestedAmount,
    signature: fixtures.blocked.signature,
    rule_triggered: blocked.rule_triggered,
    inner_token_transfers: blocked.inner_token_transfers,
    vault_delta: blocked.vault_delta,
  },
  receipts,
};

await writeJson(path.join(latestDir, "receipts.json"), receipts);
writeFileSync(path.join(latestDir, "receipts.csv"), receiptsToCsv(receipts));
await writeMarkdown(
  path.join(latestDir, "allowed-spend-receipt.md"),
  receiptToMarkdown(allowed),
);
await writeMarkdown(
  path.join(latestDir, "blocked-spend-receipt.md"),
  receiptToMarkdown(blocked),
);
await writeJson(path.join(latestDir, "red-team-comparison.json"), comparison);
await writeMarkdown(
  path.join(latestDir, "red-team-comparison.md"),
  `# Vajra Red Team Comparison

${comparison.thesis}

| Path | Result | Loss | Evidence |
| --- | --- | ---: | --- |
| Raw wallet | Drained | ${comparison.raw_wallet.loss_amount} | ${comparison.raw_wallet.signature} |
| Vajra allowance vault | Blocked | ${comparison.vajra_allowance_vault.loss_amount} | ${comparison.vajra_allowance_vault.signature} |

Vajra avoided loss: ${comparison.vajra_allowance_vault.avoided_loss}

The fixture uses DemoUSD-style SPL-token units. Live devnet proof can be regenerated with the devnet demo scripts when needed.
`,
);

await writeJson(path.join(publicDir, "red-team-comparison.json"), comparison);
await writeJson(path.join(publicDir, "receipts.latest.json"), receipts);
await writeJson(path.join(publicDir, "merchant-verification.example.json"), {
  verified: true,
  expected_destination_check: "passed",
  receipt: allowed,
});

console.log(`Wrote latest proof bundle to ${latestDir}`);
