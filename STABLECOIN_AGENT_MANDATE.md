# Stablecoin Agent Mandate

Vajra lets operators assign stablecoin allowances to automated signers without handing them treasury authority.

The demo uses DemoUSD, a test SPL mint representing stablecoin-style flows. It does not claim a named issuer stablecoin integration.

Recommended shape:

- total budget: `100000000`
- per-transaction cap: `5000000`
- period budget: `25000000`
- velocity limit: `20 slots`
- expiry: one campaign or operational window
- destinations: merchant/API token accounts approved by the owner
- recovery: owner can revoke and withdraw remaining vault funds

Verifier flow:

1. Agent requests payment.
2. Vajra program enforces policy.
3. Merchant verifies the transaction signature or receipt.
4. Merchant fulfills only if the receipt status is `allowed` and expected destination/amount match.

Run the stablecoin fixture example:

```bash
cd examples/stablecoin-agent-spend
npm install
npm run demo
```
