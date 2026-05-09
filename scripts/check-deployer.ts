import { existsSync, readFileSync } from "fs";
import { Keypair } from "@solana/web3.js";

const keypairPath =
  process.env.DEPLOYER_KEYPAIR ??
  process.env.ANCHOR_WALLET ??
  `${process.env.HOME}/.config/solana/id.json`;

if (!existsSync(keypairPath)) {
  console.error(`Missing deployer keypair: ${keypairPath}`);
  process.exit(1);
}

const keypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(readFileSync(keypairPath, "utf8"))),
);
console.log("Deployer:", keypair.publicKey.toBase58());
console.log("Balance command:");
console.log(`solana balance ${keypair.publicKey.toBase58()} --url devnet`);
