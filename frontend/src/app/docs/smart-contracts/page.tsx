import Card from "@/components/ui/Card";
import { Code2, Cpu, Network } from "lucide-react";

export default function SmartContractsPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-playfair font-bold text-white tracking-[0.05em] uppercase mb-6">Smart Contracts</h1>
      <p className="text-lg text-gray-400 mb-12 leading-relaxed">
        Herita is built on Solana using the Anchor framework, ensuring high performance, extremely low fees, and robust security.
      </p>

      <div className="flex flex-col gap-6">
        <Card padding="lg" className="border-white/10 bg-white/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
              <Code2 className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-3">Architecture & Anchor</h2>
              <p className="text-gray-400 leading-relaxed">
                The core of the protocol is the <code className="text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">HERITA</code> program. It handles vault creation, deposits, pinging (resetting the timer), and the claiming logic securely on-chain.
              </p>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="border-white/10 bg-white/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
              <Cpu className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-3">Program Derived Addresses (PDAs)</h2>
              <p className="text-gray-400 leading-relaxed mb-4">
                Every vault is a PDA. This means the smart contract itself acts as the custodian of the funds. No human, including the Herita team, has the private key to the vault. The funds can only be moved if the strict conditions written in the code are met.
              </p>
              <p className="text-sm text-gray-500">
                The PDA seed structure ensures that each user can have a unique, deterministic vault address based on their own wallet and a specific identifier.
              </p>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="border-white/10 bg-white/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Network className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-3">The Keeper Integration</h2>
              <p className="text-gray-400 leading-relaxed mb-4">
                Smart contracts cannot execute themselves. To provide an automated experience, we built an off-chain <strong className="text-white">Keeper Node</strong>.
              </p>
              <p className="text-gray-400 leading-relaxed">
                The Keeper monitors the blockchain for vaults that have expired. Once an expiration is detected, the Keeper builds and submits the claim transaction on behalf of the heirs. The smart contract validates the expiration entirely on-chain before releasing the funds, ensuring the Keeper cannot act maliciously.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
