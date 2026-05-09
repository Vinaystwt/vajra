# @vinaystwt/vajra-mcp

MCP server that exposes Vajra policy-vault operations as tools for AI agents.

Uses `@vinaystwt/vajra-sdk` internally. Does not duplicate Anchor account derivation or policy logic.

**Note:** Vajra operates over DemoUSD (test SPL token) on Solana devnet. Not a production treasury primitive.

## Install / Run

```bash
# Via npx (no install needed)
npx @vinaystwt/vajra-mcp

# Or install globally
npm install -g @vinaystwt/vajra-mcp
vajra-mcp
```

## Available Tools

- `vajra_create_policy` — Create a PolicyPDA with budget, cap, period, velocity, expiry, agent key
- `vajra_get_policy` — Fetch current policy state
- `vajra_simulate_spend` — Dry-run against all guards without submitting
- `vajra_execute_spend` — Execute a guarded transfer from vault
- `vajra_execute_guarded_spend` — Same as execute_spend (explicit alias)
- `vajra_revoke_policy` — Owner-only: permanently disable policy
- `vajra_get_audit_trail` — Retrieve transfer history with guard outcomes
- `vajra_withdraw_funds` — Owner-only: recover remaining vault funds
- `vajra_export_proof` — Export proof packet of blocked and allowed attempts
- `vajra_list_mandates` — List available agent mandate templates
- `vajra_get_mandate` — Fetch a specific mandate by ID
- `vajra_verify_payment` — Classify a transaction signature (live or fixture)
- `vajra_export_receipt` — Export receipt JSON + Markdown for a transaction
- `vajra_explain_receipt` — Explain a Vajra receipt
- `vajra_run_red_team_fixture` — Run the blocked/allowed fixture pair

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SOLANA_RPC` | `http://127.0.0.1:8899` | Solana JSON-RPC endpoint |
| `SOLANA_CLUSTER` | `localnet` | `localnet`, `devnet`, `testnet`, `mainnet-beta` |
| `VAJRA_KEYPAIR` | ephemeral | Absolute path to keypair JSON (optional for read-only) |

If `VAJRA_KEYPAIR` is omitted, the server creates an ephemeral signer — sufficient for read-only tools and schema smoke tests, not for state-changing operations.

## MCP Client Config Example

```json
{
  "mcpServers": {
    "vajra": {
      "command": "npx",
      "args": ["@vinaystwt/vajra-mcp"],
      "env": {
        "SOLANA_RPC": "https://api.devnet.solana.com",
        "SOLANA_CLUSTER": "devnet",
        "VAJRA_KEYPAIR": "/absolute/path/to/keypair.json"
      }
    }
  }
}
```
