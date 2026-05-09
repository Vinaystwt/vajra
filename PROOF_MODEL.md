# Vajra Proof Model

See `docs/proof-model.md` for the canonical schema and interpretation rules.

Proof examples:

- `proofs/demo-proof.example.json`
- `proofs/blocked-drain.example.md`
- `proofs/audit.example.csv`
- `proofs/signatures.example.json`

Generate local proof artifacts with:

```bash
npm run demo:full
npm run proof:export -- proofs/latest-demo-results.json demo-proof-regenerated
```

Devnet proof artifacts from the latest deployment/demo:

```text
proofs/devnet-proof.json
proofs/devnet-incident-report.md
proofs/devnet-audit.csv
proofs/devnet-signatures.json
proofs/devnet-blocked-verification.json
```

The blocked verification file records failed status, guard/custom-error evidence, zero inner token transfers, and unchanged vault balance for blocked devnet attempts.

## Canonical Receipts

The receipt schema lives at `proofs/schema/vajra-receipt.schema.json`.

Generate the latest deterministic proof bundle:

```bash
npm run proof:latest
```

Generate a fresh devnet-backed red-team proof bundle:

```bash
npm run devnet:red-team
```

Outputs:

- `proofs/latest/receipts.json`
- `proofs/latest/receipts.csv`
- `proofs/latest/allowed-spend-receipt.md`
- `proofs/latest/blocked-spend-receipt.md`
- `proofs/latest/red-team-comparison.json`
- `proofs/latest/red-team-comparison.md`
- `proofs/latest/allowed-payment.json`
- `proofs/latest/raw-wallet-drain.json`
- `proofs/latest/blocked-drain.json`
- `proofs/latest/verifier-output.json`
- `proofs/latest/explorer-links.json`

Receipts include status, rule, requested amount, observed inner token transfers, vault delta, logs, and a deterministic receipt hash. Fixture receipts are labeled `fixture`; devnet receipts are labeled `devnet`.
