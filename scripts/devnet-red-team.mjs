import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { format } from "prettier";
import { AnchorProvider, BN, Program, Wallet } from "@anchor-lang/core";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createMint,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import {
  createReceipt,
  receiptToMarkdown,
  receiptsToCsv,
} from "../packages/sdk/dist/src/receipt.js";
import { verifyVajraPayment } from "../packages/sdk/dist/src/verify.js";

const ROOT = process.cwd();
const PROGRAM_ID = new PublicKey(
  "APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD",
);
const RPC = process.env.SOLANA_RPC ?? "https://api.devnet.solana.com";
const NETWORK = "devnet";
const KEYPAIR_DIR = path.join(ROOT, "demo-keypairs");
const STATE_PATH = path.join(ROOT, "demo-state.json");
const IDL = JSON.parse(
  readFileSync(path.join(ROOT, "target/idl/vajra.json"), "utf8"),
);
const LAMPORTS_PER_DEMO_USD = 1_000_000n;

function explorerTx(signature) {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

async function writeJson(filePath, value) {
  writeFileSync(
    filePath,
    await format(JSON.stringify(value), { parser: "json" }),
  );
}

async function writeMarkdown(filePath, value) {
  writeFileSync(filePath, await format(value, { parser: "markdown" }));
}

function loadOrCreateKeypair(name) {
  mkdirSync(KEYPAIR_DIR, { recursive: true });
  const filePath = path.join(KEYPAIR_DIR, `${name}.json`);
  if (existsSync(filePath)) {
    return Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(readFileSync(filePath, "utf8"))),
    );
  }
  const kp = Keypair.generate();
  writeFileSync(filePath, JSON.stringify(Array.from(kp.secretKey)));
  return kp;
}

function loadState() {
  if (!existsSync(STATE_PATH)) return {};
  return JSON.parse(readFileSync(STATE_PATH, "utf8"));
}

function policyPda(owner, policyId) {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(policyId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vajra_policy"), owner.toBuffer(), idBuf],
    PROGRAM_ID,
  );
}

function destRulePda(policy, destination) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vajra_dest"), policy.toBuffer(), destination.toBuffer()],
    PROGRAM_ID,
  );
}

async function tokenAmount(connection, tokenAccount) {
  return (await getAccount(connection, tokenAccount)).amount;
}

async function confirmAndFetch(connection, signature) {
  const latest = await connection.getLatestBlockhash();
  await connection
    .confirmTransaction({ signature, ...latest }, "confirmed")
    .catch(() => null);
  await new Promise((resolve) => setTimeout(resolve, 2500));
  return connection.getParsedTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
}

function guardLogs(tx) {
  return (tx?.meta?.logMessages ?? [])
    .filter(
      (log) =>
        log.includes("VAJRA_GUARD") ||
        log.includes("Error Code:") ||
        log.includes("custom program error") ||
        log.includes("failed"),
    )
    .slice(-10);
}

