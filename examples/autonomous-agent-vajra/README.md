# Autonomous Agent Vajra Example

This local fixture example demonstrates the policy-before-spend flow for an autonomous onchain agent:

1. Load an Agent Mandate.
2. Compile it into ordinary Vajra policy fields.
3. Simulate an allowed payment.
4. Treat an attacker or wrong-destination payment as blocked.
5. Verify both outcomes as receipts.

It does not use an external wallet/data provider. Production adapters can swap in their own signer, policy account, and merchant verifier while keeping the same Vajra receipt flow.

Run:

```bash
npm install
npm run demo
```
