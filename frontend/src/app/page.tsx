"use client";

import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Shield, Clock, Users, Coins, ArrowRight } from "lucide-react";
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
            <ClientOnly
              fallback={
                <Button variant="primary" size="lg" disabled>
                  Connect Wallet
                </Button>
              }
            >
              <WalletMultiButton />
            </ClientOnly>
            {connected && (
              <Link
                href="/vaults/create"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 text-base rounded-xl font-semibold border-1 border-border-subtle bg-[#f0f0f0] text-black hover:brightness-110 hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all duration-200"
              >
                Create my Vault
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 text-base rounded-xl font-semibold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all duration-200"
            >
              Explore Protocol
            </a>
          </div>

          {connected && publicKey && (
            <p className="mt-4 font-mono text-sm text-text-tertiary">
              {publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-6)}
            </p>
          )}

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
            <ClientOnly fallback={<Button variant="primary" size="lg" disabled>Connect Wallet</Button>}>
              <WalletMultiButton />
            </ClientOnly>
            {connected && (
              <Link
                href="/vaults/create"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 text-base rounded-xl font-semibold border-1 border-border-subtle bg-[#f0f0f0] text-black hover:brightness-110 hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all duration-200"
              >
                Create my Vault
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
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
          <p className="text-xs text-text-tertiary">
            Experimental protocol on Devnet. Use at your own risk.
          </p>
        </div>
      </footer>
    </div>
  );
}
