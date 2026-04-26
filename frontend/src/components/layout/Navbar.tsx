"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Shield } from "lucide-react";
import WalletButton from "@/components/ui/WalletButton";

export default function Navbar() {
  const { connected, publicKey } = useWallet();

  return (
    <nav className="sticky top-0 z-50 border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center group-hover:bg-accent-primary/20 transition-colors">
            <Shield className="w-4 h-4 text-accent-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight text-text-primary">
            HERITA
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {connected && publicKey && (
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/vaults"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
              >
                My Vaults
              </Link>
              <Link
                href="/vaults/create"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
              >
                Create Vault
              </Link>
            </div>
          )}
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
