import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@anchor-lang/core";
import { readFileSync, writeFileSync, existsSync } from "fs";
import * as path from "path";
import IDL from "../target/idl/vajra.json";

export const PROGRAM_ID = new PublicKey(
  "APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD",
);
export const DEMO_STATE_PATH = path.join(__dirname, "../demo-state.json");
export const KEYPAIR_DIR = path.join(__dirname, "../demo-keypairs");

export const RPC = process.env.SOLANA_RPC ?? "https://api.devnet.solana.com";
export const EXPLORER = "https://explorer.solana.com";
export const CLUSTER = "devnet";

export function explorerTx(sig: string) {
  return `${EXPLORER}/tx/${sig}?cluster=${CLUSTER}`;
}

export function explorerAccount(address: string) {
  return `${EXPLORER}/address/${address}?cluster=${CLUSTER}`;
}

export function loadOrCreateKeypair(name: string): Keypair {
  const { mkdirSync } = require("fs");
  mkdirSync(KEYPAIR_DIR, { recursive: true });
  const p = path.join(KEYPAIR_DIR, `${name}.json`);
  if (existsSync(p)) {
    const raw = JSON.parse(readFileSync(p, "utf8"));
    return Keypair.fromSecretKey(new Uint8Array(raw));
  }
  const kp = Keypair.generate();
  writeFileSync(p, JSON.stringify(Array.from(kp.secretKey)));
  return kp;
}

export function loadDemoState(): Record<string, string> {
  if (existsSync(DEMO_STATE_PATH)) {
    return JSON.parse(readFileSync(DEMO_STATE_PATH, "utf8"));
  }
  return {};
}

export function saveDemoState(state: Record<string, string>) {
  writeFileSync(DEMO_STATE_PATH, JSON.stringify(state, null, 2));
}

export function getProgram(provider: AnchorProvider) {
  return new Program(IDL as any, provider);
}

export function policyPDA(
  owner: PublicKey,
  policyId: bigint,
): [PublicKey, number] {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(policyId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vajra_policy"), owner.toBuffer(), idBuf],
    PROGRAM_ID,
  );
}

export function destRulePDA(
  policy: PublicKey,
  destTokenAccount: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vajra_dest"), policy.toBuffer(), destTokenAccount.toBuffer()],
    PROGRAM_ID,
  );
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function formatAmount(amount: bigint, decimals = 6): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const frac = amount % divisor;
  return `${whole}.${frac.toString().padStart(decimals, "0")} DemoUSD`;
}
