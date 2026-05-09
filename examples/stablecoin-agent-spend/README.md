# Stablecoin Agent Spend Example

Vajra lets operators assign stablecoin-style SPL allowances to automated signers without handing them treasury authority.

This example uses DemoUSD, a test SPL mint representing stablecoin-style flows. It does not claim named issuer stablecoin usage.

Flow:

1. Load the Stablecoin Agent Mandate.
2. Verify an allowed merchant/API payment fixture.
3. Verify a blocked attacker or over-limit payment fixture.
4. Print a Vajra execution receipt.

Run:

```bash
npm install
npm run demo
```
