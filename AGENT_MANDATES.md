# Agent Mandates

An Agent Mandate is a human-readable allowance package for an automated signer.

It is not a legal compliance document. It compiles into ordinary Vajra policy fields:

- total budget
- per-transaction cap
- period budget
- velocity limit
- expiry
- allowlisted destinations
- revoke and owner recovery behavior

Mandates included:

- Stablecoin Agent Mandate
- API Buyer Mandate
- DeFi Bot Mandate
- DAO Ops Mandate
- Market Maker Mandate
- Payroll/Ops Mandate

Commands:

```bash
npm run mandates:list
npm run mandate:show -- stablecoin-agent
```

Frontend-safe data:

- `app/public/agent-mandates.json`
- `app/public/stablecoin-mandate.example.json`

SDK:

```ts
import { getMandate, mandateToPolicyConfig } from "@vinaystwt/vajra-sdk";

const mandate = getMandate("stablecoin-agent");
const policyConfig = mandateToPolicyConfig(mandate!);
```
