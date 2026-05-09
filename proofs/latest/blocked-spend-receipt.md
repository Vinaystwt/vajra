# Vajra Execution Receipt

- Receipt: devnet:5yWAEdtjihJjGWk9phXLvAG831r9yqvT7qrPgbmaFXoS5whsFSLLuuLLFGnUmKpAE22RWvFxPk3NDn1oCqfEqEf8
- Network: devnet
- Signature: 5yWAEdtjihJjGWk9phXLvAG831r9yqvT7qrPgbmaFXoS5whsFSLLuuLLFGnUmKpAE22RWvFxPk3NDn1oCqfEqEf8
- Status: blocked
- Attempt: blocked_spend
- Rule: perTxCap
- Requested amount: 50000000
- Actual inner transfer amount: 0
- Inner token transfers: 0
- Vault before: 45000000
- Vault after: 45000000
- Vault delta: 0
- Policy: vCeG5UbD8BwpgDCtEetj5dp2haR1Vd6cDPFBhCvQ8yp
- Vault: GY9NCwVb5e4wRhikpLmSQELMr5ynjdFdDD2vdYvMwBMb
- Destination: ETdQsQEH4MsJWfku4s7QjWbpQW31SzRqWVFwDwoK9X3G
- Explorer: https://explorer.solana.com/tx/5yWAEdtjihJjGWk9phXLvAG831r9yqvT7qrPgbmaFXoS5whsFSLLuuLLFGnUmKpAE22RWvFxPk3NDn1oCqfEqEf8?cluster=devnet
- Receipt hash: 86061c55fd156b30bb9f7dcb54f5803e4633a16ae4c025145fe03e6e80cfb8ec

## Verification

Verified: yes

Method: rpc_verifier_plus_measured_vault_balance

Checked at: 2026-05-09T03:17:24.878Z

## Logs

- Program log: VAJRA_GUARD:1:revoked_check
- Program log: VAJRA_GUARD:2:expiry_check
- Program log: VAJRA_GUARD:3:signer_check
- Program log: VAJRA_GUARD:4:amount_zero_check
- Program log: VAJRA_GUARD:5:per_tx_cap_check
- Program log: AnchorError thrown in programs/vajra/src/instructions/execute_guarded_transfer.rs:80. Error Code: PerTxCapExceeded. Error Number: 6007. Error Message: Amount exceeds per-transaction cap.
- Program APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD failed: custom program error: 0x1777
