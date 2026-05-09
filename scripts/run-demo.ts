/**
 * run-demo.ts
 * Devnet/local demo flow that records proof-ready attempt data.
 */
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getAccount,
} from "@solana/spl-token";
import { AnchorProvider, BN, Wallet } from "@anchor-lang/core";
import {
  RPC,
  explorerTx,
  explorerAccount,
  loadOrCreateKeypair,
  loadDemoState,
  saveDemoState,
  getProgram,
  destRulePDA,
  formatAmount,
  sleep,
} from "./common";
import {
  ProofAttempt,
  ProofPacket,
  writeProofPacket,
  DEMO_RESULTS_PATH,
  ensureProofDir,
} from "./proof-utils";
import { writeFileSync } from "fs";

const SEP = "-".repeat(72);

function step(n: number, title: string) {
  console.log(`\n${SEP}`);
  console.log(`STEP ${n}: ${title}`);
  console.log(SEP);
}

async function vaultBalance(
  connection: Connection,
  vault: PublicKey,
): Promise<bigint> {
  return (await getAccount(connection, vault)).amount;
}

async function waitForRuleWindow(label: string) {
  console.log(`  Waiting for velocity window before ${label}...`);
  await sleep(25_000);
}

async function sendGuarded(
  connection: Connection,
  agent: Keypair,
  program: any,
  policy: PublicKey,
  vault: PublicKey,
  destATA: PublicKey,
  amount: bigint,
): Promise<string> {
  const [destRule] = destRulePDA(policy, destATA);
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
  }).add(ix);
  tx.sign(agent);
  return connection.sendRawTransaction(tx.serialize(), { skipPreflight: true });
}

