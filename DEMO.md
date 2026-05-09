# Demo Flow

Thesis: raw key drains, Vajra survives, anyone can verify it.

1. Show an Agent Mandate.
2. Show an allowed spend.
3. Show a raw wallet drain fixture.
4. Show a Vajra blocked spend fixture.
5. Show the execution receipt.
6. Verify the receipt.
7. Hand the receipt data to the Proof Explorer frontend.

Commands:

```bash
npm run mandates:list
npm run demo:red-team
npm run proof:latest
npm run verify:fixtures
npm run devnet:red-team
```

Devnet evidence:

```bash
npm run devnet:demo
npm run devnet:proof
npm run devnet:red-team
```

Use `DemoUSD` for demo stablecoin-style flows unless a real mint is explicitly configured and documented.
