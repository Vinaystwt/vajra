# Vajra Proof Report

Your agent can spend. It cannot drain.

Generated: 2026-05-05T18:30:17.229Z

Cluster: devnet

| Attempt              |   Amount | Result  | Rule           | Vault Before | Vault After | Avoided Loss |
| -------------------- | -------: | ------- | -------------- | -----------: | ----------: | -----------: |
| good-spend           |  5000000 | allowed | all_clear      |    100000000 |    95000000 |            0 |
| velocity-attack      |  1000000 | blocked | velocity       |     95000000 |    95000000 |      1000000 |
| over-cap             | 50000000 | blocked | perTxCap       |     95000000 |    95000000 |     50000000 |
| wrong-destination    |  5000000 | blocked | destination    |     95000000 |    95000000 |      5000000 |
| period-fill-1        | 10000000 | allowed | all_clear      |     95000000 |    85000000 |            0 |
| period-fill-2        | 10000000 | allowed | all_clear      |     85000000 |    75000000 |            0 |
| period-budget-attack |  1000000 | blocked | periodBudget   |     75000000 |    75000000 |      1000000 |
| withdraw             |  5000000 | allowed | ownerRecovery  |     75000000 |    70000000 |            0 |
| revoked-policy       |  1000000 | blocked | revoked        |     70000000 |    70000000 |      1000000 |
| raw-drain            | 50000000 | blocked | vaultAuthority |     70000000 |    70000000 |     50000000 |

## Notes

Allowed spends reduce the vault balance. Blocked spends leave the vault balance unchanged. Raw drain attempts fail because the delegated signer is not the vault authority.
