import Card from "@/components/ui/Card";
import { ShieldAlert, ShieldCheck, LockKeyhole } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">Security & Audits</h1>
      <p className="text-lg text-text-secondary mb-12 leading-relaxed">
        Security is the foundational pillar of Herita. Since we are dealing with inheritance and long-term storage of value, the protocol is designed to be completely trustless.
      </p>

      <Card padding="lg" className="border-emerald-500/30 bg-emerald-500/5 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-bold text-text-primary">Self-Custody Always</h2>
        </div>
        <p className="text-text-secondary leading-relaxed mb-4">
          Herita is a <strong className="text-text-primary">non-custodial</strong> protocol. When you create a vault, you are interacting directly with a decentralized smart contract on the Solana blockchain.
        </p>
        <ul className="text-sm text-text-secondary space-y-2 list-disc pl-5">
          <li>We do not hold your funds.</li>
          <li>We do not have a master key or backdoor to access vaults.</li>
          <li>If the Herita website goes offline, your vault and your rules remain intact on the blockchain.</li>
        </ul>
      </Card>

      <h2 className="text-2xl font-bold text-text-primary border-b border-border-subtle pb-4 mb-6 mt-12">
        Attack Vectors Mitigated
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Card padding="lg" className="border-border-subtle bg-bg-elevated/30">
          <div className="flex items-center gap-3 mb-4">
            <LockKeyhole className="w-5 h-5 text-accent-primary" />
            <h3 className="text-lg font-bold text-text-primary">Early Claiming</h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            The smart contract relies on Solana's deterministic <code className="text-text-primary">Clock</code> sysvar to measure time. An heir attempting to claim funds before the inactivity timer expires will face a hard failure at the contract level.
          </p>
        </Card>

        <Card padding="lg" className="border-border-subtle bg-bg-elevated/30">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-5 h-5 text-accent-warm" />
            <h3 className="text-lg font-bold text-text-primary">Unauthorized Access</h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            Only wallets explicitly listed in the heirs array can receive funds. The contract automatically calculates the precise percentage each heir is entitled to, preventing any single heir from draining the entire vault.
          </p>
        </Card>
      </div>

      <div className="bg-accent-primary/10 border border-accent-primary/20 p-6 rounded-xl mt-8">
        <h3 className="text-lg font-semibold text-accent-primary mb-2">Audits Status</h3>
        <p className="text-text-secondary leading-relaxed text-sm">
          <strong className="text-text-primary">Note:</strong> Herita is currently in the Devnet phase. Smart contracts are open-source for community review, but have not yet undergone a formal independent audit. Mainnet launch will be preceded by comprehensive security audits.
        </p>
      </div>
    </div>
  );
}
