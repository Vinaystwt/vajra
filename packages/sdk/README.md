# @vinaystwt/vajra-sdk

TypeScript SDK for Vajra program-owned policy vaults on Solana.

Vajra lets an agent request spends while the Solana program enforces policy before funds move. The agent key is never the vault authority; the PolicyPDA owns the SPL vault.

## Install

```bash
npm install @vinaystwt/vajra-sdk @coral-xyz/anchor @solana/web3.js @solana/spl-token
```

**Note:** Vajra uses DemoUSD (a test SPL token mint) on Solana devnet. It is not a production treasury primitive — use it to evaluate the policy-vault architecture.

## Verify / Red-team

```bash
# From repo root — regenerates devnet proof artifacts
npm run devnet:red-team

# SDK-only build + test
cd packages/sdk
npm run build
npm test
npm pack --dry-run
```

## Client

```ts
import { Connection, Keypair } from "@solana/web3.js";
import { VajraClient } from "@vinaystwt/vajra-sdk";

const connection = new Connection("http://127.0.0.1:8899", "confirmed");
const owner = Keypair.generate();
const vajra = new VajraClient({
  connection,
  wallet: owner,
  cluster: "localnet",
});
```

## Core Methods

- `createPolicy()`
- `fundVault()`
- `addDestination()`
- `spend()`
- `simulateSpend()`
- `revokePolicy()`
- `withdrawFunds()`
- `getPolicy()`
- `getAuditTrail()`
- `explainError()`
- `getExplorerUrl()`
- `getPolicyRiskScore()`
- `verifyVajraPayment()`
- `verifyVajraPaymentFixture()`
- `createReceipt()`
- `receiptToMarkdown()`
- `receiptsToCsv()`
- `listMandates()`
- `getMandate()`
- `mandateToPolicyConfig()`

## Policy Templates

Included templates compile to ordinary Vajra policy fields:

- `x402ApiBuyer`
- `defiRebalancer`
- `daoOpsBot`
- `payrollAgent`
- `computeDataBuyer`
- `marketMaker`
- `protocolOpsBot`

## Simulation

`simulateSpend()` runs SDK-side account and budget prechecks. It can also request an onchain simulation instruction with `useOnchainSimulation: true`.

Simulation does not move tokens and does not mutate policy spend state.

## Receipts and Mandates

Vajra receipts provide a canonical JSON/Markdown/CSV record for allowed spends, blocked spends, and verification-only checks.

Agent Mandates are templates that explain bounded automated signer authority and compile into ordinary policy fields. They are templates, not legal compliance documents.

## Examples

```bash
npm run build
node dist/examples/basic-policy.js
```

The spend and withdrawal examples expect environment variables pointing at local or devnet demo state.
