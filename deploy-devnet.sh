#!/bin/bash
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"
cd ~/crypto-heranca-build

echo "=== Building Crypto-Heranca with 60s timer ==="
anchor build

echo ""
echo "=== Deploying to devnet ==="
anchor deploy --provider.cluster devnet

echo ""
echo "=== Done ==="
