import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { createRequire } from "node:module";
import type { Vajra } from "./idl/vajra.js";
import { explainError } from "./errors.js";
import type {
  AddDestinationInput,
  AuditEntry,
  CreatePolicyInput,
  FundVaultInput,
  PolicyState,
  RiskScore,
  SimulationInput,
  SimulationResult,
  SpendInput,
  SpendResult,
  VajraClientConfig,
  WithdrawInput,
} from "./types.js";

export const VAJRA_PROGRAM_ID = new PublicKey(
  "APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD",
);
const POLICY_SEED = "vajra_policy";
const DEST_SEED = "vajra_dest";
const require = createRequire(import.meta.url);
const idl = require("./idl/vajra.json") as Vajra;

function toBn(value: bigint | number | string): BN {
  return new BN(value.toString());
}

function toBigIntValue(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") return BigInt(value);
  if (
    value &&
    typeof (value as { toString: () => string }).toString === "function"
  ) {
    return BigInt((value as { toString: () => string }).toString());
  }
  return 0n;
}

export function policyPda(
  owner: PublicKey,
  policyId: bigint | number | string,
  programId = VAJRA_PROGRAM_ID,
): [PublicKey, number] {
  const idBuffer = Buffer.alloc(8);
  idBuffer.writeBigUInt64LE(BigInt(policyId.toString()));
  return PublicKey.findProgramAddressSync(
    [Buffer.from(POLICY_SEED), owner.toBuffer(), idBuffer],
    programId,
  );
}

export function destinationRulePda(
  policy: PublicKey,
  destinationTokenAccount: PublicKey,
  programId = VAJRA_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(DEST_SEED),
      policy.toBuffer(),
      destinationTokenAccount.toBuffer(),
    ],
    programId,
  );
}

export class VajraClient {
  readonly connection: Connection;
  readonly wallet: Wallet;
  readonly provider: AnchorProvider;
  readonly program: Program<Vajra>;
  readonly programId: PublicKey;
  readonly cluster: string;

  constructor(config: VajraClientConfig) {
    this.connection = config.connection;
    this.wallet =
      config.wallet instanceof Wallet
        ? config.wallet
        : new Wallet(config.wallet.payer ?? (config.wallet as any));
    this.programId = config.programId ?? VAJRA_PROGRAM_ID;
    this.cluster = config.cluster ?? "devnet";
    this.provider = new AnchorProvider(this.connection, this.wallet, {
      commitment: config.commitment ?? "confirmed",
    });
    this.program = new Program(idl as Vajra, this.provider);
  }

  policyPda(
    owner: PublicKey,
    policyId: bigint | number | string,
  ): [PublicKey, number] {
    return policyPda(owner, policyId, this.programId);
  }

  destinationRulePda(
    policy: PublicKey,
    destinationTokenAccount: PublicKey,
  ): [PublicKey, number] {
    return destinationRulePda(policy, destinationTokenAccount, this.programId);
  }

