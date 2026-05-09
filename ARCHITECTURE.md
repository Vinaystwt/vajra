# Vajra Architecture

![Architecture Diagram](assets/diagrams/architecture.svg)

## Overview

Vajra is an onchain spend firewall for Solana agents. Agents can initiate payments, but the treasury assets sit in a program-owned SPL token vault. The vault authority is the PolicyPDA, so the agent key cannot directly drain funds.

## Core Accounts

### PolicyPDA

The PolicyPDA stores the enforcement policy:

- owner
- delegated signer
- allowed mint
- total budget and spent amount
- per-transaction cap
- expiry slot
- revoke flag
- policy id and version
- periodic budget state
- velocity limit state
- optional fee configuration

The PolicyPDA is derived with:

```text
["vajra_policy", owner, policy_id]
```

### Vault ATA

The vault is an SPL associated token account for the allowed mint. Its authority is the PolicyPDA, not the owner and not the delegated signer.

### DestinationRulePDA

Each allowed destination token account has a DestinationRulePDA derived with:

```text
["vajra_dest", policy, destination_token_account]
```

The destination token account must match the policy allowed mint.

## Spend Flow

`execute_guarded_transfer` checks:

- policy is not revoked
- policy has not expired
- delegated signer matches
- amount is greater than zero
- amount is within per-transaction cap
- amount is within total budget
- amount is within the current period budget, when enabled
- spend respects the minimum slot interval, when enabled
- destination rule exists
- destination mint matches the allowed mint
- vault mint matches the allowed mint
- vault owner is the PolicyPDA
- vault has enough balance

Only after all checks pass does the program sign a CPI transfer from the vault using PolicyPDA seeds.

## Periodic Budgets

Periodic budgets are disabled when `period_budget == 0` or `period_duration_slots == 0`.

When enabled, the program compares the current slot to `period_start_slot + period_duration_slots`. If the period has elapsed, the program resets `period_start_slot` to the current slot and `period_spent` to zero before checking the new spend.

Successful transfers update `period_spent`.

## Velocity Limits

Velocity limits are disabled when `min_slot_interval == 0`.

When enabled, the program blocks a transfer if `last_spend_slot != 0` and the current slot is earlier than `last_spend_slot + min_slot_interval`.

Successful transfers update `last_spend_slot`.

## Simulation

`simulate_guarded_transfer` runs the same guard checks as `execute_guarded_transfer`, emits a `SimulationChecked` event on pass, and does not move tokens or mutate spend state. Failed simulation returns the same custom error style as execution.

The SDK also provides account/RPC precheck simulation for faster local explanations.

## Owner Recovery

`withdraw_funds` lets the policy owner withdraw remaining vault funds to an owner-controlled token account for the allowed mint. The delegated signer cannot withdraw.

Owner withdrawal is available as explicit owner recovery instead of only after revoke or expiry. This is acceptable because the owner is the policy authority that originally funded and controls the treasury boundary; Vajra's core risk model is delegated agent spend, not owner custody removal.

## Protocol Fee Configuration

The policy stores optional fee configuration:

- `fee_bps`
- `fee_recipient`

`fee_bps` defaults to zero and is bounded by `MAX_FEE_BPS = 1000`. Fee collection is stored but disabled in the MVP transfer path so the primary spend firewall flow remains simple and predictable.

## Events

Current events:

- `PolicyCreated`
- `VaultFunded`
- `DestinationAdded`
- `SpendAllowed`
- `TransferAllowed`
- `PolicyUpdated`
- `PolicyRevoked`
- `FundsWithdrawn`
- `PeriodReset`
- `VelocityLimitTriggered`
- `SimulationChecked`

Failed transactions should be interpreted through custom errors and guard logs, because failed-transaction events are not a persistence layer.
