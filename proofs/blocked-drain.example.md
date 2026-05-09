# Vajra Proof Report

Your agent can spend. It cannot drain.

Generated: 2026-05-05T17:55:57.946Z

Cluster: local-dry-run

| Attempt              |   Amount | Result  | Rule           | Vault Before | Vault After | Avoided Loss |
| -------------------- | -------: | ------- | -------------- | -----------: | ----------: | -----------: |
| good-spend           |  5000000 | allowed | all_clear      |    100000000 |    95000000 |            0 |
| over-cap             | 50000000 | blocked | perTxCap       |     95000000 |    95000000 |     50000000 |
| wrong-destination    |  5000000 | blocked | destination    |     95000000 |    95000000 |      5000000 |
| velocity-attack      |  1000000 | blocked | velocity       |     95000000 |    95000000 |      1000000 |
| period-budget-attack | 30000000 | blocked | periodBudget   |     95000000 |    95000000 |     30000000 |
| revoked-policy       |  1000000 | blocked | revoked        |     95000000 |    95000000 |      1000000 |
| raw-drain            | 95000000 | blocked | vaultAuthority |     95000000 |    95000000 |     95000000 |
| x402-pay             |  2000000 | allowed | all_clear      |     95000000 |    93000000 |            0 |
| simulate             |  1000000 | allowed | simulation     |     93000000 |    93000000 |      1000000 |
| withdraw             | 10000000 | allowed | ownerRecovery  |     93000000 |    83000000 |            0 |

## Notes

Allowed spends reduce the vault balance. Blocked spends leave the vault balance unchanged. Raw drain attempts fail because the delegated signer is not the vault authority.
