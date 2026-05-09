/**
 * reset-demo.ts
 * Creates a fresh policy with a new policy_id (no need to close old accounts).
 * Keeps the same keypairs and mint.
 */
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { AnchorProvider, BN, Program, Wallet } from "@anchor-lang/core";
import {
  RPC,
  explorerTx,
  loadOrCreateKeypair,
  loadDemoState,
  saveDemoState,
  getProgram,
  policyPDA,
  destRulePDA,
} from "./common";

async function main() {
  console.log("=== Vajra Demo Reset ===");

  const state = loadDemoState();
  if (!state.mint) {
    console.error("No existing state. Run setup-demo.ts instead.");
    process.exit(1);
  }

  const connection = new Connection(RPC, "confirmed");
  const owner = loadOrCreateKeypair("owner");
  const agent = loadOrCreateKeypair("agent");
  const merchantA = loadOrCreateKeypair("merchant_a");
  const merchantB = loadOrCreateKeypair("merchant_b");

  const provider = new AnchorProvider(connection, new Wallet(owner), {
    commitment: "confirmed",
  });
  const program = getProgram(provider);

  const mint = new PublicKey(state.mint);

  // Increment policy_id
  const oldId = BigInt(state.policy_id ?? "0");
  const policyId = oldId + 1n;
  const [policy] = policyPDA(owner.publicKey, policyId);

  console.log(`New policy_id: ${policyId}`);
  console.log(`Policy PDA:    ${policy.toString()}`);

  // Ensure merchant ATAs exist
  const merchantATA_A = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    mint,
    merchantA.publicKey,
  );
  const merchantATA_B = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    mint,
    merchantB.publicKey,
  );
  const ownerATA = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    mint,
    owner.publicKey,
  );

  // Mint 200 more DemoUSD to owner
  console.log("\nMinting fresh DemoUSD...");
  const mintSig = await mintTo(
    connection,
    owner,
    mint,
    ownerATA.address,
    owner.publicKey,
    200 * 1_000_000,
  );
  console.log("  ", explorerTx(mintSig));

  // Create new policy
  const slot = BigInt(await connection.getSlot());
  const expirySlot = slot + 5_000_000n;

  console.log("\nCreating new policy...");
  const createSig = await (program.methods as any)
    .createPolicy(
      new BN(policyId.toString()),
      agent.publicKey,
      mint,
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
  console.log("  ", explorerTx(createSig));

  // Fund vault
  const vaultATA = getAssociatedTokenAddressSync(mint, policy, true);
  console.log("\nFunding vault...");
  const fundSig = await (program.methods as any)
    .fundVault(new BN(100 * 1_000_000))
    .accounts({
      funder: owner.publicKey,
      funderTokenAccount: ownerATA.address,
      policy,
      vault: vaultATA,
      allowedMint: mint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log("  ", explorerTx(fundSig));

  // Add merchant A
  const [destRuleA] = destRulePDA(policy, merchantATA_A.address);
  console.log("\nAdding merchant_a...");
  const addSig = await (program.methods as any)
    .addDestination()
    .accounts({
      owner: owner.publicKey,
      policy,
      destinationTokenAccount: merchantATA_A.address,
      destinationRule: destRuleA,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log("  ", explorerTx(addSig));

  // Save
  const newState = {
    ...state,
    policy_id: policyId.toString(),
    policy: policy.toString(),
    vault_ata: vaultATA.toString(),
    dest_rule_a: destRuleA.toString(),
    dest_rule_b: undefined,
    expiry_slot: expirySlot.toString(),
  };
  saveDemoState(newState);

  console.log("\n✅ Reset complete. New policy_id:", policyId.toString());
}

main().catch(console.error);
