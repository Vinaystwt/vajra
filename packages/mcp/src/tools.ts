import { z } from "zod";
import {
  getMandate,
  listMandates,
  receiptToMarkdown,
  verifyVajraPayment,
  verifyVajraPaymentFixture,
} from "@vinaystwt/vajra-sdk";

export const toolNames = [
  "vajra_create_policy",
  "vajra_get_policy",
  "vajra_simulate_spend",
  "vajra_execute_spend",
  "vajra_execute_guarded_spend",
  "vajra_revoke_policy",
  "vajra_get_audit_trail",
  "vajra_withdraw_funds",
  "vajra_export_proof",
  "vajra_list_mandates",
  "vajra_get_mandate",
  "vajra_verify_payment",
  "vajra_export_receipt",
  "vajra_explain_receipt",
  "vajra_run_red_team_fixture",
] as const;

const CreatePolicySchema = z.object({
  policyId: z.string(),
  delegatedSigner: z.string(),
  allowedMint: z.string(),
  totalBudget: z.string(),
  perTxCap: z.string(),
  expirySlot: z.string(),
  periodBudget: z.string().default("0"),
  periodDurationSlots: z.string().default("0"),
  minSlotInterval: z.string().default("0"),
});

const PolicySchema = z.object({ policy: z.string() });
const SignatureSchema = z.object({
  signature: z.string(),
  fixture: z.enum(["allowed", "blocked", "rawDrain", "nonVajra"]).optional(),
  expectedDestination: z.string().optional(),
  expectedAmount: z.string().optional(),
});
const SpendSchema = z.object({
  policy: z.string(),
  mint: z.string(),
  destinationTokenAccount: z.string(),
  amount: z.string(),
  skipPreflight: z.boolean().optional(),
});

export const toolSchemas = {
  vajra_create_policy: CreatePolicySchema,
  vajra_get_policy: PolicySchema,
  vajra_simulate_spend: SpendSchema,
  vajra_execute_spend: SpendSchema,
  vajra_execute_guarded_spend: SpendSchema,
  vajra_revoke_policy: PolicySchema,
  vajra_get_audit_trail: PolicySchema.extend({ limit: z.number().optional() }),
  vajra_withdraw_funds: SpendSchema,
  vajra_export_proof: z.object({
    policy: z.string(),
    limit: z.number().default(25),
  }),
  vajra_list_mandates: z.object({}),
  vajra_get_mandate: z.object({ id: z.string() }),
  vajra_verify_payment: SignatureSchema,
  vajra_export_receipt: SignatureSchema,
  vajra_explain_receipt: z.object({ receipt: z.record(z.unknown()) }),
  vajra_run_red_team_fixture: z.object({}),
};

const PROGRAM_ID = "APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD";
const mcpFixtures = {
  allowed: {
    network: "fixture" as const,
    programId: PROGRAM_ID,
    signature: "mcp_fixture_allowed",
    err: null,
    requestedAmount: "5000000",
    actualInnerTransferAmount: "5000000",
    vaultBalanceBefore: "100000000",
    vaultBalanceAfter: "95000000",
    innerTokenTransfers: 1,
    ruleTriggered: "all_clear",
    logs: ["Program log: VAJRA_GUARD:12:all_clear_cpi_transfer"],
  },
  blocked: {
    network: "fixture" as const,
    programId: PROGRAM_ID,
    signature: "mcp_fixture_blocked",
    err: { InstructionError: [0, { Custom: 6007 }] },
    requestedAmount: "50000000",
    actualInnerTransferAmount: "0",
    vaultBalanceBefore: "95000000",
    vaultBalanceAfter: "95000000",
    innerTokenTransfers: 0,
    ruleTriggered: "perTxCap",
    logs: ["Program log: AnchorError thrown. Error Code: PerTxCapExceeded."],
  },
  rawDrain: {
    network: "fixture" as const,
    programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    signature: "mcp_fixture_raw_drain",
    err: null,
    requestedAmount: "50000000",
    actualInnerTransferAmount: "50000000",
    innerTokenTransfers: 1,
    logs: ["Raw wallet transfer signed by the hot agent key."],
  },
  nonVajra: {
    network: "fixture" as const,
    programId: "11111111111111111111111111111111",
    signature: "mcp_fixture_non_vajra",
    err: null,
    requestedAmount: "1000000",
    innerTokenTransfers: 1,
    logs: ["Program 11111111111111111111111111111111 success"],
  },
};

async function runtime() {
  const { createClient, pubkey } = await import("./config.js");
  return { client: createClient(), pubkey };
}

