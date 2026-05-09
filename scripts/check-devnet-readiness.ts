import { existsSync, readFileSync } from "fs";
import path from "path";

const root = path.join(__dirname, "..");
const required = [
  "Anchor.toml",
  "programs/vajra/src/lib.rs",
  "target/deploy/vajra.so",
  "target/idl/vajra.json",
  "scripts/setup-demo.ts",
  "scripts/run-demo.ts",
  "scripts/export-proof.ts",
];

function main() {
  let ok = true;
  for (const file of required) {
    const present = existsSync(path.join(root, file));
    console.log(`${present ? "OK" : "MISSING"} ${file}`);
    ok = ok && present;
  }

  const anchor = readFileSync(path.join(root, "Anchor.toml"), "utf8");
  const declare = readFileSync(
    path.join(root, "programs/vajra/src/lib.rs"),
    "utf8",
  );
  const anchorProgramId = anchor.match(/vajra = "([^"]+)"/)?.[1];
  const declaredProgramId = declare.match(/declare_id!\("([^"]+)"\)/)?.[1];
  const idsMatch = anchorProgramId === declaredProgramId;
  console.log(
    `${idsMatch ? "OK" : "MISMATCH"} Anchor.toml program id matches declare_id`,
  );
  ok = ok && idsMatch;

  console.log(
    process.env.SOLANA_RPC
      ? "OK SOLANA_RPC set"
      : "WARN SOLANA_RPC not set; scripts default to devnet",
  );
  console.log("INFO check deployer balance with: solana balance --url devnet");

  if (!ok) process.exit(1);
}

main();
