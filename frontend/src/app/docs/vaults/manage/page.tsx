import Card from "@/components/ui/Card";
import { Users, Edit3, AlertCircle } from "lucide-react";

export default function ManageHeirsPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">Managing Heirs</h1>
      <p className="text-lg text-text-secondary mb-12 leading-relaxed">
        Life changes, and your inheritance plan should be able to adapt. Herita allows you to update your heirs and allocations at any time while the vault is active.
      </p>

      <Card padding="lg" className="border-border-subtle bg-bg-elevated/30 mb-8">
        <div className="flex items-center gap-3 mb-6 border-b border-border-subtle pb-4">
          <Edit3 className="w-6 h-6 text-accent-primary" />
          <h2 className="text-2xl font-bold text-text-primary m-0">Updating Your Plan</h2>
        </div>
        
        <p className="text-text-secondary mb-6">
          As long as you (the vault creator) are active and the inactivity timer has not expired, you have full control over the vault.
        </p>

        <h3 className="text-sm font-bold tracking-wider text-text-tertiary uppercase mb-4">How to modify heirs:</h3>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-bg-base border border-border-subtle text-xs font-medium text-text-secondary shrink-0 mt-0.5">1</span>
            <span className="text-text-secondary">Go to your <strong className="text-text-primary">Dashboard</strong>.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-bg-base border border-border-subtle text-xs font-medium text-text-secondary shrink-0 mt-0.5">2</span>
            <span className="text-text-secondary">Select the active Vault you wish to modify.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-bg-base border border-border-subtle text-xs font-medium text-text-secondary shrink-0 mt-0.5">3</span>
            <span className="text-text-secondary">In the <em className="text-text-primary">Heirs Configuration</em> section, you can add new addresses, remove existing ones, or adjust the percentage allocations.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-bg-base border border-border-subtle text-xs font-medium text-text-secondary shrink-0 mt-0.5">4</span>
            <span className="text-text-secondary">Submit the transaction to update the rules on the blockchain.</span>
          </li>
        </ul>
      </Card>

      <div className="bg-sky-500/10 border border-sky-500/20 p-5 rounded-xl mb-12 flex gap-4 items-start">
        <AlertCircle className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-sky-400 mb-1">Important: Heartbeat Reset</h4>
          <p className="text-sm text-sky-400/80 leading-relaxed m-0">
            Any interaction with the vault, including updating your heirs, acts as a "heartbeat" and will automatically reset your inactivity timer.
          </p>
        </div>
      </div>

      <Card padding="lg" className="border-border-subtle bg-bg-base border-dashed">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-text-secondary" />
          <h2 className="text-xl font-bold text-text-primary m-0">Maximum Heirs Limit</h2>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          Due to Solana transaction size limits and computational constraints, a single vault currently supports a maximum of <strong className="text-text-primary">10 heirs</strong>. If you need to distribute assets to more people, we recommend creating multiple vaults or utilizing intermediate multi-sig wallets.
        </p>
      </Card>
    </div>
  );
}
