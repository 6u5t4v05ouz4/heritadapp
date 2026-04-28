"use client";

import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import WalletButton from "@/components/ui/WalletButton";

export default function Navbar() {
  const { connected, publicKey } = useWallet();

  return (
    <nav className="sticky top-0 z-50 border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt="HERITA Logo"
            width={64}
            height={64}
            className="w-16 h-16 rounded-lg group-hover:opacity-90 transition-opacity"
          />
          <span className="text-xl font-bold tracking-tight text-text-primary">
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
