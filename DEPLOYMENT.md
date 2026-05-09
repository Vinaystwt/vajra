# Vajra Devnet Readiness and Deployment Guide

This guide prepares a devnet deployment. Do not run `anchor deploy` unless deployment has been explicitly approved.

## Requirements

- Rust and Cargo
- Solana CLI
- Anchor CLI `1.0.2`
- Node.js and npm
- A devnet deployer keypair
- At least `3 SOL` on devnet for deployment and demo transactions

Check versions:

```bash
node --version
npm --version
solana --version
anchor --version
cargo --version
```

## Safety

Never commit:

- `.env`
- deployer keypairs
- demo keypairs
- live `demo-state.json`
- generated deploy artifacts with secrets

The demo reset flow creates a fresh `policy_id` instead of closing old accounts. This keeps old proofs inspectable.

## Readiness Check

```bash
npm run check:devnet
npm run check:deployer
```

The readiness checker verifies:

- `Anchor.toml`
- `declare_id!`
- program ID consistency
- build artifacts
- required scripts
- `SOLANA_RPC` posture

The deployer checker prints the deployer address and balance command.

Check SOL:

```bash
solana balance <DEPLOYER_PUBKEY> --url devnet
```

## Build

```bash
anchor build
cargo test --manifest-path programs/vajra/Cargo.toml
```

Expected build artifacts:

- `target/deploy/vajra.so`
- `target/idl/vajra.json`
- `target/types/vajra.ts`

## Deploy

Only after explicit approval:

```bash
anchor deploy \
  --provider.cluster devnet \
  --provider.wallet ~/.config/solana/id.json
```

Program ID:

```text
APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD
```

Explorer:

```text
https://explorer.solana.com/address/APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD?cluster=devnet
```

Latest recorded devnet deployment details are in:

```text
proofs/devnet-deployment.json
docs/devnet-deployment.md
```

## Devnet Demo Setup

After deployment approval and deploy:

```bash
npm run devnet:setup
```

This creates or reuses ignored local demo keypairs, creates DemoUSD, creates a policy, funds the PolicyPDA-owned vault, adds the first destination, and writes ignored `demo-state.json`.

## Devnet Demo

```bash
npm run devnet:demo
```

Individual spends:

```bash
SOLANA_RPC=https://api.devnet.solana.com ts-node scripts/agent-spend.ts 5 merchant_a
SOLANA_RPC=https://api.devnet.solana.com ts-node scripts/agent-spend.ts 50 merchant_a
SOLANA_RPC=https://api.devnet.solana.com ts-node scripts/agent-spend.ts 5 merchant_b
```

Blocked demo attempts may use `sendRawTransaction` with `skipPreflight: true` so the failed transaction can receive a signature and show guard logs. This is for proof/demo visibility, not a security assumption.

## Collect Explorer Links

Collect:

- program address
- policy PDA
- vault ATA
- allowed destination rule
- allowed spend signature
- blocked spend signatures
- raw drain failure signature, when available

The proof exporter can include Explorer URLs once real signatures are available.

## Export Proofs

Local deterministic proof:

```bash
npm run demo:full
npm run proof:export -- proofs/latest-demo-results.json devnet-ready-proof
```

Devnet proof wrapper:

```bash
npm run devnet:proof -- proofs/latest-demo-results.json devnet-proof
```

The canonical devnet demo writes:

```text
proofs/devnet-proof.json
proofs/devnet-incident-report.md
proofs/devnet-audit.csv
proofs/devnet-signatures.json
proofs/devnet-blocked-verification.json
```

## Reset Demo

```bash
SOLANA_RPC=https://api.devnet.solana.com ts-node scripts/reset-demo.ts
```

Reset increments `policy_id`, creates a new PolicyPDA and vault, and leaves old accounts/proofs intact.

## Helper Script

`scripts/deploy.sh` exists for an all-in-one deployment path, but it should only be used after explicit deployment approval.

## Troubleshooting

| Error                       | Fix                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| Missing deployer keypair    | Set `DEPLOYER_KEYPAIR` or `ANCHOR_WALLET`, or create `~/.config/solana/id.json`.           |
| Low SOL                     | Fund deployer from the devnet faucet and verify with `solana balance --url devnet`.        |
| Program ID mismatch         | Align `Anchor.toml`, `declare_id!`, and the program keypair before deploying.              |
| Missing build artifacts     | Run `anchor build`.                                                                        |
| `demo-state.json` missing   | Run `npm run devnet:setup` after deploy.                                                   |
| Blocked tx has no signature | Use the guarded demo path that sends selected blocked attempts with `skipPreflight: true`. |

## Frontend Deployment

Hosted on Cloudflare Pages.

Production URL: https://usevajra.xyz
Cloudflare Pages fallback: https://vajra-1m2.pages.dev
Cloudflare project: vajra
Build command: `cd app && npm run build`
Build output: `app/dist`
SPA fallback: `app/public/_redirects` → `/* /index.html 200`

### Redeploy

```bash
cd app
npm run build
npx wrangler pages deploy dist --project-name vajra --branch main --commit-dirty=true
```

### Custom Domain (usevajra.xyz)

1. Log in to Cloudflare dashboard.
2. Add `usevajra.xyz` as a new website/zone.
3. Copy the two Cloudflare nameservers shown.
4. Log in to Namecheap → Domain List → usevajra.xyz → Manage → Nameservers → Custom DNS.
5. Paste both Cloudflare nameservers. Save.
6. Wait for Cloudflare to show `usevajra.xyz` as Active (can take up to 24h).
7. In Cloudflare → Workers & Pages → vajra → Custom domains → Add `usevajra.xyz` and `www.usevajra.xyz`.
8. Wait for SSL provisioning.
9. Test https://usevajra.xyz and https://www.usevajra.xyz.
