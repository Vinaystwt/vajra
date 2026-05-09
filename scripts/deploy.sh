#!/usr/bin/env bash
# deploy.sh — deploy Vajra to devnet and run full demo setup
# Usage: bash scripts/deploy.sh [keypair-path]
# If no keypair provided, uses ~/.config/solana/id.json

set -e

KEYPAIR="${1:-$HOME/.config/solana/id.json}"
PROGRAM_KEYPAIR="target/deploy/vajra-keypair.json"

echo "=== Vajra Devnet Deploy ==="
echo ""

# Check keypair exists
if [ ! -f "$KEYPAIR" ]; then
  echo "Keypair not found: $KEYPAIR"
  echo "Generate one with: solana-keygen new -o $KEYPAIR"
  exit 1
fi

PUBKEY=$(solana-keygen pubkey "$KEYPAIR")
echo "Deployer: $PUBKEY"

# Check balance
BAL=$(solana balance "$PUBKEY" --url devnet 2>/dev/null | awk '{print $1}')
echo "Balance:  $BAL SOL"

MIN_BAL=3
if (( $(echo "$BAL < $MIN_BAL" | bc -l) )); then
  echo ""
  echo "❌ Insufficient SOL. Need at least $MIN_BAL SOL."
  echo ""
  echo "Get devnet SOL from:"
  echo "  1. https://faucet.solana.com/ (paste: $PUBKEY)"
  echo "  2. solana airdrop 2 $PUBKEY --url devnet"
  echo ""
  exit 1
fi

echo ""
echo "Building program..."
anchor build

echo ""
echo "Deploying to devnet..."
anchor deploy --provider.cluster devnet --provider.wallet "$KEYPAIR"

# Record deploy sig
PROGRAM_ID=$(solana-keygen pubkey "$PROGRAM_KEYPAIR")
echo ""
echo "✅ Deployed: $PROGRAM_ID"
echo "   Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"

echo ""
echo "Setting up demo state..."
cp "$KEYPAIR" demo-keypairs/owner.json 2>/dev/null || true
SOLANA_RPC=https://api.devnet.solana.com ts-node scripts/setup-demo.ts

echo ""
echo "Running demo..."
SOLANA_RPC=https://api.devnet.solana.com ts-node scripts/run-demo.ts

echo ""
echo "✅ All done. See demo-state.json for deployed addresses."
