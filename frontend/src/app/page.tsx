"use client";

import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Shield, Clock, Users, ArrowRight, Mail } from "lucide-react";
import ClientOnly from "@/components/ClientOnly";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import HeroBackground from "@/components/hero/HeroBackground";
import VaultIrisOverlay from "@/components/hero/VaultIrisOverlay";

export default function Home() {
  const { publicKey, connected } = useWallet();

  return (
    <div className="flex flex-col">
      {/* Global Background */}
      <HeroBackground />

      {/* Vault Iris Overlay - Cofre Cibernético */}
      <VaultIrisOverlay />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Top radial glow for depth */}
        <div className="absolute top-0 inset-x-0 h-[500px] z-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-primary/[0.07] via-bg-base/50 to-bg-base/80 opacity-60 pointer-events-none" />

        <div className="relative z-30 max-w-5xl mx-auto px-4 md:px-6 flex flex-col items-center text-center">
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[100px] font-playfair font-bold text-text-primary tracking-tight leading-[1.05] mb-8">
            Your legacy.
            <br />
            Secured.
          </h1>

          <p className="text-lg md:text-2xl text-text-secondary max-w-3xl italic font-serif leading-relaxed mb-12">
            Automated inheritance for the digital era. Protect your wealth
            <br className="hidden md:block" />
            with sovereign-grade smart contract vaults.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-2xl mx-auto">
            <Link
              href="/vaults/create"
              className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-4 text-sm font-bold tracking-widest uppercase bg-accent-primary hover:brightness-110 text-black transition-all duration-200 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              Initiate Vault
            </Link>
            <Link
              href="#protocol"
              className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-4 text-sm font-bold tracking-widest uppercase border border-accent-primary text-accent-primary hover:bg-accent-primary/10 transition-all duration-200 rounded-xl"
            >
              Explore Protocol
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl opacity-80">
            <Card padding="default" className="flex items-center gap-3 bg-bg-surface border-border-subtle">
              <div className="w-9 h-9 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-accent-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-text-primary">Self-custody</p>
                <p className="text-xs text-text-secondary">You stay in control</p>
              </div>
            </Card>
            <Card padding="default" className="flex items-center gap-3 bg-bg-surface border-border-subtle">
              <div className="w-9 h-9 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-accent-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-text-primary">Multi-heir</p>
                <p className="text-xs text-text-secondary">Up to 10 heirs</p>
              </div>
            </Card>
            <Card padding="default" className="flex items-center gap-3 bg-bg-surface border-border-subtle">
              <div className="w-9 h-9 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-accent-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-text-primary">Smart timer</p>
                <p className="text-xs text-text-secondary">On-chain heartbeat</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* The Protocol */}
      <section id="protocol" className="relative z-20 py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-playfair font-bold text-text-primary tracking-[0.1em] uppercase mb-8">
              The Protocol
            </h2>
            <p className="text-lg md:text-xl text-text-secondary max-w-4xl mx-auto italic font-serif leading-relaxed">
              A sophisticated five-pillar architecture designed for institutional security and absolute legacy continuity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
            {[
              {
                step: "0 1",
                title: "Connect Wallet",
                desc: "Link your premium digital vault with your secure wallet address.",
              },
              {
                step: "0 2",
                title: "Create Vault",
                desc: "Initialize a personalized digital inheritance contract.",
              },
              {
                step: "0 3",
                title: "Deposit Assets",
                desc: "Transfer your wealth into the protected legacy protocol.",
              },
              {
                step: "0 4",
                title: "Send Heartbeat",
                desc: "Verify your presence at regular intervals to maintain control.",
              },
              {
                step: "0 5",
                title: "Automatic Inheritance",
                desc: "Assets are seamlessly transferred if the heartbeat expires.",
              },
            ].map((item, index) => (
              <div key={item.step} className="flex flex-col text-left group">
                <span className="text-[11px] md:text-xs font-semibold tracking-[0.2em] text-accent-primary mb-4">
                  {item.step}
                </span>
                <h3 className="text-sm md:text-[15px] font-playfair font-bold text-text-primary uppercase tracking-widest mb-4">
                  {item.title}
                </h3>
                <div className="w-full h-px bg-border-subtle group-hover:bg-accent-primary transition-colors duration-500 mb-4" />
                <p className="text-[13px] text-text-secondary leading-relaxed font-sans pr-2">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-20 py-16 md:py-24 border-t border-border-subtle/40">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-text-primary tracking-wide mb-4">
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
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 text-base rounded-xl font-semibold text-text-primary bg-bg-elevated hover:bg-bg-elevated-hover border border-border-subtle hover:border-border-focus transition-all duration-200"
                >
                  View My Vaults
                </Link>
                <Link
                  href="/vaults/create"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 text-base rounded-xl font-semibold bg-accent-primary text-black hover:brightness-110 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-200"
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
      <footer className="relative z-30 border-t border-border-subtle/40 bg-bg-base py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center md:items-start gap-10">
          
          {/* Brand & Socials */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="p-1 rounded-full border border-accent-primary/40 group-hover:border-accent-primary transition-colors">
                <Image
                  src="/logo.png"
                  alt="HERITA Logo"
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full group-hover:opacity-90 transition-opacity"
                />
              </div>
              <span className="text-xl md:text-[22px] font-bold tracking-[0.25em] text-accent-primary font-playfair">
                HERITA
              </span>
            </div>
            
            <div className="flex items-center gap-6 sm:pl-8 sm:border-l border-border-subtle/40">
              <a href="https://x.com/heritadapp" target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-accent-primary transition-colors" aria-label="X (Twitter)">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://www.youtube.com/channel/UCpG1-nHq2m9REQZ3jf7TXlQ" target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-accent-primary transition-colors" aria-label="YouTube">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93-.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="mailto:heritadapp@gmail.com" className="text-text-tertiary hover:text-accent-primary transition-colors" aria-label="Email">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links & Info */}
          <div className="flex flex-col items-center md:items-end gap-4 mt-6 md:mt-0 text-center md:text-right">
            <div className="flex flex-wrap justify-center md:justify-end items-center gap-3 sm:gap-4">
              <Link href="/docs" className="text-xs font-semibold tracking-widest text-text-secondary hover:text-accent-primary uppercase transition-colors">
                Docs
              </Link>
              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-border-subtle" />
              <Link href="/vaults/create" className="text-xs font-semibold tracking-widest text-text-secondary hover:text-accent-primary uppercase transition-colors">
                Create Vault
              </Link>
              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-border-subtle" />
              <Link href="/docs/how-it-works" className="text-xs font-semibold tracking-widest text-text-secondary hover:text-accent-primary uppercase transition-colors">
                How it works
              </Link>
              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-border-subtle" />
              <Link href="/privacy" className="text-xs font-semibold tracking-widest text-text-secondary hover:text-accent-primary uppercase transition-colors">
                Privacy Policy
              </Link>
              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-border-subtle" />
              <Link href="/terms" className="text-xs font-semibold tracking-widest text-text-secondary hover:text-accent-primary uppercase transition-colors">
                Terms of Service
              </Link>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-text-tertiary flex items-center justify-center md:justify-end gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
                Experimental protocol on Devnet. Use at your own risk.
              </p>
              <p className="text-xs text-text-tertiary/60">
                © {new Date().getFullYear()} HERITA. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
