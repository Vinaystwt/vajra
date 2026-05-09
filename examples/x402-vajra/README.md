# x402-Style Vajra Reference

This example shows a local HTTP 402-style flow where an API-buying agent pays through Vajra policy rules instead of raw wallet access.

Flow:

- The agent requests `/data`.
- The API returns `402` with payment metadata.
- The agent pays through a Vajra-style spend path using the SDK package for templates and error explanations.
- The API accepts the payment proof header.
- Over-budget, wrong-destination, and revoked attempts are blocked.
- A proof packet is written to `proofs/x402-vajra-proof.json`.

Run:

```bash
npm install
npm run demo
```

This is a faithful local integration. It does not require devnet deployment and does not use real funds.
