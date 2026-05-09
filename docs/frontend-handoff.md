# Frontend Handoff

This document defines the backend artifacts the future premium frontend should consume. This pass does not implement the premium frontend.

## Product Pages

The future frontend should include:

- Landing
- War Room
- Policy Builder
- Policy Detail
- Proof Explorer
- SDK page
- Use Cases

## Data Contracts

Static frontend-ready files to generate under `app/public/`:

- `demo-state.example.json`
- `proof-events.example.json`
- `sdk-snippets.json`
- `policy-templates.json`
- `use-cases.json`

## Policy Fields

The frontend should expect policy state with:

- owner
- delegatedSigner
- allowedMint
- totalBudget
- spentAmount
- perTxCap
- expirySlot
- revoked
- policyId
- policyVersion
- periodBudget
- periodSpent
- periodStartSlot
- periodDurationSlots
- minSlotInterval
- lastSpendSlot
- feeBps
- feeRecipient

## Proof Event Shape

Proof events should include:

- policy
- agent
- vault
- mint
- attemptType
- amount
- destination
- result
- ruleTriggered
- signature
- explorerUrl
- vaultBalanceBefore
- vaultBalanceAfter
- vaultDelta
- avoidedLoss
- timestamp
- logs
- errorSummary

## Frontend Constraints

The frontend should show Vajra as an onchain spend firewall. It should not describe Vajra as a generic wallet, multisig, custody service, agent marketplace, DeFi bot, session-key wrapper, backend allowlist, or audit-only tool.

The core UI proof should be simple:

- allowed spend moves funds
- blocked spend does not move funds
- raw drain fails because the agent is not the vault authority
