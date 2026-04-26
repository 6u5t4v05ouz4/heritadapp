"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import ClientOnly from "@/components/ClientOnly";

export default function WalletButton() {
  return (
    <ClientOnly
      fallback={
        <button
          className="h-11 px-4 rounded-xl bg-bg-elevated border border-border-subtle text-text-primary font-semibold text-sm opacity-50 cursor-not-allowed"
          disabled
        >
          Connect Wallet
        </button>
      }
    >
      <WalletMultiButton />
    </ClientOnly>
  );
}
