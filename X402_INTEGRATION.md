# x402-Style Vajra Integration

Path: `examples/x402-vajra`

This is a local HTTP 402-style reference flow. It does not claim production integration with an external x402 package or hosted x402 service.

The reference shows an API-buying agent paying through Vajra-style policy rules instead of raw wallet access.

## Flow

1. Agent requests a protected API.
2. API returns an HTTP 402-style payment requirement.
3. Agent pays through the Vajra spend path.
4. Valid payment unlocks the API.
5. Over-budget, wrong-destination, and revoked payment attempts are blocked.
6. A proof packet records the results.

## Run

```bash
cd examples/x402-vajra
npm install
npm run demo
```

The demo is local and deterministic. It does not require devnet deployment or real funds.

Use this as an agent-payment wedge: the API can require a Vajra receipt before returning protected data. The current implementation remains a local HTTP 402-style reference flow.