export async function runTool(name: string, args: unknown) {
  switch (name) {
    case "vajra_create_policy": {
      const { client, pubkey } = await runtime();
      const input = toolSchemas.vajra_create_policy.parse(args);
      return client.createPolicy({
        policyId: input.policyId,
        delegatedSigner: pubkey(input.delegatedSigner),
        allowedMint: pubkey(input.allowedMint),
        totalBudget: input.totalBudget,
        perTxCap: input.perTxCap,
        expirySlot: input.expirySlot,
        periodBudget: input.periodBudget,
        periodDurationSlots: input.periodDurationSlots,
        minSlotInterval: input.minSlotInterval,
      });
    }
    case "vajra_get_policy": {
      const { client, pubkey } = await runtime();
      const input = toolSchemas.vajra_get_policy.parse(args);
      return client.getPolicy(pubkey(input.policy));
    }
    case "vajra_simulate_spend": {
      const { client, pubkey } = await runtime();
      const input = toolSchemas.vajra_simulate_spend.parse(args);
      return client.simulateSpend({
        policy: pubkey(input.policy),
        mint: pubkey(input.mint),
        destinationTokenAccount: pubkey(input.destinationTokenAccount),
        amount: input.amount,
      });
    }
    case "vajra_execute_spend": {
      const { client, pubkey } = await runtime();
      const input = toolSchemas.vajra_execute_spend.parse(args);
      return client.spend({
        policy: pubkey(input.policy),
        mint: pubkey(input.mint),
        destinationTokenAccount: pubkey(input.destinationTokenAccount),
        amount: input.amount,
        skipPreflight: input.skipPreflight,
      });
    }
    case "vajra_execute_guarded_spend": {
      const { client, pubkey } = await runtime();
      const input = toolSchemas.vajra_execute_guarded_spend.parse(args);
      return client.spend({
        policy: pubkey(input.policy),
        mint: pubkey(input.mint),
        destinationTokenAccount: pubkey(input.destinationTokenAccount),
        amount: input.amount,
        skipPreflight: input.skipPreflight,
      });
    }
    case "vajra_revoke_policy": {
      const { client, pubkey } = await runtime();
      const input = toolSchemas.vajra_revoke_policy.parse(args);
      return client.revokePolicy(pubkey(input.policy));
    }
    case "vajra_get_audit_trail": {
      const { client, pubkey } = await runtime();
      const input = toolSchemas.vajra_get_audit_trail.parse(args);
      return client.getAuditTrail(pubkey(input.policy), input.limit);
    }
    case "vajra_withdraw_funds": {
      const { client, pubkey } = await runtime();
      const input = toolSchemas.vajra_withdraw_funds.parse(args);
      return client.withdrawFunds({
        policy: pubkey(input.policy),
        mint: pubkey(input.mint),
        destinationTokenAccount: pubkey(input.destinationTokenAccount),
        amount: input.amount,
      });
    }
    case "vajra_export_proof": {
      const { client, pubkey } = await runtime();
      const input = toolSchemas.vajra_export_proof.parse(args);
      const auditTrail = await client.getAuditTrail(
        pubkey(input.policy),
        input.limit,
      );
      return { policy: input.policy, auditTrail };
    }
    case "vajra_list_mandates":
      return { mandates: listMandates() };
    case "vajra_get_mandate": {
      const input = toolSchemas.vajra_get_mandate.parse(args);
      return { mandate: getMandate(input.id) ?? null };
    }
    case "vajra_verify_payment": {
      const input = toolSchemas.vajra_verify_payment.parse(args);
      if (input.fixture) {
        return verifyVajraPaymentFixture(mcpFixtures[input.fixture], {
          expectedDestination: input.expectedDestination,
          expectedAmount: input.expectedAmount,
        });
      }
      const { client } = await runtime();
      return verifyVajraPayment(client.connection, input.signature, {
        network: client.cluster as any,
        expectedDestination: input.expectedDestination,
        expectedAmount: input.expectedAmount,
      });
    }
    case "vajra_export_receipt": {
      const input = toolSchemas.vajra_export_receipt.parse(args);
      const result = input.fixture
        ? verifyVajraPaymentFixture(mcpFixtures[input.fixture], {
            expectedDestination: input.expectedDestination,
            expectedAmount: input.expectedAmount,
          })
        : await (async () => {
            const { client } = await runtime();
            return verifyVajraPayment(client.connection, input.signature, {
              network: client.cluster as any,
              expectedDestination: input.expectedDestination,
              expectedAmount: input.expectedAmount,
            });
          })();
      return {
        receipt: result.receipt,
        markdown: receiptToMarkdown(result.receipt),
      };
    }
    case "vajra_explain_receipt": {
      const input = toolSchemas.vajra_explain_receipt.parse(args);
      return {
        summary:
          "A Vajra receipt reports whether a spend was allowed, blocked, not routed through Vajra, or unknown. Merchants should pin expected destination, amount, and program id before fulfilling service.",
        receipt: input.receipt,
      };
    }
    case "vajra_run_red_team_fixture": {
      const allowed = verifyVajraPaymentFixture(mcpFixtures.allowed);
      const blocked = verifyVajraPaymentFixture(mcpFixtures.blocked);
      return {
        thesis: "Raw key drains. Vajra survives. Anyone can verify it.",
        allowed: allowed.receipt,
        blocked: blocked.receipt,
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
