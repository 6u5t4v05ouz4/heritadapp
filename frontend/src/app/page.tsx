"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Shield, Clock, Users, Coins, ArrowRight, ChevronDown } from "lucide-react";
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
            Protocolo na Devnet
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-text-primary tracking-tight leading-[1.1] max-w-3xl">
            Seu legado digital,
            <br />
            <span className="text-accent-primary">protegido para sempre</span>
          </h1>

          <p className="mt-5 text-lg text-text-secondary max-w-xl leading-relaxed">
            HERITA é um protocolo de herança on-chain na Solana. Proteja seus ativos digitais 
            e garanta que seus entes queridos tenham acesso quando necessário.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <ClientOnly
              fallback={
                <Button variant="primary" size="lg" disabled>
                  Conectar Carteira
                </Button>
              }
            >
              <WalletMultiButton />
            </ClientOnly>
            {connected && (
              <Link href="/vaults/create">
                <Button variant="primary" size="lg">
                  Criar meu Vault
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
            <a href="#como-funciona">
              <Button variant="ghost" size="lg">
                Explorar Protocolo
              </Button>
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
                <p className="text-xs text-text-tertiary">Você mantém o controle</p>
              </div>
            </Card>
            <Card padding="default" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-text-primary">Multi-beneficiário</p>
                <p className="text-xs text-text-tertiary">Até 10 herdeiros</p>
              </div>
            </Card>
            <Card padding="default" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-text-primary">Timer inteligente</p>
                <p className="text-xs text-text-tertiary">Heartbeat on-chain</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary">Como funciona</h2>
            <p className="mt-2 text-text-secondary">Quatro passos para proteger seu legado</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: <Shield className="w-5 h-5 text-accent-primary" />,
                title: "Conecte sua carteira",
                desc: "Use Phantom, Solflare ou outra carteira compatível com a Solana.",
              },
              {
                step: "02",
                icon: <Users className="w-5 h-5 text-accent-warm" />,
                title: "Configure herdeiros",
                desc: "Adicione endereços de carteira e defina a alocação de ativos.",
              },
              {
                step: "03",
                icon: <Coins className="w-5 h-5 text-emerald-400" />,
                title: "Deposite ativos",
                desc: "Envie SOL ou tokens para o vault. Eles ficam seguros on-chain.",
              },
              {
                step: "04",
                icon: <Clock className="w-5 h-5 text-sky-400" />,
                title: "Herdeiros resgatam",
                desc: "Se houver inatividade, os herdeiros podem executar o claim.",
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
            Pronto para proteger seu legado?
          </h2>
          <p className="text-text-secondary mb-8 max-w-lg mx-auto">
            Crie seu primeiro vault de herança digital em poucos minutos. 
            Sem taxas de setup, apenas gas da rede Solana.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <ClientOnly fallback={<Button variant="primary" size="lg" disabled>Conectar Carteira</Button>}>
              <WalletMultiButton />
            </ClientOnly>
            {connected && (
              <Link href="/vaults/create">
                <Button variant="primary" size="lg">
                  Criar meu Vault
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm font-semibold text-text-tertiary">HERITA</span>
          </div>
          <p className="text-xs text-text-tertiary">
            Protocolo experimental na Devnet. Use por sua conta e risco.
          </p>
        </div>
      </footer>
    </div>
  );
}
