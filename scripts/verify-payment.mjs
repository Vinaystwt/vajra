import { Connection } from "@solana/web3.js";
import {
  verifyVajraPayment,
  verifyVajraPaymentFixture,
} from "../packages/sdk/dist/src/verify.js";
import { fixtures } from "./proof-fixtures.mjs";

const signature = process.argv[2];
if (!signature || signature === "--help") {
  console.error(
    "Usage: npm run verify:tx -- <signature|--fixture allowed|blocked|rawDrain|nonVajra>",
  );
  process.exit(1);
}

if (signature === "--fixture") {
  const fixtureName = process.argv[3] ?? "allowed";
  const fixture = fixtures[fixtureName];
  if (!fixture) {
    console.error(`Unknown fixture: ${fixtureName}`);
    process.exit(1);
  }
  console.log(JSON.stringify(verifyVajraPaymentFixture(fixture), null, 2));
  process.exit(0);
}

const rpc = process.env.SOLANA_RPC ?? "https://api.devnet.solana.com";
const network = process.env.SOLANA_CLUSTER ?? "devnet";
const result = await verifyVajraPayment(
  new Connection(rpc, "confirmed"),
  signature,
  {
    network,
  },
);

console.log(JSON.stringify(result, null, 2));
if (!result.verified) process.exitCode = 2;
