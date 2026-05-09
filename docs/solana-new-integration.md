# Add Vajra to a Solana Starter App

Vajra adds program-owned policy vaults to a Solana app. The agent key can request spends, but it never owns the vault.

## Install

```bash
npm install @vajra-protocol/sdk @coral-xyz/anchor @solana/web3.js @solana/spl-token
```

## Create Client

```ts
import { Connection, Keypair } from "@solana/web3.js";
import { VajraClient } from "@vajra-protocol/sdk";

const connection = new Connection(
  process.env.SOLANA_RPC ?? "http://127.0.0.1:8899",
  "confirmed",
);
const owner = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.OWNER_KEYPAIR_JSON!)),
);
const vajra = new VajraClient({
  connection,
  wallet: owner,
  cluster: "localnet",
});
```

## Create Policy

```ts
const slot = await connection.getSlot();
const created = await vajra.createPolicy({
  policyId: Date.now().toString(),
  delegatedSigner: agentPublicKey,
  allowedMint: demoUsdMint,
  totalBudget: "100000000",
  perTxCap: "10000000",
  expirySlot: (slot + 500000).toString(),
  periodBudget: "25000000",
  periodDurationSlots: "10000",
  minSlotInterval: "5",
});

console.log(created.policy.toBase58());
```

## Simulate Spend

```ts
const simulation = await vajra.simulateSpend({
  policy: created.policy,
  mint: demoUsdMint,
  destinationTokenAccount: merchantTokenAccount,
  amount: "5000000",
});

if (!simulation.ok) {
  console.log(simulation.ruleTriggered, simulation.reason);
}
```

## Execute Spend

```ts
const agentClient = new VajraClient({
  connection,
  wallet: agentKeypair,
  cluster: "localnet",
});

const spend = await agentClient.spend({
  policy: created.policy,
  mint: demoUsdMint,
  destinationTokenAccount: merchantTokenAccount,
  amount: "5000000",
});

console.log(spend.signature, spend.explorerUrl);
```

## Export Proof

```ts
const auditTrail = await vajra.getAuditTrail(created.policy);
const proof = {
  policy: created.policy.toBase58(),
  auditTrail,
  note: "The agent key never owns the vault; the PolicyPDA is the SPL token authority.",
};
```

## Important Invariant

The agent key is only a delegated signer. The SPL vault authority is the Vajra PolicyPDA. A raw SPL transfer signed by the agent cannot drain the vault.
