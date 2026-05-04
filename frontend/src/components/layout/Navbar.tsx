"use client";

import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import WalletButton from "@/components/ui/WalletButton";

export default function Navbar() {
  const { connected, publicKey } = useWallet();

  return (
    <nav className="sticky top-0 z-50 bg-[#0A0A0A] border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-24 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="p-1 rounded-full border border-[#D4AF37]/40 group-hover:border-[#D4AF37] transition-colors">
            <Image
              src="/logo.png"
              alt="HERITA Logo"
              width={44}
              height={44}
              className="w-11 h-11 rounded-full group-hover:opacity-90 transition-opacity"
            />
          </div>
          <span className="text-xl md:text-[22px] font-bold tracking-[0.25em] text-[#D4AF37] font-playfair">
            HERITA
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {connected && publicKey && (
            <div className="hidden md:flex items-center gap-4 mr-2">
              <Link
                href="/vaults"
                className="text-xs font-semibold tracking-widest text-[#D4AF37] hover:text-white uppercase transition-colors"
              >
                My Vaults
              </Link>
              <Link
                href="/heir"
                className="text-xs font-semibold tracking-widest text-[#D4AF37] hover:text-white uppercase transition-colors"
              >
                Heir
              </Link>
              <Link
                href="/vaults/create"
                className="text-xs font-semibold tracking-widest text-[#D4AF37] hover:text-white uppercase transition-colors"
              >
                Create
              </Link>
            </div>
          )}
          <div className="hidden md:flex items-center gap-8 mr-4">
            <Link href="/docs" className="text-xs font-semibold tracking-widest text-gray-400 hover:text-[#D4AF37] uppercase transition-colors">
              Docs
            </Link>

          </div>
          <a href="https://x.com/heritadapp" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:opacity-80 transition-opacity hidden sm:block" aria-label="X (Twitter)">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
            </svg>
          </a>
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