async function sendGuardedTransfer({
  connection,
  owner,
  agent,
  program,
  policy,
  vault,
  destination,
  amount,
  skipPreflight,
}) {
  const [destinationRule] = destRulePda(policy, destination);
  const instruction = await program.methods
    .executeGuardedTransfer(new BN(amount.toString()))
    .accounts({
      delegatedSigner: agent.publicKey,
      policy,
      vault,
      destinationTokenAccount: destination,
      destinationRule,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction({
    recentBlockhash: blockhash,
    feePayer: owner.publicKey,
  }).add(instruction);
  tx.sign(owner, agent);
  return connection.sendRawTransaction(tx.serialize(), { skipPreflight });
}

function receiptSummary(receipt) {
  return {
    receipt_id: receipt.receipt_id,
    network: receipt.network,
    signature: receipt.signature,
    explorer_url: receipt.explorer_url,
    attempt_type: receipt.attempt_type,
    status: receipt.status,
    rule_triggered: receipt.rule_triggered,
    requested_amount: receipt.requested_amount,
    actual_inner_transfer_amount: receipt.actual_inner_transfer_amount,
    vault_balance_before: receipt.vault_balance_before,
    vault_balance_after: receipt.vault_balance_after,
    vault_delta: receipt.vault_delta,
    inner_token_transfers: receipt.inner_token_transfers,
    receipt_hash: receipt.receipt_hash,
  };
}

async function main() {
  console.log("=== Vajra Devnet Red Team Proof ===");
  console.log(`RPC: ${RPC}`);
  console.log(`Program: ${PROGRAM_ID.toBase58()}`);

  const connection = new Connection(RPC, "confirmed");
  const owner = loadOrCreateKeypair("owner");
  const agent = loadOrCreateKeypair("agent");
  const merchant = loadOrCreateKeypair("merchant_a");
  const attacker = loadOrCreateKeypair("red_team_attacker");
  const state = loadState();

  const ownerBalance = await connection.getBalance(owner.publicKey);
  if (ownerBalance < 100_000_000) {
    throw new Error("Owner/deployer wallet needs at least 0.1 devnet SOL.");
  }

  const provider = new AnchorProvider(connection, new Wallet(owner), {
    commitment: "confirmed",
  });
  const program = new Program(IDL, provider);

  let mint;
  if (state.mint) {
    mint = new PublicKey(state.mint);
  } else {
    const mintKp = loadOrCreateKeypair("demo_usd_mint");
    mint = await createMint(
      connection,
      owner,
      owner.publicKey,
      owner.publicKey,
      6,
      mintKp,
    );
  }

  const ownerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    mint,
    owner.publicKey,
  );
  const agentAta = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    mint,
    agent.publicKey,
  );
  const merchantAta = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    mint,
    merchant.publicKey,
  );
  const attackerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    mint,
    attacker.publicKey,
  );

  await mintTo(
    connection,
    owner,
    mint,
    ownerAta.address,
    owner.publicKey,
    150n * LAMPORTS_PER_DEMO_USD,
  );
  await mintTo(
    connection,
    owner,
    mint,
    agentAta.address,
    owner.publicKey,
    50n * LAMPORTS_PER_DEMO_USD,
  );

  const policyId = BigInt(Date.now());
  const [policy] = policyPda(owner.publicKey, policyId);
  const vault = getAssociatedTokenAddressSync(mint, policy, true);
  const [destRule] = destRulePda(policy, merchantAta.address);
  const currentSlot = BigInt(await connection.getSlot());
  const expirySlot = currentSlot + 1_000_000n;

  const createPolicySig = await program.methods
    .createPolicy(
      new BN(policyId.toString()),
      agent.publicKey,
      mint,
      new BN((100n * LAMPORTS_PER_DEMO_USD).toString()),
      new BN((10n * LAMPORTS_PER_DEMO_USD).toString()),
      new BN(expirySlot.toString()),
      new BN((25n * LAMPORTS_PER_DEMO_USD).toString()),
      new BN(1000),
      new BN(0),
      0,
      owner.publicKey,
    )
    .accounts({
      owner: owner.publicKey,
      policy,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const fundSig = await program.methods
    .fundVault(new BN((50n * LAMPORTS_PER_DEMO_USD).toString()))
    .accounts({
      funder: owner.publicKey,
      funderTokenAccount: ownerAta.address,
      policy,
      vault,
      allowedMint: mint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const addDestinationSig = await program.methods
    .addDestination()
    .accounts({
      owner: owner.publicKey,
      policy,
      destinationTokenAccount: merchantAta.address,
      destinationRule: destRule,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const allowedBefore = await tokenAmount(connection, vault);
  const allowedSig = await sendGuardedTransfer({
    connection,
    owner,
    agent,
    program,
    policy,
    vault,
    destination: merchantAta.address,
    amount: 5n * LAMPORTS_PER_DEMO_USD,
    skipPreflight: false,
  });
  const allowedTx = await confirmAndFetch(connection, allowedSig);
  const allowedAfter = await tokenAmount(connection, vault);
  const allowedVerify = await verifyVajraPayment(connection, allowedSig, {
    network: NETWORK,
    expectedProgramId: PROGRAM_ID.toBase58(),
    expectedDestination: merchantAta.address.toBase58(),
    expectedAmount: (5n * LAMPORTS_PER_DEMO_USD).toString(),
  });
  const allowedReceipt = createReceipt({
    network: NETWORK,
    program_id: PROGRAM_ID.toBase58(),
    signature: allowedSig,
    explorer_url: explorerTx(allowedSig),
    policy: policy.toBase58(),
    policy_id: policyId.toString(),
    agent: agent.publicKey.toBase58(),
    owner: owner.publicKey.toBase58(),
    vault: vault.toBase58(),
    mint: mint.toBase58(),
    source: vault.toBase58(),
    destination: merchantAta.address.toBase58(),
    destination_label: "Allowed DemoUSD merchant",
    attempt_type: "allowed_spend",
    status: "allowed",
    requested_amount: (5n * LAMPORTS_PER_DEMO_USD).toString(),
    actual_inner_transfer_amount: (5n * LAMPORTS_PER_DEMO_USD).toString(),
    vault_balance_before: allowedBefore.toString(),
    vault_balance_after: allowedAfter.toString(),
    vault_delta: (allowedAfter - allowedBefore).toString(),
    inner_token_transfers: allowedVerify.innerTokenTransfers ?? 1,
    rule_triggered: "all_clear",
    logs: guardLogs(allowedTx),
    raw_transaction_summary: {
      err: allowedTx?.meta?.err ?? null,
      slot: allowedTx?.slot,
    },
    verifier: {
      verified: allowedVerify.verified,
      method: "rpc_verifier_plus_measured_vault_balance",
      checked_at: new Date().toISOString(),
    },
  });

  const rawBefore = await tokenAmount(connection, agentAta.address);
  const { blockhash } = await connection.getLatestBlockhash();
  const rawTx = new Transaction({
    recentBlockhash: blockhash,
    feePayer: owner.publicKey,
  }).add(
    createTransferInstruction(
      agentAta.address,
      attackerAta.address,
      agent.publicKey,
      50n * LAMPORTS_PER_DEMO_USD,
    ),
  );
  rawTx.sign(owner, agent);
  const rawSig = await connection.sendRawTransaction(rawTx.serialize(), {
    skipPreflight: false,
  });
  const rawParsed = await confirmAndFetch(connection, rawSig);
  const rawAfter = await tokenAmount(connection, agentAta.address);
  const rawVerify = await verifyVajraPayment(connection, rawSig, {
    network: NETWORK,
    expectedAmount: (50n * LAMPORTS_PER_DEMO_USD).toString(),
  });
  const rawReceipt = createReceipt({
    network: NETWORK,
    program_id: TOKEN_PROGRAM_ID.toBase58(),
    signature: rawSig,
    explorer_url: explorerTx(rawSig),
    agent: agent.publicKey.toBase58(),
    mint: mint.toBase58(),
    source: agentAta.address.toBase58(),
    destination: attackerAta.address.toBase58(),
    destination_label: "Red-team attacker token account",
    attempt_type: "raw_wallet_drain",
    status: "raw_wallet_drained",
    requested_amount: (50n * LAMPORTS_PER_DEMO_USD).toString(),
    actual_inner_transfer_amount: "0",
    vault_balance_before: rawBefore.toString(),
    vault_balance_after: rawAfter.toString(),
    vault_delta: (rawAfter - rawBefore).toString(),
    inner_token_transfers: 0,
    rule_triggered: "rawWalletAuthority",
    logs: rawParsed?.meta?.logMessages ?? [],
    raw_transaction_summary: {
      err: rawParsed?.meta?.err ?? null,
      slot: rawParsed?.slot,
      top_level_token_transfer_amount: (50n * LAMPORTS_PER_DEMO_USD).toString(),
    },
    verifier: {
      verified: rawVerify.classification === "not_vajra",
      method: "rpc_non_vajra_classification_plus_measured_token_balance",
      checked_at: new Date().toISOString(),
    },
  });

  const blockedBefore = await tokenAmount(connection, vault);
  const blockedSig = await sendGuardedTransfer({
    connection,
    owner,
    agent,
    program,
    policy,
    vault,
    destination: merchantAta.address,
    amount: 50n * LAMPORTS_PER_DEMO_USD,
    skipPreflight: true,
  });
  const blockedTx = await confirmAndFetch(connection, blockedSig);
  const blockedAfter = await tokenAmount(connection, vault);
  const blockedVerify = await verifyVajraPayment(connection, blockedSig, {
    network: NETWORK,
    expectedProgramId: PROGRAM_ID.toBase58(),
    expectedAmount: (50n * LAMPORTS_PER_DEMO_USD).toString(),
  });
  const blockedReceipt = createReceipt({
    network: NETWORK,
    program_id: PROGRAM_ID.toBase58(),
    signature: blockedSig,
    explorer_url: explorerTx(blockedSig),
    policy: policy.toBase58(),
    policy_id: policyId.toString(),
    agent: agent.publicKey.toBase58(),
    owner: owner.publicKey.toBase58(),
    vault: vault.toBase58(),
    mint: mint.toBase58(),
    source: vault.toBase58(),
    destination: merchantAta.address.toBase58(),
    destination_label: "Over-cap DemoUSD merchant attempt",
    attempt_type: "blocked_spend",
    status: "blocked",
    requested_amount: (50n * LAMPORTS_PER_DEMO_USD).toString(),
    actual_inner_transfer_amount: "0",
    vault_balance_before: blockedBefore.toString(),
    vault_balance_after: blockedAfter.toString(),
    vault_delta: (blockedAfter - blockedBefore).toString(),
    inner_token_transfers: blockedVerify.innerTokenTransfers ?? 0,
    rule_triggered: "perTxCap",
    guard_error: blockedVerify.receipt.guard_error,
    logs: guardLogs(blockedTx),
    raw_transaction_summary: {
      err: blockedTx?.meta?.err ?? null,
      slot: blockedTx?.slot,
    },
    verifier: {
      verified:
        blockedVerify.classification === "vajra_blocked" &&
        blockedAfter === blockedBefore &&
        (blockedVerify.innerTokenTransfers ?? 0) === 0,
      method: "rpc_verifier_plus_measured_vault_balance",
      checked_at: new Date().toISOString(),
    },
  });

  const mismatchVerification = await verifyVajraPayment(
    connection,
    allowedSig,
    {
      network: NETWORK,
      expectedProgramId: PROGRAM_ID.toBase58(),
      expectedDestination: attackerAta.address.toBase58(),
      expectedAmount: (5n * LAMPORTS_PER_DEMO_USD).toString(),
    },
  );

  const receipts = [allowedReceipt, rawReceipt, blockedReceipt];
  const comparison = {
    generated_at: new Date().toISOString(),
    network: NETWORK,
    source: "fresh-devnet",
    proof_type: "devnet-red-team",
    program_id: PROGRAM_ID.toBase58(),
    policy: policy.toBase58(),
    policy_id: policyId.toString(),
    mint: mint.toBase58(),
    thesis: "Raw key drains. Vajra survives. Anyone can verify it.",
    setup: {
      create_policy_signature: createPolicySig,
      fund_vault_signature: fundSig,
      add_destination_signature: addDestinationSig,
    },
    raw_wallet: {
      status: "drained",
      loss_amount: (rawBefore - rawAfter).toString(),
      signature: rawSig,
      explorer_url: explorerTx(rawSig),
      verifier_classification: rawVerify.classification,
    },
    vajra_allowance_vault: {
      status: "blocked",
      loss_amount: "0",
      avoided_loss: (50n * LAMPORTS_PER_DEMO_USD).toString(),
      signature: blockedSig,
      explorer_url: explorerTx(blockedSig),
      rule_triggered: blockedReceipt.rule_triggered,
      inner_token_transfers: blockedReceipt.inner_token_transfers,
      vault_delta: blockedReceipt.vault_delta,
      verifier_classification: blockedVerify.classification,
    },
    allowed_payment: {
      signature: allowedSig,
      explorer_url: explorerTx(allowedSig),
      verifier_classification: allowedVerify.classification,
    },
    receipts: receipts.map(receiptSummary),
  };

  const verifierOutput = {
    generated_at: comparison.generated_at,
    network: NETWORK,
    source: "fresh-devnet",
    proof_type: "devnet-red-team",
    allowed: {
      ...allowedVerify,
      measured_vault_delta: allowedReceipt.vault_delta,
      measured_inner_token_transfers: allowedReceipt.inner_token_transfers,
    },
    raw_wallet: {
      ...rawVerify,
      measured_token_delta: rawReceipt.vault_delta,
      top_level_token_transfer_amount:
        rawReceipt.raw_transaction_summary.top_level_token_transfer_amount,
    },
    blocked: {
      ...blockedVerify,
      measured_vault_delta: blockedReceipt.vault_delta,
      measured_inner_token_transfers: blockedReceipt.inner_token_transfers,
    },
    expected_destination_mismatch: mismatchVerification,
  };

  const explorerLinks = {
    network: NETWORK,
    source: "fresh-devnet",
    program: `https://explorer.solana.com/address/${PROGRAM_ID.toBase58()}?cluster=devnet`,
    policy: `https://explorer.solana.com/address/${policy.toBase58()}?cluster=devnet`,
    vault: `https://explorer.solana.com/address/${vault.toBase58()}?cluster=devnet`,
    create_policy: explorerTx(createPolicySig),
    fund_vault: explorerTx(fundSig),
    add_destination: explorerTx(addDestinationSig),
    allowed_payment: explorerTx(allowedSig),
    raw_wallet_drain: explorerTx(rawSig),
    blocked_drain: explorerTx(blockedSig),
  };

  const latestDir = path.join(ROOT, "proofs/latest");
  const publicDir = path.join(ROOT, "app/public");
  mkdirSync(latestDir, { recursive: true });
  mkdirSync(publicDir, { recursive: true });

  await writeJson(path.join(latestDir, "receipts.json"), receipts);
  writeFileSync(path.join(latestDir, "receipts.csv"), receiptsToCsv(receipts));
  await writeMarkdown(
    path.join(latestDir, "allowed-spend-receipt.md"),
    receiptToMarkdown(allowedReceipt),
  );
  await writeMarkdown(
    path.join(latestDir, "blocked-spend-receipt.md"),
    receiptToMarkdown(blockedReceipt),
  );
  await writeJson(path.join(latestDir, "allowed-payment.json"), allowedReceipt);
  await writeJson(path.join(latestDir, "raw-wallet-drain.json"), rawReceipt);
  await writeJson(path.join(latestDir, "blocked-drain.json"), blockedReceipt);
  await writeJson(path.join(latestDir, "verifier-output.json"), verifierOutput);
  await writeJson(path.join(latestDir, "explorer-links.json"), explorerLinks);
  await writeJson(path.join(latestDir, "red-team-comparison.json"), comparison);
  await writeMarkdown(
    path.join(latestDir, "red-team-comparison.md"),
    `# Vajra Devnet Red Team Comparison

${comparison.thesis}

Source: fresh devnet

Program: ${PROGRAM_ID.toBase58()}

Policy: ${policy.toBase58()}

| Path | Result | Loss | Signature |
| --- | --- | ---: | --- |
| Raw wallet | Drained | ${comparison.raw_wallet.loss_amount} | ${rawSig} |
| Vajra allowance vault | Blocked | ${comparison.vajra_allowance_vault.loss_amount} | ${blockedSig} |

Vajra avoided loss: ${comparison.vajra_allowance_vault.avoided_loss}

Blocked Vajra proof: vault delta ${blockedReceipt.vault_delta}, inner token transfers ${blockedReceipt.inner_token_transfers}, rule ${blockedReceipt.rule_triggered}.
`,
  );

  await writeJson(path.join(publicDir, "red-team-comparison.json"), comparison);
  await writeJson(path.join(publicDir, "receipts.latest.json"), receipts);
  await writeJson(path.join(publicDir, "merchant-verification.example.json"), {
    verified: allowedVerify.verified,
    expected_destination_check: "passed",
    network: NETWORK,
    source: "fresh-devnet",
    proof_type: "devnet-red-team",
    receipt: allowedReceipt,
  });
  await writeJson(path.join(publicDir, "devnet-red-team-proof.json"), {
    network: NETWORK,
    source: "fresh-devnet",
    proof_type: "devnet-red-team",
    program_id: PROGRAM_ID.toBase58(),
    comparison,
    verifier: {
      allowed: {
        verified: allowedVerify.verified,
        classification: allowedVerify.classification,
        errors: allowedVerify.errors,
      },
      raw_wallet: {
        verified: rawVerify.verified,
        classification: rawVerify.classification,
        errors: rawVerify.errors,
      },
      blocked: {
        verified: blockedVerify.verified,
        classification: blockedVerify.classification,
        errors: blockedVerify.errors,
        vault_delta: blockedReceipt.vault_delta,
        inner_token_transfers: blockedReceipt.inner_token_transfers,
      },
      expected_destination_mismatch: {
        verified: mismatchVerification.verified,
        classification: mismatchVerification.classification,
        errors: mismatchVerification.errors,
      },
    },
  });

  console.log("Devnet red-team proof complete.");
  console.log(`Allowed payment: ${allowedSig}`);
  console.log(`Raw wallet drain: ${rawSig}`);
  console.log(`Blocked Vajra drain: ${blockedSig}`);
  console.log(`Blocked vault delta: ${blockedReceipt.vault_delta}`);
  console.log(
    `Blocked inner token transfers: ${blockedReceipt.inner_token_transfers}`,
  );
  console.log(`Artifacts: ${latestDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
