# Submission Notes

Live demo: https://usevajra.xyz
GitHub: https://github.com/Vinaystwt/vajra

One-liner:

Vajra gives Solana agents an allowance, not the keys.

150-word description:

Vajra is a non-custodial allowance vault for Solana automated signers. Operators fund an SPL vault owned by a program-derived PolicyPDA, assign bounded spending mandates to an agent key, and let the agent request payments without ever holding vault authority. The program enforces destination allowlists, per-transaction caps, total budgets, periodic budgets, velocity limits, expiry, revoke, and owner recovery before funds move. Every allowed or blocked attempt can be exported as a verifiable receipt. The demo compares a raw-wallet path, where a hot agent key can drain funds, with the Vajra path, where the same unsafe spend is blocked and the vault balance stays unchanged.

30-second pitch:

Raw agent wallets are convenient until the key leaks or the agent makes a bad call. Vajra gives the agent an allowance instead of the keys. The vault is owned by the program, the policy is onchain, and merchants or auditors can verify each payment from receipts and public transaction data.

Top differentiators:

- PolicyPDA owns the vault.
- Agent key never holds vault authority.
- Blocked attempts are proof, not just logs.
- Merchant verifier turns signatures into receipts.
- Mandates make agent allowances understandable.

Proof points:

- Devnet deployment exists.
- Rust tests cover guard behavior.
- SDK (`@vinaystwt/vajra-sdk@0.1.0`) and MCP (`@vinaystwt/vajra-mcp@0.1.0`) are published on npm.
- Red Team Sandbox compares raw-wallet drain against Vajra block.
- Proof artifacts include JSON, Markdown, and CSV receipts.

Bounty fit:

- Stablecoin agent spend: DemoUSD shows stablecoin-style allowance vault flows.
- Autonomous onchain agent: local example demonstrates simulate, execute, verify.
- MCP agent tools: MCP exposes simulation, execution, mandates, verification, receipts, and red-team fixture tools.
