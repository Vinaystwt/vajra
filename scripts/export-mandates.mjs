import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { format } from "prettier";
import {
  getMandate,
  listMandates,
  mandateToPolicyConfig,
} from "../packages/sdk/dist/src/mandates.js";

const mandates = listMandates().map((mandate) => ({
  ...mandate,
  policy_config: mandateToPolicyConfig(mandate),
}));
const root = process.cwd();
mkdirSync(path.join(root, "mandates"), { recursive: true });
mkdirSync(path.join(root, "app/public"), { recursive: true });

async function writeJson(filePath, value) {
  writeFileSync(
    filePath,
    await format(JSON.stringify(value), { parser: "json" }),
  );
}

const filenameById = {
  "stablecoin-agent": "stablecoin-agent-mandate.json",
  "api-buyer": "api-buyer-mandate.json",
  "defi-bot": "defi-bot-mandate.json",
  "dao-ops": "dao-ops-mandate.json",
  "market-maker": "market-maker-mandate.json",
  "payroll-ops": "payroll-ops-mandate.json",
};

for (const [id, filename] of Object.entries(filenameById)) {
  const mandate = getMandate(id);
  if (mandate) {
    await writeJson(path.join(root, "mandates", filename), {
      ...mandate,
      policy_config: mandateToPolicyConfig(mandate),
    });
  }
}

await writeJson(path.join(root, "app/public/agent-mandates.json"), mandates);
await writeJson(
  path.join(root, "app/public/stablecoin-mandate.example.json"),
  mandates.find((mandate) => mandate.id === "stablecoin-agent"),
);

console.log(`Exported ${mandates.length} mandates.`);
