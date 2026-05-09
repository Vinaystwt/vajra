# Vajra MCP

Package: `@vinaystwt/vajra-mcp` · v0.1.0 · [npm](https://www.npmjs.com/package/@vinaystwt/vajra-mcp)

Path: `packages/mcp`

## Install / Run

```bash
# Via npx — no install needed
npx @vinaystwt/vajra-mcp

# Or install globally
npm install -g @vinaystwt/vajra-mcp
vajra-mcp
```

The MCP server exposes Vajra SDK operations as tools. Uses `@vinaystwt/vajra-sdk` internally and does not duplicate Anchor logic.

## Tools

- `vajra_create_policy`
- `vajra_get_policy`
- `vajra_simulate_spend`
- `vajra_execute_spend`
- `vajra_execute_guarded_spend`
- `vajra_revoke_policy`
- `vajra_get_audit_trail`
- `vajra_withdraw_funds`
- `vajra_export_proof`
- `vajra_list_mandates`
- `vajra_get_mandate`
- `vajra_verify_payment`
- `vajra_export_receipt`
- `vajra_explain_receipt`
- `vajra_run_red_team_fixture`

## Example Transcript

Agent: Can I pay this API 50 DemoUSD?

Tool: `vajra_simulate_spend`

Result: allowed when the destination is allowlisted, amount is under cap, and period/velocity checks pass.

Agent: Can I send 5,000 DemoUSD to an unknown wallet?

Tool: `vajra_simulate_spend`

Result: blocked with `destination` or `perTxCap`, plus a receipt-ready explanation.

Agent: Verify the payment before the API returns data.

Tool: `vajra_verify_payment`

Result: `vajra_allowed`, `vajra_blocked`, `not_vajra`, or `unknown`.

## Verify

```bash
cd packages/mcp
npm install
npm run build
npm test
```

## Run

```bash
export SOLANA_RPC=http://127.0.0.1:8899
export SOLANA_CLUSTER=localnet
export VAJRA_KEYPAIR=/absolute/path/to/keypair.json
node dist/src/server.js
```