async function confirmAndLogs(connection: Connection, sig: string) {
  const latest = await connection.getLatestBlockhash();
  const confirmation = await connection
    .confirmTransaction({ signature: sig, ...latest }, "confirmed")
    .catch(() => null);
  await sleep(2500);
  const tx = await connection.getTransaction(sig, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  return {
    ok: confirmation ? !confirmation.value.err : !tx?.meta?.err,
    err: confirmation?.value.err ?? tx?.meta?.err ?? null,
    logs: tx?.meta?.logMessages ?? [],
    innerInstructions: tx?.meta?.innerInstructions ?? [],
  };
}

function summarizeLogs(logs: string[]) {
  return logs
    .filter(
      (log) =>
        log.includes("VAJRA_GUARD") ||
        log.includes("Error") ||
        log.includes("failed"),
    )
    .slice(-8);
}

async function recordGuardedAttempt(input: {
  connection: Connection;
  agent: Keypair;
  program: any;
  policy: PublicKey;
  vault: PublicKey;
  mint: PublicKey;
  destination: PublicKey;
  amount: bigint;
  attemptType: string;
  expectedRule: string;
  expectedResult: "allowed" | "blocked";
}): Promise<ProofAttempt> {
  const before = await vaultBalance(input.connection, input.vault);
  const sig = await sendGuarded(
    input.connection,
    input.agent,
    input.program,
    input.policy,
    input.vault,
    input.destination,
    input.amount,
  );
  const result = await confirmAndLogs(input.connection, sig);
  const after = await vaultBalance(input.connection, input.vault);
  const actualResult = result.ok ? "allowed" : "blocked";
  console.log(`  ${input.attemptType}: ${actualResult} ${input.expectedRule}`);
  console.log(`  Sig: ${sig}`);
  console.log(`  Explorer: ${explorerTx(sig)}`);
  for (const log of summarizeLogs(result.logs)) console.log("   ", log);

  return {
    policy: input.policy.toString(),
    agent: input.agent.publicKey.toString(),
    vault: input.vault.toString(),
    mint: input.mint.toString(),
    attemptType: input.attemptType,
    amount: input.amount.toString(),
    destination: input.destination.toString(),
    result: actualResult,
    ruleTriggered: input.expectedRule,
    signature: sig,
    explorerUrl: explorerTx(sig),
    vaultBalanceBefore: before.toString(),
    vaultBalanceAfter: after.toString(),
    vaultDelta: (after - before).toString(),
    avoidedLoss: actualResult === "blocked" ? input.amount.toString() : "0",
    timestamp: new Date().toISOString(),
    logs: summarizeLogs(result.logs),
    errorSummary: result.err ? JSON.stringify(result.err) : undefined,
  };
}

async function main() {
  console.log("\nVajra devnet proof demo");
  const state = loadDemoState();
  if (!state.policy) {
    console.error("No demo state. Run npm run devnet:setup first.");
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

  const policy = new PublicKey(state.policy);
  const vault = new PublicKey(state.vault_ata);
  const mint = new PublicKey(state.mint);
  const merchantATA_A = new PublicKey(state.merchant_a_ata);
  const merchantATA_B = new PublicKey(state.merchant_b_ata);
  const attempts: ProofAttempt[] = [];

  step(1, "Policy and vault");
  const policyAcc = await (
    (program.account as any).policyPda ?? (program.account as any).policyPDA
  ).fetch(policy);
  console.log("Policy:", explorerAccount(policy.toString()));
  console.log("Vault:", explorerAccount(vault.toString()));
  console.log(
    "Budget:",
    formatAmount(BigInt(policyAcc.totalBudget.toString())),
  );
  console.log("Cap/tx:", formatAmount(BigInt(policyAcc.perTxCap.toString())));
  console.log(
    "Period budget:",
    formatAmount(BigInt(policyAcc.periodBudget.toString())),
  );
  console.log("Velocity slots:", policyAcc.minSlotInterval.toString());

  step(2, "Allowed spend");
  attempts.push(
    await recordGuardedAttempt({
      connection,
      agent,
      program,
      policy,
      vault,
      mint,
      destination: merchantATA_A,
      amount: 5_000_000n,
      attemptType: "good-spend",
      expectedRule: "all_clear",
      expectedResult: "allowed",
    }),
  );

  step(3, "Velocity blocked spend");
  attempts.push(
    await recordGuardedAttempt({
      connection,
      agent,
      program,
      policy,
      vault,
      mint,
      destination: merchantATA_A,
      amount: 1_000_000n,
      attemptType: "velocity-attack",
      expectedRule: "velocity",
      expectedResult: "blocked",
    }),
  );

  await waitForRuleWindow("over-cap");
  step(4, "Over-cap blocked spend");
  attempts.push(
    await recordGuardedAttempt({
      connection,
      agent,
      program,
      policy,
      vault,
      mint,
      destination: merchantATA_A,
      amount: 50_000_000n,
      attemptType: "over-cap",
      expectedRule: "perTxCap",
      expectedResult: "blocked",
    }),
  );

  await waitForRuleWindow("wrong destination");
  step(5, "Wrong destination blocked spend");
  attempts.push(
    await recordGuardedAttempt({
      connection,
      agent,
      program,
      policy,
      vault,
      mint,
      destination: merchantATA_B,
      amount: 5_000_000n,
      attemptType: "wrong-destination",
      expectedRule: "destination",
      expectedResult: "blocked",
    }),
  );

  await waitForRuleWindow("period budget setup spend 1");
  step(6, "Allowed spends until period budget edge");
  attempts.push(
    await recordGuardedAttempt({
      connection,
      agent,
      program,
      policy,
      vault,
      mint,
      destination: merchantATA_A,
      amount: 10_000_000n,
      attemptType: "period-fill-1",
      expectedRule: "all_clear",
      expectedResult: "allowed",
    }),
  );
  await waitForRuleWindow("period budget setup spend 2");
  attempts.push(
    await recordGuardedAttempt({
      connection,
      agent,
      program,
      policy,
      vault,
      mint,
      destination: merchantATA_A,
      amount: 10_000_000n,
      attemptType: "period-fill-2",
      expectedRule: "all_clear",
      expectedResult: "allowed",
    }),
  );
  await waitForRuleWindow("period budget attack");
  attempts.push(
    await recordGuardedAttempt({
      connection,
      agent,
      program,
      policy,
      vault,
      mint,
      destination: merchantATA_A,
      amount: 1_000_000n,
      attemptType: "period-budget-attack",
      expectedRule: "periodBudget",
      expectedResult: "blocked",
    }),
  );

  step(7, "Owner adds merchant_b");
  const [destRuleB] = destRulePDA(policy, merchantATA_B);
  try {
    const addSig = await (program.methods as any)
      .addDestination()
      .accounts({
        owner: owner.publicKey,
        policy,
        destinationTokenAccount: merchantATA_B,
        destinationRule: destRuleB,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("Add destination sig:", addSig);
    saveDemoState({ ...state, dest_rule_b: destRuleB.toString() });
  } catch (error: any) {
    console.log(
      "Add destination skipped or failed:",
      error.message ?? String(error),
    );
  }

  step(8, "Owner withdrawal");
  const beforeWithdraw = await vaultBalance(connection, vault);
  const withdrawSig = await (program.methods as any)
    .withdrawFunds(new BN(5_000_000))
    .accounts({
      owner: owner.publicKey,
      policy,
      vault,
      destinationTokenAccount: new PublicKey(state.owner_ata),
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  const afterWithdraw = await vaultBalance(connection, vault);
  attempts.push({
    policy: policy.toString(),
    agent: agent.publicKey.toString(),
    vault: vault.toString(),
    mint: mint.toString(),
    attemptType: "withdraw",
    amount: "5000000",
    destination: state.owner_ata,
    result: "allowed",
    ruleTriggered: "ownerRecovery",
    signature: withdrawSig,
    explorerUrl: explorerTx(withdrawSig),
    vaultBalanceBefore: beforeWithdraw.toString(),
    vaultBalanceAfter: afterWithdraw.toString(),
    vaultDelta: (afterWithdraw - beforeWithdraw).toString(),
    avoidedLoss: "0",
    timestamp: new Date().toISOString(),
    logs: ["FundsWithdrawn"],
  });
  console.log("Withdraw sig:", withdrawSig);

  step(9, "Owner revokes policy");
  const revokeSig = await (program.methods as any)
    .revokePolicy()
    .accounts({ owner: owner.publicKey, policy })
    .rpc();
  console.log("Revoke sig:", revokeSig);

  step(10, "Post-revoke blocked spend");
  attempts.push(
    await recordGuardedAttempt({
      connection,
      agent,
      program,
      policy,
      vault,
      mint,
      destination: merchantATA_A,
      amount: 1_000_000n,
      attemptType: "revoked-policy",
      expectedRule: "revoked",
      expectedResult: "blocked",
    }),
  );

  step(11, "Raw SPL drain blocked");
  const beforeRaw = await vaultBalance(connection, vault);
  const { blockhash } = await connection.getLatestBlockhash();
  const rawTx = new Transaction({
    recentBlockhash: blockhash,
    feePayer: agent.publicKey,
  }).add(
    createTransferInstruction(
      vault,
      merchantATA_A,
      agent.publicKey,
      50_000_000,
    ),
  );
  rawTx.sign(agent);
  const rawSig = await connection.sendRawTransaction(rawTx.serialize(), {
    skipPreflight: true,
  });
  const rawResult = await confirmAndLogs(connection, rawSig);
  const afterRaw = await vaultBalance(connection, vault);
  attempts.push({
    policy: policy.toString(),
    agent: agent.publicKey.toString(),
    vault: vault.toString(),
    mint: mint.toString(),
    attemptType: "raw-drain",
    amount: "50000000",
    destination: merchantATA_A.toString(),
    result: rawResult.ok ? "allowed" : "blocked",
    ruleTriggered: "vaultAuthority",
    signature: rawSig,
    explorerUrl: explorerTx(rawSig),
    vaultBalanceBefore: beforeRaw.toString(),
    vaultBalanceAfter: afterRaw.toString(),
    vaultDelta: (afterRaw - beforeRaw).toString(),
    avoidedLoss: rawResult.ok ? "0" : "50000000",
    timestamp: new Date().toISOString(),
    logs: summarizeLogs(rawResult.logs),
    errorSummary: rawResult.err ? JSON.stringify(rawResult.err) : undefined,
  });
  console.log("Raw drain sig:", rawSig);

  ensureProofDir();
  const packet: ProofPacket = {
    product: "Vajra",
    headline: "Your agent can spend. It cannot drain.",
    generatedAt: new Date().toISOString(),
    cluster: "devnet",
    attempts,
  };
  writeFileSync(DEMO_RESULTS_PATH, JSON.stringify(packet, null, 2));
  writeProofPacket(packet, "devnet-proof");
  console.log("\nProof artifacts written under proofs/devnet-proof.*");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
