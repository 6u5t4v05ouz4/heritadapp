import Card from "@/components/ui/Card";

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">How it works</h1>
      <p className="text-lg text-text-secondary mb-12 leading-relaxed">
        Herita provides a decentralized, non-custodial way to ensure your digital assets are safely transferred to your loved ones if you are no longer able to manage them.
      </p>

      <h2 className="text-2xl font-bold text-text-primary border-b border-border-subtle pb-4 mb-8">
        The Four-Step Process
      </h2>
      
      <div className="flex flex-col gap-6">
        <Card padding="lg" className="border-border-subtle bg-bg-elevated/30">
          <h3 className="text-lg font-semibold text-accent-primary mb-3 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-primary/10 text-accent-primary text-sm">1</span>
            Create a Vault
          </h3>
          <p className="text-text-secondary leading-relaxed ml-11">
            A user connects their Solana wallet (like Phantom or Solflare) and creates a new <strong className="text-text-primary">Vault</strong> on-chain. This vault is a smart contract (Program Derived Address) that only the creator can control while active.
          </p>
        </Card>

        <Card padding="lg" className="border-border-subtle bg-bg-elevated/30">
          <h3 className="text-lg font-semibold text-accent-primary mb-3 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-primary/10 text-accent-primary text-sm">2</span>
            Define Heirs and Rules
          </h3>
          <div className="text-text-secondary leading-relaxed ml-11">
            <p className="mb-4">During creation, you specify:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-text-primary">Heir Addresses:</strong> The Solana wallet addresses of your beneficiaries.</li>
              <li><strong className="text-text-primary">Allocation:</strong> The percentage of the vault each heir will receive.</li>
              <li><strong className="text-text-primary">Inactivity Timer:</strong> The amount of time the vault must remain inactive before heirs can claim.</li>
            </ul>
          </div>
        </Card>

        <Card padding="lg" className="border-border-subtle bg-bg-elevated/30">
          <h3 className="text-lg font-semibold text-accent-primary mb-3 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-primary/10 text-accent-primary text-sm">3</span>
            Keep the Timer Alive
          </h3>
          <p className="text-text-secondary leading-relaxed ml-11">
            Any deposit (SOL or tokens) into the vault acts as a "heartbeat". It automatically resets the inactivity timer. As long as you interact with the vault before the timer expires, your heirs cannot access the funds.
          </p>
        </Card>

        <Card padding="lg" className="border-border-subtle bg-bg-elevated/30">
          <h3 className="text-lg font-semibold text-accent-primary mb-3 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-primary/10 text-accent-primary text-sm">4</span>
            The Claiming Process
          </h3>
          <p className="text-text-secondary leading-relaxed ml-11">
            If the timer expires without any "heartbeat" from the creator, the vault is considered <em className="text-text-primary">unclaimed</em>. At this point, any registered heir can trigger the claim function. Additionally, our <strong className="text-text-primary">Keeper Network</strong> can automatically execute this transaction.
          </p>
        </Card>
      </div>
    </div>
  );
}
