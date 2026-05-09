import http from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { policyTemplates, explainError } from "@vinaystwt/vajra-sdk";

async function formatJson(value) {
  const json = JSON.stringify(value, null, 2);
  try {
    const { format } = await import("prettier");
    return await format(json, { parser: "json" });
  } catch {
    return `${json}\n`;
  }
}

const PORT = Number(process.env.PORT ?? 4020);
const merchant = "ProtectedApiMerchantTokenAccount111111111";
let vaultBalance = 100_000_000;
let revoked = false;
const attempts = [];

function protectedApi() {
  return http.createServer((req, res) => {
    if (req.url !== "/data") {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    const paid = req.headers["x-vajra-payment"];
    if (!paid) {
      res.writeHead(402, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          type: "payment_required",
          amount: "2000000",
          mint: "DemoUSD",
          destination: merchant,
          policyTemplate: "x402ApiBuyer",
        }),
      );
      return;
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        data: "protected payload unlocked by Vajra payment",
      }),
    );
  });
}

function spendThroughVajra({ attemptType, amount, destination }) {
  const template = policyTemplates.x402ApiBuyer;
  const perTxCap = BigInt(template.fields.perTxCap.toString());
  const before = vaultBalance;
  let result = "allowed";
  let ruleTriggered = "all_clear";
  let errorSummary;

  if (revoked) {
    result = "blocked";
    ruleTriggered = "revoked";
  } else if (destination !== merchant) {
    result = "blocked";
    ruleTriggered = "destination";
  } else if (BigInt(amount) > perTxCap) {
    result = "blocked";
    ruleTriggered = "perTxCap";
  }

  if (result === "allowed") {
    vaultBalance -= Number(amount);
  } else {
    errorSummary = explainError(
      ruleTriggered === "perTxCap" ? "PerTxCapExceeded" : ruleTriggered,
    ).message;
  }

  const after = vaultBalance;
  const proof = {
    policy: "X402PolicyPDA111111111111111111111111111111",
    agent: "X402BuyerAgent11111111111111111111111111111",
    vault: "X402Vault111111111111111111111111111111111",
    mint: "DemoUSD111111111111111111111111111111111111",
    attemptType,
    amount: amount.toString(),
    destination,
    result,
    ruleTriggered,
    signature: `local-${attemptType}-${result}`,
    explorerUrl: "",
    vaultBalanceBefore: before.toString(),
    vaultBalanceAfter: after.toString(),
    vaultDelta: (after - before).toString(),
    avoidedLoss: result === "blocked" ? amount.toString() : "0",
    timestamp: new Date().toISOString(),
    logs: [`HTTP 402`, `VAJRA_GUARD:${attemptType}:${ruleTriggered}`],
    errorSummary,
  };
  attempts.push(proof);
  return proof;
}

async function requestProtectedData(paymentHeader) {
  const response = await fetch(`http://127.0.0.1:${PORT}/data`, {
    headers: paymentHeader ? { "x-vajra-payment": paymentHeader } : {},
  });
  return { status: response.status, body: await response.json() };
}

async function main() {
  const server = protectedApi();
  await new Promise((resolve) => server.listen(PORT, resolve));

  try {
    const first = await requestProtectedData();
    console.log("API response:", first.status, first.body);

    const allowed = spendThroughVajra({
      attemptType: "x402-pay",
      amount: 2_000_000,
      destination: merchant,
    });
    console.log("Vajra payment:", allowed.result, allowed.ruleTriggered);
    const unlocked = await requestProtectedData(allowed.signature);
    console.log("Unlocked API:", unlocked.status, unlocked.body);

    const overBudget = spendThroughVajra({
      attemptType: "x402-pay-over-budget",
      amount: 50_000_000,
      destination: merchant,
    });
    console.log(
      "Blocked over-budget payment:",
      overBudget.result,
      overBudget.ruleTriggered,
    );

    const wrongDestination = spendThroughVajra({
      attemptType: "x402-pay-wrong-destination",
      amount: 2_000_000,
      destination: "WrongMerchantTokenAccount111111111111111111",
    });
    console.log(
      "Blocked wrong destination:",
      wrongDestination.result,
      wrongDestination.ruleTriggered,
    );

    revoked = true;
    const revokedAttempt = spendThroughVajra({
      attemptType: "x402-pay-revoked",
      amount: 2_000_000,
      destination: merchant,
    });
    console.log(
      "Blocked revoked policy:",
      revokedAttempt.result,
      revokedAttempt.ruleTriggered,
    );

    const packet = {
      product: "Vajra",
      headline: "Your agent can spend. It cannot drain.",
      generatedAt: new Date().toISOString(),
      cluster: "local-402-style",
      attempts,
    };
    mkdirSync("proofs", { recursive: true });
    writeFileSync("proofs/x402-vajra-proof.json", await formatJson(packet));
    console.log("Proof written to proofs/x402-vajra-proof.json");
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
