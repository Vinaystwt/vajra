/**
 * agent-spend.ts
 * Simulates an agent sending a guarded transfer.
 * Uses skipPreflight so blocked transactions land onchain.
 *
 * Usage:
 *   ts-node scripts/agent-spend.ts <amount_usd> <merchant_a|merchant_b>
 *   ts-node scripts/agent-spend.ts 5 merchant_a
 *   ts-node scripts/agent-spend.ts 50 merchant_a   # over cap — will fail onchain
 */
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AnchorProvider, BN, Program, Wallet } from "@anchor-lang/core";
import {
  RPC,
  CLUSTER,
  explorerTx,
  loadOrCreateKeypair,
  loadDemoState,
  getProgram,
  policyPDA,
  destRulePDA,
  formatAmount,
} from "./common";

async function main() {
  const amountArg = process.argv[2];
  const destArg = process.argv[3];

  if (!amountArg || !destArg) {
    console.error(
      "Usage: ts-node scripts/agent-spend.ts <amount_usd> <merchant_a|merchant_b>",
    );
    process.exit(1);
  }

  const amountUSD = parseFloat(amountArg);
  const amount = BigInt(Math.round(amountUSD * 1_000_000));

  const state = loadDemoState();
  if (!state.policy) {
    console.error("No demo state found. Run setup-demo.ts first.");
    process.exit(1);
  }

  const policy = new PublicKey(state.policy);
  const vault = new PublicKey(state.vault_ata);
  const mint = new PublicKey(state.mint);

  let destATA: PublicKey;
  if (destArg === "merchant_a") {
    destATA = new PublicKey(state.merchant_a_ata);
  } else if (destArg === "merchant_b") {
    destATA = new PublicKey(state.merchant_b_ata);
  } else {
    console.error("Destination must be merchant_a or merchant_b");
    process.exit(1);
  }

  const [destRule] = destRulePDA(policy, destATA);

  const agent = loadOrCreateKeypair("agent");
  const connection = new Connection(RPC, "confirmed");

  const provider = new AnchorProvider(connection, new Wallet(agent), {
    commitment: "confirmed",
    skipPreflight: true,
  });
  const program = getProgram(provider);

  console.log(`\n=== Agent Spend ===`);
  console.log(`Amount:      ${formatAmount(amount)}`);
  console.log(`Destination: ${destArg} (${destATA.toString()})`);
  console.log(`Policy:      ${policy.toString()}`);
  console.log(`Agent:       ${agent.publicKey.toString()}`);

  // Build transaction manually for skipPreflight support
  const ix = await (program.methods as any)
    .executeGuardedTransfer(new BN(amount.toString()))
    .accounts({
      delegatedSigner: agent.publicKey,
      policy,
      vault,
      destinationTokenAccount: destATA,
      destinationRule: destRule,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction({
    recentBlockhash: blockhash,
    feePayer: agent.publicKey,
  });
  tx.add(ix);
  tx.sign(agent);

  const rawTx = tx.serialize();

  console.log("\nSending transaction (skipPreflight=true)...");
  let sig: string;
  try {
    sig = await connection.sendRawTransaction(rawTx, { skipPreflight: true });
    console.log(`\nSignature: ${sig}`);
    console.log(`Explorer:  ${explorerTx(sig)}`);
  } catch (e: any) {
    console.error("Failed to send:", e.message);
    return;
  }

  // Confirm and fetch logs
  console.log("\nWaiting for confirmation...");
  try {
    const confirmation = await connection.confirmTransaction(
      {
        signature: sig,
        blockhash: (await connection.getLatestBlockhash()).blockhash,
        lastValidBlockHeight: (await connection.getLatestBlockhash())
          .lastValidBlockHeight,
      },
      "confirmed",
    );

    if (confirmation.value.err) {
      console.log(`\n❌ BLOCKED — Transaction failed`);
      console.log(`Error: ${JSON.stringify(confirmation.value.err)}`);
    } else {
      console.log(`\n✅ ALLOWED — Transfer succeeded`);
    }
  } catch (e: any) {
    console.log(`Transaction may have failed: ${e.message}`);
  }

  // Fetch logs
  await new Promise((r) => setTimeout(r, 2000));
  const txDetails = await connection.getTransaction(sig, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });

  if (txDetails?.meta?.logMessages) {
    console.log("\n=== Program Logs ===");
    for (const log of txDetails.meta.logMessages) {
      if (
        log.includes("VAJRA_GUARD") ||
        log.includes("Error") ||
        log.includes("failed")
      ) {
        console.log(" ", log);
      }
    }

    // Find the guard step that failed
    const guardLogs = txDetails.meta.logMessages.filter((l) =>
      l.includes("VAJRA_GUARD"),
    );
    if (guardLogs.length > 0) {
      const lastGuard = guardLogs[guardLogs.length - 1];
      console.log(`\nLast guard check: ${lastGuard}`);
    }

    // Check for Vajra errors
    for (const log of txDetails.meta.logMessages) {
      if (log.includes("custom program error") || log.includes("AnchorError")) {
        console.log(`\nVajra Error: ${log}`);
      }
    }
  }

  console.log(`\nExplorer: ${explorerTx(sig)}`);
}

main().catch(console.error);
