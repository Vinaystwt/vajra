# Bounty Track Fit

## Stablecoin Agent Spend

Positioning:

Stablecoin allowance vaults for automated agents. Operators fund an SPL vault, assign bounded spending mandates, and every payment attempt produces a verifiable receipt.

Implementation:

- Demo token: DemoUSD test SPL mint
- Mandate: `stablecoin-agent`
- Example: `examples/stablecoin-agent-spend`
- Receipts: `proofs/latest/receipts.json`

No issuer partnership, named issuer stablecoin use or mainnet stablecoin deployment is claimed.

## Autonomous Onchain Agent

Positioning:

An automated signer can simulate, request spend, and verify results without controlling vault authority.

Implementation:

- Example: `examples/autonomous-agent-vajra`
- Mandate loading
- Simulated allowed payment
- Blocked attacker path
- Receipt verification

The example is local fixture-based. Production wallet/data adapters can be swapped in.

## MCP Agent Tools

Positioning:

Agents should simulate before spend and verify after spend.

Implementation:

- `vajra_list_mandates`
- `vajra_get_mandate`
- `vajra_simulate_spend`
- `vajra_execute_guarded_spend`
- `vajra_verify_payment`
- `vajra_export_receipt`
- `vajra_run_red_team_fixture`

These tools are JSON-friendly and label fixture/devnet context honestly.
