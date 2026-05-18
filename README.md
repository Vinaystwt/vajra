<div align="center">

# Vajra

**On-chain spend policy enforcement for Solana automated signers.**

Give your agent an allowance. Not the keys.

[![Live Site](https://img.shields.io/badge/site-usevajra.xyz-00E5FF?style=flat-square)](https://usevajra.xyz)
[![SDK](https://img.shields.io/badge/npm-vajra--sdk-red?style=flat-square)](https://www.npmjs.com/package/@vinaystwt/vajra-sdk)
[![MCP](https://img.shields.io/badge/npm-vajra--mcp-red?style=flat-square)](https://www.npmjs.com/package/@vinaystwt/vajra-mcp)
[![Devnet](https://img.shields.io/badge/devnet-APn6AN7F-blueviolet?style=flat-square)](https://explorer.solana.com/address/APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD?cluster=devnet)
[![Tests](https://img.shields.io/badge/tests-32%20passing-brightgreen?style=flat-square)](#testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## The Problem

Automated signers — trading bots, payment agents, DAO ops accounts, AI agents — need to spend tokens. The default approach is to give the agent keypair direct authority over the vault. That's a loaded gun:

- **Key leak** → full treasury drained in a single transaction
- **Agent bug** → unchecked spend with no enforcement boundary
- **Backend allowlists** → bypassable by anyone who holds the key

The enforcement boundary needs to live on-chain, not in your backend.

---

## The Solution

Vajra places a **PolicyPDA** between the agent and the vault. The PolicyPDA owns the SPL vault ATA and is the only account that can sign a CPI token transfer. The agent key is a delegated signer — it can *request* a transfer, but it cannot *authorize* one.

When the agent calls `execute_guarded_transfer`, the Vajra program runs 12 sequential guards:

| Guard | What it checks |
|---|---|
| `revoke` | Policy has not been revoked by the owner |
| `expiry` | Policy has not expired |
| `delegated_signer` | Caller matches the registered agent key |
| `amount > 0` | Non-zero transfer requested |
| `per_tx_cap` | Single transfer ≤ configured cap |
| `total_budget` | Cumulative spend ≤ total budget |
| `period_budget` | Spend in current window ≤ periodic limit |
| `velocity_limit` | Transfers per minute ≤ velocity cap |
| `destination_rule` | Destination is on the on-chain allow list |
| `destination_mint` | Destination ATA mint matches policy mint |
| `vault_mint` | Vault mint matches policy mint |
| `vault_authority` | Vault is owned by this PolicyPDA |
| `vault_balance` | Vault holds sufficient balance |

All 13 checks run atomically. If every guard passes, the program CPIs the SPL transfer using the PolicyPDA's signer seeds. If any guard fails, the transaction reverts — **`vault_delta` stays zero**.

---

## Architecture

![Vajra Architecture](assets/diagrams/architecture.svg)

**Core accounts:**

| Account | Role |
|---|---|
| `PolicyPDA` | Vault authority + policy state (budget, cap, velocity, expiry, revoke, allowlist) |
| `Vault ATA` | SPL token account — authority is the PolicyPDA, never the agent |
| `DestinationRulePDA` | One per permitted destination; on-chain allow list record |

![Attack Comparison](assets/diagrams/attack-comparison.svg)

---

## On-Chain Proof

Three devnet transactions — publicly verifiable on Solana Explorer.

| Scenario | Signature | Result |
|---|---|---|
| Raw key drain (no Vajra) | [`wTo4fANW…`](https://explorer.solana.com/tx/wTo4fANWAG6P3azWJ4W3MQVYn5rYpZp6s3ZijsKsN4xGP2ACCGieZgtYKXZ6wiFNW3WTek9Paeco9bozGye95p3?cluster=devnet) | 50M tokens drained |
| Vajra blocks over-limit drain | [`5yWAEdtj…`](https://explorer.solana.com/tx/5yWAEdtjihJjGWk9phXLvAG831r9yqvT7qrPgbmaFXoS5whsFSLLuuLLFGnUmKpAE22RWvFxPk3NDn1oCqfEqEf8?cluster=devnet) | `vault_delta = 0`, `inner_token_transfers = 0` |
| Valid payment allowed | [`24SD6Cdp…`](https://explorer.solana.com/tx/24SD6CdpkJqJj5EHW2cMULVoXU5qwURrgohidQ25jhLPLYHSgANCnxbaAdZhPzREsLJni7g4bu6XR9tNsuEAfREL?cluster=devnet) | Transfer succeeds within policy |

The `vault_delta = 0` on the blocked transaction is cryptographic proof that the vault balance did not change — not a simulation, not a log, an on-chain finality record.

Proof artifacts: [`proofs/`](proofs/) · [Receipt verifier flow](assets/diagrams/receipt-verifier-flow.svg)

---

## SDK

```bash
npm install @vinaystwt/vajra-sdk
```

```typescript
import { VajraClient, getMandate, mandateToPolicyConfig } from "@vinaystwt/vajra-sdk";

const client = new VajraClient({ rpc: "https://api.devnet.solana.com" });

// Use a pre-built agent mandate
const mandate = getMandate("stablecoin-agent");
const policyConfig = mandateToPolicyConfig(mandate!);

// Simulate before spending — no transaction, no gas
const sim = await client.simulateSpend({
  policy: policyAddress,
  amount: BigInt(100_000_000),
  destination: destAta,
});

if (sim.allowed) {
  await client.spend({
    policy: policyAddress,
    amount: BigInt(100_000_000),
    destination: destAta,
    signer: agentWallet,
  });
}
```

Full SDK reference → [`SDK.md`](SDK.md) · [`packages/sdk/README.md`](packages/sdk/README.md)

---

## MCP Server

Any MCP-capable AI agent (Claude, GPT-4, custom) can call Vajra tools directly:

```bash
npx @vinaystwt/vajra-mcp
```

**15 tools exposed:**

- `simulate_spend` — check whether a spend would pass policy before sending
- `execute_spend` — submit a guarded transfer
- `list_mandates` — browse pre-built agent allowance packages
- `verify_receipt` — verify a transfer receipt against on-chain state
- `red_team_fixtures` — load the drain vs. block proof comparison
- `export_proof` — export proof artifacts as JSON / Markdown / CSV

Compatible with any MCP-capable agent framework. See [`MCP.md`](MCP.md).

---

## Agent Mandates

A mandate is a human-readable allowance package that compiles into Vajra policy fields. Instead of manually configuring budgets and caps, you pick a mandate that matches your agent's role:

| Mandate | Use case |
|---|---|
| `stablecoin-agent` | Stablecoin payment agent with conservative limits |
| `defi-bot` | DeFi rebalancer with higher velocity, tighter destinations |
| `dao-ops` | DAO treasury disbursements with monthly budget |
| `market-maker` | High-frequency with per-tx cap and rolling window |
| `api-buyer` | Metered API payments, per-call limit |
| `payroll-ops` | Periodic payroll disbursements to fixed addresses |

See [`AGENT_MANDATES.md`](AGENT_MANDATES.md) · [`mandates/`](mandates/)

---

## Features

- PolicyPDA-owned SPL vault — agent key has zero vault authority
- 13 on-chain guards enforced atomically in one instruction
- Per-transaction spend cap
- Total budget enforcement
- Periodic (rolling window) budget
- Velocity limiting (transfers per minute)
- On-chain destination allow list (DestinationRulePDA per permitted address)
- Policy expiry
- Owner revoke and emergency recovery
- Deterministic receipts (JSON / Markdown / CSV)
- Merchant payment verification — `vajra_allowed` / `vajra_blocked` / `not_vajra`
- Red-team proof sandbox — side-by-side raw drain vs. Vajra block
- Agent mandate system — human-readable allowance specs
- TypeScript SDK (`@vinaystwt/vajra-sdk`)
- MCP server (`@vinaystwt/vajra-mcp`)
- x402-style HTTP payment reference integration (`examples/x402-vajra`)
- React frontend — Attack Lab, Proof Explorer, Developer Simulator

---

## Repository Structure

```
vajra/
├── programs/vajra/            Anchor program (Rust)
│   └── src/instructions/      execute_guarded_transfer + supporting instructions
├── packages/
│   ├── sdk/                   @vinaystwt/vajra-sdk TypeScript SDK
│   └── mcp/                   @vinaystwt/vajra-mcp MCP server
├── app/                       Vite + React frontend
│   └── src/pages/             Landing, AttackLab, Proofs, Developers, WhyVajra
├── examples/
│   ├── autonomous-agent-vajra/  SDK simulate → spend → verify flow
│   ├── stablecoin-agent-spend/  DemoUSD mandate flow
│   └── x402-vajra/              Local x402-style payment reference
├── scripts/                   Devnet setup, demo runner, proof export
├── proofs/                    Proof artifacts (JSON, Markdown, CSV)
├── mandates/                  Agent mandate JSON definitions
└── assets/diagrams/           Architecture and flow diagrams (SVG)
```

---

## Development

```bash
# Install dependencies
npm install

# Build Anchor program
anchor build

# Run Rust tests
cargo test --manifest-path programs/vajra/Cargo.toml

# Build TypeScript packages
npm run build

# Build frontend
cd app && npm run build

# Run devnet demo
npm run devnet:demo

# Export proof artifacts
npm run proof:latest
```

---

## Testing

All test suites pass against the deployed devnet program.

| Suite | Command | Coverage |
|---|---|---|
| Rust / litesvm | `cargo test --manifest-path programs/vajra/Cargo.toml` | 32 tests — all 13 guards |
| SDK | `cd packages/sdk && npm test` | mandate, receipt, verifier |
| MCP | `cd packages/mcp && npm test` | 15-tool smoke test |
| Frontend | `cd app && npm run build` | TypeScript + Vite |
| Proof fixtures | `npm run verify:fixtures` | receipt determinism |
| Red-team sandbox | `npm run demo:red-team` | drain vs. block comparison |

---

## Security Model

**What Vajra guarantees:** The agent key alone cannot authorize an SPL transfer from a Vajra-managed vault. The PolicyPDA is the vault authority. The program checks every policy guard before any CPI token transfer executes.

**What Vajra does not claim:** Protection against compromised owners, compromised Solana validators, or undiscovered bugs in the program itself.

**Upgrade authority:** The devnet program is upgradeable for active development. Production deployment requires an external program audit and locked or governance-controlled upgrade authority.

Full security model → [`SECURITY_MODEL.md`](SECURITY_MODEL.md)

---

## Roadmap

**Near-term**
- Mainnet deployment with USDC/USDT support
- External security audit and locked upgrade authority
- Hosted receipt verifier API
- SDK adapters for DeFi bot and agent platform integrations
- Design partner pilots with DeFi protocol teams and autonomous agent frameworks

**Integrations**
- Wallet and agent platform integrations
- DeFi protocol composability (CPI-ready design in place)
- x402/HTTP-native payments compatibility

**Protocol**
- Protocol fee on guarded transfers (optional, owner-configurable)
- Formal verification of core guard logic

---

## Links

| | |
|---|---|
| Website | [usevajra.xyz](https://usevajra.xyz) |
| npm — SDK | [@vinaystwt/vajra-sdk](https://www.npmjs.com/package/@vinaystwt/vajra-sdk) |
| npm — MCP | [@vinaystwt/vajra-mcp](https://www.npmjs.com/package/@vinaystwt/vajra-mcp) |
| Devnet program | [APn6AN7F… on Explorer](https://explorer.solana.com/address/APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD?cluster=devnet) |
| X | [@Vinaystwt](https://x.com/Vinaystwt) |

---

## License

[MIT](LICENSE)
