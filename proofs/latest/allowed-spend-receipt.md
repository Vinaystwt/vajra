# Vajra Execution Receipt

- Receipt: devnet:382Mj4AgfWcMcmzaMZebrbmbBBGTDezghXWssJnFBy6y33ZkpT48uFHs7toerSFmPmGuAVtefM1CWvG2miDYXvAo
- Network: devnet
- Signature: 382Mj4AgfWcMcmzaMZebrbmbBBGTDezghXWssJnFBy6y33ZkpT48uFHs7toerSFmPmGuAVtefM1CWvG2miDYXvAo
- Status: allowed
- Attempt: allowed_spend
- Rule: all_clear
- Requested amount: 5000000
- Actual inner transfer amount: 5000000
- Inner token transfers: 1
- Vault before: 50000000
- Vault after: 45000000
- Vault delta: -5000000
- Policy: vCeG5UbD8BwpgDCtEetj5dp2haR1Vd6cDPFBhCvQ8yp
- Vault: GY9NCwVb5e4wRhikpLmSQELMr5ynjdFdDD2vdYvMwBMb
- Destination: ETdQsQEH4MsJWfku4s7QjWbpQW31SzRqWVFwDwoK9X3G
- Explorer: https://explorer.solana.com/tx/382Mj4AgfWcMcmzaMZebrbmbBBGTDezghXWssJnFBy6y33ZkpT48uFHs7toerSFmPmGuAVtefM1CWvG2miDYXvAo?cluster=devnet
- Receipt hash: ad7498dee090fde52fa70502f0650672844558feaa51f03de35b152f821eafc1

## Verification

Verified: yes

Method: rpc_verifier_plus_measured_vault_balance

Checked at: 2026-05-09T03:17:16.787Z

## Logs

- Program log: VAJRA_GUARD:5:per_tx_cap_check
- Program log: VAJRA_GUARD:6:budget_check
- Program log: VAJRA_GUARD:6B:period_budget_check
- Program log: VAJRA_GUARD:6C:velocity_check
- Program log: VAJRA_GUARD:7:destination_rule_check
- Program log: VAJRA_GUARD:8:destination_mint_check
- Program log: VAJRA_GUARD:9:vault_mint_check
- Program log: VAJRA_GUARD:10:vault_owner_check
- Program log: VAJRA_GUARD:11:vault_balance_check
- Program log: VAJRA_GUARD:12:all_clear_cpi_transfer
