# Merchant Verification

Merchants can verify a Vajra-routed payment before delivering service.

The verifier checks:

- whether the transaction involved the expected Vajra program
- whether the transaction was allowed or blocked
- whether a blocked attempt failed before any token transfer
- whether the expected destination, amount, mint, policy, or vault matches
- whether the receipt hash is stable

Run against fixtures:

```bash
npm run verify:fixtures
```

Run against a devnet signature:

```bash
npm run verify:tx -- <signature>
npm run receipt:tx -- <signature>
```

Generate fresh devnet red-team signatures and verifier output:

```bash
npm run devnet:red-team
```

The generated verifier output is written to `proofs/latest/verifier-output.json`.

Verifier classifications:

- `vajra_allowed`: Vajra program involved and an inner SPL transfer was observed.
- `vajra_blocked`: Vajra program involved and the transaction failed with guard/error evidence.
- `not_vajra`: transaction does not involve Vajra.
- `unknown`: RPC data was missing or not enough evidence was available.

The verifier never trusts frontend labels. A merchant should pin the expected program id, destination, amount, mint, and policy where possible.
