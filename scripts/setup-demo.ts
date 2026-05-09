/**
 * setup-demo.ts
 * Creates all demo state: DemoUSD mint, ATAs, policy, vault, merchant allowlist.
 * Run once. Subsequent runs load existing keypairs (deterministic).
 */
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { AnchorProvider, BN, Program, Wallet } from "@anchor-lang/core";
import {
  PROGRAM_ID,
  RPC,
  CLUSTER,
  explorerTx,
  explorerAccount,
  loadOrCreateKeypair,
  loadDemoState,
  saveDemoState,
  getProgram,
  policyPDA,
  destRulePDA,
} from "./common";

async function main() {
  console.log("=== Vajra Demo Setup ===");
  console.log(`RPC: ${RPC}`);

  const connection = new Connection(RPC, "confirmed");

  // Load or create keypairs
  const owner = loadOrCreateKeypair("owner");
  const agent = loadOrCreateKeypair("agent");
  const merchantA = loadOrCreateKeypair("merchant_a");
  const merchantB = loadOrCreateKeypair("merchant_b");

  console.log("\nKeypairs:");
  console.log("  owner:      ", owner.publicKey.toString());
  console.log("  agent:      ", agent.publicKey.toString());
  console.log("  merchant_a: ", merchantA.publicKey.toString());
  console.log("  merchant_b: ", merchantB.publicKey.toString());

  // Airdrop if balance too low
  for (const [name, kp] of [
    ["owner", owner],
    ["agent", agent],
  ] as [string, Keypair][]) {
    const bal = await connection.getBalance(kp.publicKey);
    if (bal < 1_000_000_000) {
      console.log(`\nAirdropping 2 SOL to ${name}...`);
      const sig = await connection.requestAirdrop(kp.publicKey, 2_000_000_000);
      await connection.confirmTransaction(sig);
      console.log("  ", explorerTx(sig));
    } else {
      console.log(`\n${name} balance: ${(bal / 1e9).toFixed(3)} SOL`);
    }
  }

  const provider = new AnchorProvider(connection, new Wallet(owner), {
    commitment: "confirmed",
  });
  const program = getProgram(provider);

  // Load existing state
  let state = loadDemoState();

  // Create DemoUSD mint
  let mintPubkey: PublicKey;
  if (state.mint) {
    mintPubkey = new PublicKey(state.mint);
    console.log("\nDemoUSD mint (existing):", mintPubkey.toString());
  } else {
    const mintKp = loadOrCreateKeypair("demo_usd_mint");
    console.log("\nCreating DemoUSD mint...");
    mintPubkey = await createMint(
      connection,
      owner,
      owner.publicKey,
      owner.publicKey,
      6,
      mintKp,
    );
    console.log("  mint:", mintPubkey.toString());
    console.log("  ", explorerAccount(mintPubkey.toString()));
    state.mint = mintPubkey.toString();
  }

  // Get/create ATAs
  console.log("\nSetting up token accounts...");

  const ownerATA = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    mintPubkey,
    owner.publicKey,
  );
  console.log("  owner ATA:      ", ownerATA.address.toString());

  const merchantATA_A = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    mintPubkey,
    merchantA.publicKey,
  );
  console.log("  merchant_a ATA: ", merchantATA_A.address.toString());

  const merchantATA_B = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    mintPubkey,
    merchantB.publicKey,
  );
  console.log("  merchant_b ATA: ", merchantATA_B.address.toString());

  // Mint 1000 DemoUSD to owner
  console.log("\nMinting 1000 DemoUSD to owner...");
  const mintSig = await mintTo(
    connection,
    owner,
    mintPubkey,
    ownerATA.address,
    owner.publicKey,
    1_000 * 1_000_000,
  );
  console.log("  ", explorerTx(mintSig));

  // Create policy (use incremental ID to avoid conflicts on reruns)
  const existingId = BigInt(state.policy_id ?? "0");
  const policyId = existingId + 1n;
  const [policy] = policyPDA(owner.publicKey, policyId);

  console.log(`\nCreating policy (id=${policyId})...`);
  console.log("  policy PDA:", policy.toString());

  // Expiry: current slot + 5,000,000 slots (~70 days)
  const slot = BigInt(await connection.getSlot());
  const expirySlot = slot + 5_000_000n;

  const createPolicySig = await (program.methods as any)
    .createPolicy(
      new BN(policyId.toString()),
      agent.publicKey,
      mintPubkey,
      new BN(100 * 1_000_000),
      new BN(10 * 1_000_000),
      new BN(expirySlot.toString()),
      new BN(25 * 1_000_000),
      new BN(10_000),
      new BN(50),
      0,
      owner.publicKey,
    )
    .accounts({
      owner: owner.publicKey,
      policy,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("  ", explorerTx(createPolicySig));

  // Fund vault
  const vaultATA = getAssociatedTokenAddressSync(mintPubkey, policy, true);
  console.log("\nFunding vault with 100 DemoUSD...");
  console.log("  vault ATA:", vaultATA.toString());

  const fundSig = await (program.methods as any)
    .fundVault(new BN(100 * 1_000_000))
    .accounts({
      funder: owner.publicKey,
      funderTokenAccount: ownerATA.address,
      policy,
      vault: vaultATA,
      allowedMint: mintPubkey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("  ", explorerTx(fundSig));

  // Add merchant A as allowed destination
  const [destRuleA] = destRulePDA(policy, merchantATA_A.address);
  console.log("\nAdding merchant_a as allowed destination...");
  const addDestSig = await (program.methods as any)
    .addDestination()
    .accounts({
      owner: owner.publicKey,
      policy,
      destinationTokenAccount: merchantATA_A.address,
      destinationRule: destRuleA,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("  dest_rule_a:", destRuleA.toString());
  console.log("  ", explorerTx(addDestSig));

  // Save state
  state = {
    ...state,
    mint: mintPubkey.toString(),
    owner: owner.publicKey.toString(),
    agent: agent.publicKey.toString(),
    merchant_a: merchantA.publicKey.toString(),
    merchant_b: merchantB.publicKey.toString(),
    owner_ata: ownerATA.address.toString(),
    merchant_a_ata: merchantATA_A.address.toString(),
    merchant_b_ata: merchantATA_B.address.toString(),
    policy_id: policyId.toString(),
    policy: policy.toString(),
    vault_ata: vaultATA.toString(),
    dest_rule_a: destRuleA.toString(),
    expiry_slot: expirySlot.toString(),
  };
  saveDemoState(state);

  console.log("\n=== Setup complete ===");
  console.log("Saved to demo-state.json");
  console.log("\nKey addresses:");
  console.log("  Program:   ", explorerAccount(PROGRAM_ID.toString()));
  console.log("  Policy:    ", explorerAccount(policy.toString()));
  console.log("  Vault:     ", explorerAccount(vaultATA.toString()));
}

main().catch(console.error);
