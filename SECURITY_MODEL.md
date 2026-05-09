# Vajra Security Model

## Security Boundary

Vajra's security boundary is the Solana program. The delegated agent signer can request a spend, but cannot directly transfer treasury funds.

The key invariant is:

```text
vault authority = PolicyPDA
```

Because the SPL vault is owned by the PolicyPDA, a raw SPL transfer signed by the agent fails. The agent can only spend through `execute_guarded_transfer`, and that instruction must pass all onchain policy checks before the program signs the transfer.

## Controls

Vajra enforces:

- destination allowlist
- allowed mint
- per-transaction cap
- total budget
- periodic budget
- velocity limit
- expiry slot
- revoke flag
- vault owner check
- vault balance check
- owner-only policy update
- owner-only recovery withdrawal

## Failed Transaction Proof

Blocked spends fail before funds move. Demo and proof tooling should show:

- attempted amount
- attempted destination
- triggered rule
- transaction signature when available
- logs or error summary
- vault balance before and after
- avoided loss

For blocked demo transactions intended to produce signatures, scripts may use `sendRawTransaction` with `skipPreflight: true`. This is not used as a security assumption; it is a demo/proof technique so the failed transaction can be inspected onchain when the cluster accepts it.

The devnet proof package includes `proofs/devnet-blocked-verification.json`, which records failed status, guard or custom-error evidence, zero inner token transfers, and unchanged vault balances for blocked attempts.

## Owner Recovery

The owner can withdraw remaining vault funds to an owner-controlled token account for the allowed mint. This supports recovery after revoke, expiry, or explicit owner action.

This does not weaken the agent-spend guarantee: the delegated signer still cannot withdraw and still cannot raw-drain the vault. The owner remains the treasury administrator.

## Fee Posture

Fee configuration is stored on the policy but fee collection is disabled in the MVP transfer path. This avoids adding secondary token movement to the core demo while leaving a bounded configuration surface for later versions.

## Upgrade Authority

The current devnet program is upgradeable by the deployer authority for hackathon iteration. This is intentional: the program is under active development and may need patching during the submission window.

**Vajra's demonstrated security claim is agent-key isolation: the agent key alone cannot drain the vault.** This claim holds regardless of upgrade authority, because it is enforced onchain at the time each transaction executes.

Production deployment would require an audited program and locked or governance-controlled upgrade authority. Until then, the program should be treated as a trusted-deployer devnet prototype, not a production treasury primitive.

## Known Limitations

- Vajra currently supports SPL token vaults only.
- Destination allowlisting is token-account based.
- Failed transaction events should not be treated as durable records; use logs, errors, signatures, and proof exports.
- Policy account migrations are not implemented for an already deployed production program. This MVP uses a clean account version.
- Fee collection is not active in the transfer path.
- Devnet deployment is prepared separately and is not performed by the build process.
- Owner key compromise remains an owner-side treasury risk.
- Allowed destination compromise is out of scope; Vajra enforces the allowlist but cannot determine whether an allowed recipient later behaves badly.
- Token-program behavior is assumed to follow SPL token semantics.
- Demo fixtures are evidence examples, not a substitute for reviewing live deployment configuration.
