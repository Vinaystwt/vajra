# Vajra SDK

Package: `@vinaystwt/vajra-sdk` · v0.1.0 · [npm](https://www.npmjs.com/package/@vinaystwt/vajra-sdk)

Path: `packages/sdk`

## Install

```bash
npm install @vinaystwt/vajra-sdk @coral-xyz/anchor @solana/web3.js @solana/spl-token
```

## Build from source

```bash
cd packages/sdk
npm install
npm run build
npm test
npm pack --dry-run
```

## Methods

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
- `createReceipt()`
- `receiptToMarkdown()`
- `receiptsToCsv()`
- `verifyVajraPayment()`
- `verifyVajraPaymentFixture()`
- `listMandates()`
- `getMandate()`
- `mandateToPolicyConfig()`
- `explainMandateRisk()`

## Templates

- `x402ApiBuyer`
- `defiRebalancer`
- `daoOpsBot`
- `payrollAgent`
- `computeDataBuyer`
- `marketMaker`
- `protocolOpsBot`

## Core Invariant

The agent key is a delegated signer. It is not the vault authority. The SPL vault authority is the Vajra PolicyPDA.

## Receipt and Verifier Utilities

The SDK can turn fixture or RPC transaction evidence into a canonical Vajra receipt.

```ts
import { verifyVajraPayment } from "@vinaystwt/vajra-sdk";

const result = await verifyVajraPayment(connection, signature, {
  network: "devnet",
  expectedDestination: merchantTokenAccount,
  expectedAmount: "5000000",
});
```

Use `verifyVajraPaymentFixture()` for deterministic tests and examples.

## Agent Mandates

Mandates are templates for bounded automated signer allowances. They are not legal compliance documents.

```ts
import { getMandate, mandateToPolicyConfig } from "@vinaystwt/vajra-sdk";

const mandate = getMandate("stablecoin-agent");
const policyConfig = mandateToPolicyConfig(mandate!);
```
