# Red Team Sandbox

The sandbox compares two paths:

1. Raw wallet path: an agent controls funds directly and a malicious transfer can drain the hot wallet.
2. Vajra allowance vault path: the same style of spend request is bounded by policy, and unsafe attempts are blocked before funds move.

The raw-wallet receipt is labeled `raw_wallet_drained` and is not classified as a Vajra payment. The Vajra blocked receipt has `vault_delta = 0` and `inner_token_transfers = 0`.

Run:

```bash
npm run demo:red-team
npm run proof:latest
npm run verify:red-team
npm run devnet:red-team
```

Generated artifacts:

- `proofs/latest/red-team-comparison.json`
- `proofs/latest/red-team-comparison.md`
- `proofs/latest/receipts.json`
- `proofs/latest/receipts.csv`
- `proofs/latest/allowed-payment.json`
- `proofs/latest/raw-wallet-drain.json`
- `proofs/latest/blocked-drain.json`
- `proofs/latest/verifier-output.json`
- `proofs/latest/explorer-links.json`
- `app/public/red-team-comparison.json`
- `app/public/receipts.latest.json`
- `app/public/devnet-red-team-proof.json`

`npm run devnet:red-team` generates fresh devnet receipts when the deployer wallet has devnet SOL. It uses DemoUSD, a test SPL mint, and writes `network: "devnet"`, `source: "fresh-devnet"`, and `proof_type: "devnet-red-team"` into the public proof bundle.

`npm run proof:latest` preserves a fresh devnet red-team bundle if one is already present. To regenerate the deterministic fixture bundle instead, run:

```bash
VAJRA_FORCE_FIXTURE_PROOF=1 npm run proof:latest
```
