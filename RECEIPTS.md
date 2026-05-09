# Vajra Execution Receipts

Vajra receipts are canonical records for allowed spends, blocked spends, raw-wallet drain fixtures, and verification-only checks.

Receipt schema:

- `receipt_version`: current version, `1.0`
- `network`: `devnet`, `localnet`, or `fixture`
- `program_id`: expected Vajra program
- `signature`: transaction signature or fixture identifier
- `status`: `allowed`, `blocked`, `failed`, `raw_wallet_drained`, `not_vajra`, or `unknown`
- `requested_amount`: requested token amount as a string
- `actual_inner_transfer_amount`: observed token transfer amount when available
- `inner_token_transfers`: token transfer count from transaction metadata or fixture
- `rule_triggered`: guard or verification rule
- `vault_delta`: balance delta when known
- `receipt_hash`: deterministic hash over the receipt body

Schema file: `proofs/schema/vajra-receipt.schema.json`

Commands:

```bash
npm run proof:latest
npm run verify:fixtures
npm run verify:tx -- <signature>
npm run receipt:tx -- <signature>
npm run verify:tx -- --fixture blocked
npm run receipt:tx -- --fixture allowed
```

Receipts do not contain private keys or wallet secrets. Devnet receipts are evidence from public devnet data. Fixture receipts are deterministic examples and are labeled `fixture`.
