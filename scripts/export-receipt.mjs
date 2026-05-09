import { Connection } from "@solana/web3.js";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { receiptToMarkdown } from "../packages/sdk/dist/src/receipt.js";
import {
  verifyVajraPayment,
  verifyVajraPaymentFixture,
} from "../packages/sdk/dist/src/verify.js";
import { fixtures } from "./proof-fixtures.mjs";

const signature = process.argv[2];
if (!signature || signature === "--help") {
  console.error(
    "Usage: npm run receipt:tx -- <signature|--fixture allowed|blocked|rawDrain|nonVajra>",
  );
  process.exit(1);
}

let result;
let receiptName = signature;
if (signature === "--fixture") {
  const fixtureName = process.argv[3] ?? "allowed";
  const fixture = fixtures[fixtureName];
  if (!fixture) {
    console.error(`Unknown fixture: ${fixtureName}`);
    process.exit(1);
  }
  result = verifyVajraPaymentFixture(fixture);
  receiptName = fixture.signature;
} else {
  const rpc = process.env.SOLANA_RPC ?? "https://api.devnet.solana.com";
  const network = process.env.SOLANA_CLUSTER ?? "devnet";
  result = await verifyVajraPayment(
    new Connection(rpc, "confirmed"),
    signature,
    {
      network,
    },
  );
}
const dir = path.join(process.cwd(), "proofs/latest");
mkdirSync(dir, { recursive: true });
const base = path.join(dir, `receipt-${receiptName.slice(0, 24)}`);
writeFileSync(`${base}.json`, JSON.stringify(result.receipt, null, 2));
writeFileSync(`${base}.md`, receiptToMarkdown(result.receipt));
console.log(`Wrote ${base}.json and ${base}.md`);
