import Card from "@/components/ui/Card";
import { Bot, User } from "lucide-react";

export default function HowToClaimPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-playfair font-bold text-white tracking-[0.05em] uppercase mb-6">How to Claim</h1>
      <p className="text-lg text-gray-400 mb-12 leading-relaxed">
        If the vault's inactivity timer has expired, the designated heirs can receive their funds. The process is designed to be frictionless and automated.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Card padding="lg" className="border-[#D4AF37]/30 bg-accent-primary/5">
          <div className="w-12 h-12 rounded-xl bg-accent-primary/20 flex items-center justify-center mb-6">
            <Bot className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-4">Automated Claiming</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            In most cases, heirs do not need to do anything manually. Herita features a decentralized <strong className="text-white">Keeper Network</strong>.
          </p>
          <ul className="text-sm text-gray-400 space-y-3 list-disc pl-4">
            <li>Nodes monitor the blockchain for expired vaults.</li>
            <li>When the timer hits zero, a Keeper submits the claim.</li>
            <li>Gas fees are paid from the vault's reserved balance.</li>
            <li>Funds appear directly in the heirs' wallets.</li>
          </ul>
        </Card>

        <Card padding="lg" className="border-white/10 bg-white/5">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 mb-6">
            <User className="w-6 h-6 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-4">Manual Claiming</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            If the automated Keeper network is delayed, or you prefer to execute it yourself, anyone can trigger the execution on an expired vault.
          </p>
          <ol className="text-sm text-gray-400 space-y-3 list-decimal pl-4">
            <li>Connect your wallet to the Herita App.</li>
            <li>Navigate to the Vault link.</li>
            <li>Click <strong className="text-white">Execute Claim</strong>.</li>
            <li>Pay the network fee to instantly distribute funds to all heirs.</li>
          </ol>
        </Card>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-amber-400 mb-2">Note on SPL Tokens</h3>
        <p className="text-amber-400/80 leading-relaxed text-sm">
          The protocol currently focuses on native SOL distribution. Support for SPL tokens (like USDC, USDT) will require the contract to iterate through associated token accounts during the claim process.
        </p>
      </div>
    </div>
  );
}
