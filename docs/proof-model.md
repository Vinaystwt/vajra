# Vajra Proof Model

Vajra proof packets describe attempted agent spends and their effect on the policy vault.

The proof model is designed for:

- demo narration
- audit export
- frontend proof explorer views
- incident-style blocked-spend reports

## Packet

```ts
interface ProofPacket {
  product: "Vajra";
  headline: "Your agent can spend. It cannot drain.";
  generatedAt: string;
  cluster: string;
  attempts: ProofAttempt[];
}
```

## Attempt

```ts
interface ProofAttempt {
  policy: string;
  agent: string;
  vault: string;
  mint: string;
  attemptType: string;
  amount: string;
  destination: string;
  result: "allowed" | "blocked";
  ruleTriggered: string;
  signature?: string;
  explorerUrl?: string;
  vaultBalanceBefore: string;
  vaultBalanceAfter: string;
  vaultDelta: string;
  avoidedLoss: string;
  timestamp: string;
  logs: string[];
  errorSummary?: string;
}
```

## Rule Triggers

Common rule triggers:

- `all_clear`
- `perTxCap`
- `totalBudget`
- `periodBudget`
- `velocity`
- `destination`
- `mint`
- `expiry`
- `revoked`
- `vaultAuthority`
- `vaultBalance`
- `ownerRecovery`
- `simulation`

## Export Formats

The proof exporter writes:

- JSON proof packet
- Markdown report
- CSV audit export

Run:

```bash
npm run demo:full
npm run proof:export -- proofs/latest-demo-results.json demo-proof-regenerated
```

## Interpretation

Allowed attempts should show a negative vault delta equal to the amount moved.

Blocked attempts should show:

- `result = blocked`
- a clear `ruleTriggered`
- `vaultDelta = 0`
- `vaultBalanceBefore == vaultBalanceAfter`
- `avoidedLoss` equal to the blocked amount

That is the core product proof: the failed transaction or blocked attempt is visible, and the vault balance remains unchanged.