  vaultAta(policy: PublicKey, mint: PublicKey): PublicKey {
    return getAssociatedTokenAddressSync(
      mint,
      policy,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
  }

  getExplorerUrl(
    signatureOrAddress: string,
    type: "tx" | "address" = "tx",
  ): string {
    const clusterParam =
      this.cluster === "mainnet-beta" ? "" : `?cluster=${this.cluster}`;
    return `https://explorer.solana.com/${type}/${signatureOrAddress}${clusterParam}`;
  }

  async createPolicy(
    input: CreatePolicyInput,
  ): Promise<{ policy: PublicKey; signature: string; explorerUrl: string }> {
    const owner = this.wallet.publicKey;
    const [policy] = this.policyPda(owner, input.policyId);
    const signature = await (this.program.methods as any)
      .createPolicy(
        toBn(input.policyId),
        input.delegatedSigner,
        input.allowedMint,
        toBn(input.totalBudget),
        toBn(input.perTxCap),
        toBn(input.expirySlot),
        toBn(input.periodBudget ?? 0),
        toBn(input.periodDurationSlots ?? 0),
        toBn(input.minSlotInterval ?? 0),
        input.feeBps ?? 0,
        input.feeRecipient ?? PublicKey.default,
      )
      .accounts({
        owner,
        policy,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return { policy, signature, explorerUrl: this.getExplorerUrl(signature) };
  }

  async fundVault(input: FundVaultInput): Promise<SpendResult> {
    const vault = this.vaultAta(input.policy, input.allowedMint);
    const signature = await (this.program.methods as any)
      .fundVault(toBn(input.amount))
      .accounts({
        funder: this.wallet.publicKey,
        funderTokenAccount: input.funderTokenAccount,
        policy: input.policy,
        vault,
        allowedMint: input.allowedMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return {
      signature,
      explorerUrl: this.getExplorerUrl(signature),
      policy: input.policy,
      destination: vault,
      amount: BigInt(input.amount.toString()),
    };
  }

  async addDestination(input: AddDestinationInput): Promise<{
    destinationRule: PublicKey;
    signature: string;
    explorerUrl: string;
  }> {
    const [destinationRule] = this.destinationRulePda(
      input.policy,
      input.destinationTokenAccount,
    );
    const signature = await (this.program.methods as any)
      .addDestination()
      .accounts({
        owner: this.wallet.publicKey,
        policy: input.policy,
        destinationTokenAccount: input.destinationTokenAccount,
        destinationRule,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return {
      destinationRule,
      signature,
      explorerUrl: this.getExplorerUrl(signature),
    };
  }

  async spend(input: SpendInput): Promise<SpendResult> {
    const [destinationRule] = this.destinationRulePda(
      input.policy,
      input.destinationTokenAccount,
    );
    const vault = this.vaultAta(input.policy, input.mint);
    const builder = (this.program.methods as any)
      .executeGuardedTransfer(toBn(input.amount))
      .accounts({
        delegatedSigner: this.wallet.publicKey,
        policy: input.policy,
        vault,
        destinationTokenAccount: input.destinationTokenAccount,
        destinationRule,
        tokenProgram: TOKEN_PROGRAM_ID,
      });

    let signature: string;
    if (input.skipPreflight) {
      const ix = await builder.instruction();
      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash();
      const tx = new Transaction({
        feePayer: this.wallet.publicKey,
        recentBlockhash: blockhash,
      }).add(ix);
      const signed = await this.wallet.signTransaction(tx);
      signature = await this.connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: true,
      });
      await this.connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed",
      );
    } else {
      signature = await builder.rpc();
    }

    return {
      signature,
      explorerUrl: this.getExplorerUrl(signature),
      policy: input.policy,
      destination: input.destinationTokenAccount,
      amount: BigInt(input.amount.toString()),
    };
  }

  async simulateSpend(input: SimulationInput): Promise<SimulationResult> {
    try {
      const policy = await this.getPolicy(input.policy);
      const amount = BigInt(input.amount.toString());
      const currentSlot = BigInt(await this.connection.getSlot());
      const destAccount = await getAccount(
        this.connection,
        input.destinationTokenAccount,
      );
      const vault = this.vaultAta(input.policy, input.mint);
      const vaultAccount = await getAccount(this.connection, vault);
      const [destinationRule] = this.destinationRulePda(
        input.policy,
        input.destinationTokenAccount,
      );
      const destinationRuleInfo =
        await this.connection.getAccountInfo(destinationRule);

      if (policy.revoked)
        return {
          ok: false,
          reason: "Policy has been revoked.",
          ruleTriggered: "revoked",
          policy,
        };
      if (currentSlot > policy.expirySlot)
        return {
          ok: false,
          reason: "Policy has expired.",
          ruleTriggered: "expiry",
          policy,
        };
      if (amount <= 0n)
        return {
          ok: false,
          reason: "Amount must be greater than zero.",
          ruleTriggered: "amount",
          policy,
        };
      if (amount > policy.perTxCap)
        return {
          ok: false,
          reason: "Amount exceeds per-transaction cap.",
          ruleTriggered: "perTxCap",
          policy,
        };
      if (policy.spentAmount + amount > policy.totalBudget)
        return {
          ok: false,
          reason: "Spend exceeds total budget.",
          ruleTriggered: "totalBudget",
          policy,
        };

      const periodEnabled =
        policy.periodBudget > 0n && policy.periodDurationSlots > 0n;
      const wouldResetPeriod =
        periodEnabled &&
        currentSlot >= policy.periodStartSlot + policy.periodDurationSlots;
      const currentPeriodSpent = wouldResetPeriod ? 0n : policy.periodSpent;
      if (periodEnabled && currentPeriodSpent + amount > policy.periodBudget) {
        return {
          ok: false,
          reason: "Spend exceeds current period budget.",
          ruleTriggered: "periodBudget",
          wouldResetPeriod,
          policy,
        };
      }
      if (
        policy.minSlotInterval > 0n &&
        policy.lastSpendSlot !== 0n &&
        currentSlot < policy.lastSpendSlot + policy.minSlotInterval
      ) {
        return {
          ok: false,
          reason: "Spend violates velocity limit.",
          ruleTriggered: "velocity",
          policy,
        };
      }
      if (!destinationRuleInfo)
        return {
          ok: false,
          reason: "Destination is not allowlisted.",
          ruleTriggered: "destination",
          policy,
        };
      if (!destAccount.mint.equals(policy.allowedMint))
        return {
          ok: false,
          reason: "Destination mint mismatch.",
          ruleTriggered: "mint",
          policy,
        };
      if (!vaultAccount.mint.equals(policy.allowedMint))
        return {
          ok: false,
          reason: "Vault mint mismatch.",
          ruleTriggered: "vaultMint",
          policy,
        };
      if (!vaultAccount.owner.equals(input.policy))
        return {
          ok: false,
          reason: "Vault authority is not the PolicyPDA.",
          ruleTriggered: "vaultAuthority",
          policy,
        };
      if (vaultAccount.amount < amount)
        return {
          ok: false,
          reason: "Vault balance is insufficient.",
          ruleTriggered: "vaultBalance",
          policy,
        };

      if (input.useOnchainSimulation) {
        const ix = await (this.program.methods as any)
          .simulateGuardedTransfer(toBn(input.amount))
          .accounts({
            delegatedSigner: this.wallet.publicKey,
            policy: input.policy,
            vault,
            destinationTokenAccount: input.destinationTokenAccount,
            destinationRule,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .instruction();
        const tx = new Transaction().add(ix);
        tx.feePayer = this.wallet.publicKey;
        const result = await this.connection.simulateTransaction(tx);
        if (result.value.err) {
          const explained = explainError(result.value.err);
          return {
            ok: false,
            reason: explained.message,
            ruleTriggered: explained.ruleTriggered,
            logs: result.value.logs ?? undefined,
            policy,
          };
        }
        return {
          ok: true,
          reason: "Simulation passed.",
          wouldResetPeriod,
          logs: result.value.logs ?? undefined,
          policy,
        };
      }

      return {
        ok: true,
        reason: "SDK precheck passed.",
        wouldResetPeriod,
        policy,
      };
    } catch (error) {
      const explained = explainError(error);
      return {
        ok: false,
        reason: explained.message,
        ruleTriggered: explained.ruleTriggered,
      };
    }
  }

  async revokePolicy(
    policy: PublicKey,
  ): Promise<{ signature: string; explorerUrl: string }> {
    const signature = await (this.program.methods as any)
      .revokePolicy()
      .accounts({
        owner: this.wallet.publicKey,
        policy,
      })
      .rpc();
    return { signature, explorerUrl: this.getExplorerUrl(signature) };
  }

  async withdrawFunds(input: WithdrawInput): Promise<SpendResult> {
    const vault = this.vaultAta(input.policy, input.mint);
    const signature = await (this.program.methods as any)
      .withdrawFunds(toBn(input.amount))
      .accounts({
        owner: this.wallet.publicKey,
        policy: input.policy,
        vault,
        destinationTokenAccount: input.destinationTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    return {
      signature,
      explorerUrl: this.getExplorerUrl(signature),
      policy: input.policy,
      destination: input.destinationTokenAccount,
      amount: BigInt(input.amount.toString()),
    };
  }

  async getPolicy(policy: PublicKey): Promise<PolicyState> {
    const account = await this.program.account.policyPda.fetch(policy);
    return {
      address: policy,
      owner: account.owner,
      delegatedSigner: account.delegatedSigner,
      allowedMint: account.allowedMint,
      totalBudget: toBigIntValue(account.totalBudget),
      spentAmount: toBigIntValue(account.spentAmount),
      perTxCap: toBigIntValue(account.perTxCap),
      expirySlot: toBigIntValue(account.expirySlot),
      revoked: account.revoked,
      policyId: toBigIntValue(account.policyId),
      bump: account.bump,
      policyVersion: account.policyVersion,
      periodBudget: toBigIntValue(account.periodBudget),
      periodSpent: toBigIntValue(account.periodSpent),
      periodStartSlot: toBigIntValue(account.periodStartSlot),
      periodDurationSlots: toBigIntValue(account.periodDurationSlots),
      minSlotInterval: toBigIntValue(account.minSlotInterval),
      lastSpendSlot: toBigIntValue(account.lastSpendSlot),
      feeBps: account.feeBps,
      feeRecipient: account.feeRecipient,
    };
  }

  async getAuditTrail(policy: PublicKey, limit = 25): Promise<AuditEntry[]> {
    const signatures = await this.connection.getSignaturesForAddress(policy, {
      limit,
    });
    return signatures.map((entry) => ({
      signature: entry.signature,
      slot: entry.slot,
      blockTime: entry.blockTime ?? null,
      err: entry.err ?? null,
      memo: entry.memo ?? null,
    }));
  }

  getPolicyRiskScore(policy: PolicyState): RiskScore {
    const reasons: string[] = [];
    let score = 0;
    if (policy.revoked) reasons.push("Policy is revoked.");
    if (policy.perTxCap * 2n > policy.totalBudget) {
      score += 25;
      reasons.push("Per-transaction cap is more than half of total budget.");
    }
    if (policy.periodBudget === 0n || policy.periodDurationSlots === 0n) {
      score += 20;
      reasons.push("Periodic budget is disabled.");
    }
    if (policy.minSlotInterval === 0n) {
      score += 15;
      reasons.push("Velocity limit is disabled.");
    }
    if (policy.feeBps > 0) {
      score += 5;
      reasons.push("Protocol fee config is non-zero.");
    }
    const level = score >= 50 ? "high" : score >= 25 ? "medium" : "low";
    return { score, level, reasons };
  }
}
