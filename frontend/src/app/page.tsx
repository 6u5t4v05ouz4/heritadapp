"use client";

import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Shield, Clock, Users, Coins, ArrowRight, Mail } from "lucide-react";
import ClientOnly from "@/components/ClientOnly";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function Home() {
  const { publicKey, connected } = useWallet();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bg-surface to-bg-base" />
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-medium mb-6">
            <Shield className="w-3.5 h-3.5" />
            Devnet Protocol
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-text-primary tracking-tight leading-[1.1] max-w-3xl">
            Your digital legacy,
            <br />
            <span className="text-accent-primary">protected forever</span>
          </h1>

          <p className="mt-5 text-lg text-text-secondary max-w-xl leading-relaxed">
            HERITA is an on-chain inheritance protocol on Solana. Protect your digital assets
            and ensure your loved ones have access when needed.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            {!connected ? (
              <>
                <ClientOnly
                  fallback={
                    <Button variant="primary" size="lg" disabled>
                      Connect Wallet
                    </Button>
                  }
                >
                  <WalletMultiButton />
                </ClientOnly>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 text-base rounded-xl font-semibold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all duration-200"
                >
                  Explore Protocol
                </a>
              </>
            ) : (
              <>
                <Link
                  href="/vaults"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 text-base rounded-xl font-semibold text-text-primary bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
                >
                  View My Vaults
                </Link>
                <Link
                  href="/vaults/create"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 text-base rounded-xl font-semibold border-1 border-border-subtle bg-[#f0f0f0] text-black hover:brightness-110 hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all duration-200"
                >
                  Create my Vault
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Social proof */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            <Card padding="default" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-text-primary">Self-custody</p>
                <p className="text-xs text-text-tertiary">You stay in control</p>
              </div>
            </Card>
            <Card padding="default" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-text-primary">Multi-heir</p>
                <p className="text-xs text-text-tertiary">Up to 10 heirs</p>
              </div>
            </Card>
            <Card padding="default" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-text-primary">Smart timer</p>
                <p className="text-xs text-text-tertiary">On-chain heartbeat</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary">How it works</h2>
            <p className="mt-2 text-text-secondary">Four steps to protect your legacy</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: <Shield className="w-5 h-5 text-accent-primary" />,
                title: "Connect your wallet",
                desc: "Use Phantom, Solflare, or any Solana-compatible wallet.",
              },
              {
                step: "02",
                icon: <Users className="w-5 h-5 text-accent-warm" />,
                title: "Set up heirs",
                desc: "Add wallet addresses and define asset allocation.",
              },
              {
                step: "03",
                icon: <Coins className="w-5 h-5 text-emerald-400" />,
                title: "Deposit assets",
                desc: "Send SOL or tokens to the vault. They stay safe on-chain.",
              },
              {
                step: "04",
                icon: <Clock className="w-5 h-5 text-sky-400" />,
                title: "Heirs claim",
                desc: "If inactive, heirs can execute the claim.",
              },
            ].map((item) => (
              <Card key={item.step} padding="lg" className="relative">
                <span className="absolute top-4 right-4 text-xs font-mono text-text-tertiary">
                  {item.step}
                </span>
                <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border-subtle flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 border-t border-border-subtle">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            Ready to protect your legacy?
          </h2>
          <p className="text-text-secondary mb-8 max-w-lg mx-auto">
            Create your first digital inheritance vault in minutes.
            No setup fees, only Solana network gas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {!connected ? (
              <ClientOnly fallback={<Button variant="primary" size="lg" disabled>Connect Wallet</Button>}>
                <WalletMultiButton />
              </ClientOnly>
            ) : (
              <>
                <Link
                  href="/vaults"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 text-base rounded-xl font-semibold text-text-primary bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
                >
                  View My Vaults
                </Link>
                <Link
                  href="/vaults/create"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 text-base rounded-xl font-semibold border-1 border-border-subtle bg-[#f0f0f0] text-black hover:brightness-110 hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all duration-200"
                >
                  Create my Vault
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="HERITA Logo"
              width={32}
              height={32}
              className="w-8 h-8 opacity-70 grayscale"
            />
            <span className="text-sm font-semibold text-text-tertiary">HERITA</span>
          </div>
          
          <div className="flex items-center gap-5">
            <a href="https://x.com/heritadapp" target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="X (Twitter)">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://www.youtube.com/channel/UCpG1-nHq2m9REQZ3jf7TXlQ" target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="YouTube">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a href="mailto:heritadapp@gmail.com" className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="Email">
              <Mail className="w-5 h-5" />
            </a>
          </div>

          <p className="text-xs text-text-tertiary">
            Experimental protocol on Devnet. Use at your own risk.
          </p>
        </div>
      </footer>
    </div>
  );
}
