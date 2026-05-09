import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { existsSync, readFileSync } from "fs";
import { VajraClient } from "@vinaystwt/vajra-sdk";

export interface McpRuntimeConfig {
  rpcUrl: string;
  cluster: "localnet" | "devnet" | "testnet" | "mainnet-beta";
  keypairPath?: string;
}

export function loadConfig(): McpRuntimeConfig {
  return {
    rpcUrl: process.env.SOLANA_RPC ?? "http://127.0.0.1:8899",
    cluster:
      (process.env.SOLANA_CLUSTER as McpRuntimeConfig["cluster"]) ?? "localnet",
    keypairPath: process.env.VAJRA_KEYPAIR,
  };
}

export function loadKeypair(path?: string): Keypair {
  if (path && existsSync(path)) {
    return Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(readFileSync(path, "utf8"))),
    );
  }
  return Keypair.generate();
}

export function createClient(config = loadConfig()): VajraClient {
  const connection = new Connection(config.rpcUrl, "confirmed");
  const payer = loadKeypair(config.keypairPath);
  return new VajraClient({
    connection,
    wallet: payer,
    cluster: config.cluster,
  });
}

export function pubkey(value: string): PublicKey {
  return new PublicKey(value);
}
