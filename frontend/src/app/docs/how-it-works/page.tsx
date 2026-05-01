import Card from "@/components/ui/Card";

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-playfair font-bold text-white tracking-[0.05em] uppercase mb-6">How it works</h1>
      <p className="text-lg text-gray-400 mb-12 leading-relaxed">
        Herita provides a decentralized, non-custodial way to ensure your digital assets are safely transferred to your loved ones if you are no longer able to manage them.
      </p>

      <h2 className="text-2xl font-playfair font-bold text-white tracking-[0.05em] uppercase border-b border-white/10 pb-4 mb-8">
        The Four-Step Process
      </h2>
      
      <div className="flex flex-col gap-6">
        <Card padding="lg" className="border-white/10 bg-white/5">
          <h3 className="text-lg font-playfair font-bold text-[#D4AF37] uppercase tracking-wider mb-3 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm">1</span>
            Create a Vault
          </h3>
          <p className="text-gray-400 leading-relaxed ml-11">
            A user connects their Solana wallet (like Phantom or Solflare) and creates a new <strong className="text-white">Vault</strong> on-chain. This vault is a smart contract (Program Derived Address) that only the creator can control while active.
          </p>
        </Card>

        <Card padding="lg" className="border-white/10 bg-white/5">
          <h3 className="text-lg font-playfair font-bold text-[#D4AF37] uppercase tracking-wider mb-3 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm">2</span>
            Define Heirs and Rules
          </h3>
          <div className="text-gray-400 leading-relaxed ml-11">
            <p className="mb-4">During creation, you specify:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Heir Addresses:</strong> The Solana wallet addresses of your beneficiaries.</li>
              <li><strong className="text-white">Allocation:</strong> The percentage of the vault each heir will receive.</li>
              <li><strong className="text-white">Inactivity Timer:</strong> The amount of time the vault must remain inactive before heirs can claim.</li>
            </ul>
          </div>
        </Card>

        <Card padding="lg" className="border-white/10 bg-white/5">
          <h3 className="text-lg font-playfair font-bold text-[#D4AF37] uppercase tracking-wider mb-3 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm">3</span>
            Keep the Timer Alive
          </h3>
          <p className="text-gray-400 leading-relaxed ml-11">
            Any deposit (SOL or tokens) into the vault acts as a "heartbeat". It automatically resets the inactivity timer. As long as you interact with the vault before the timer expires, your heirs cannot access the funds.
          </p>
        </Card>

        <Card padding="lg" className="border-white/10 bg-white/5">
          <h3 className="text-lg font-playfair font-bold text-[#D4AF37] uppercase tracking-wider mb-3 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm">4</span>
            The Claiming Process
          </h3>
          <p className="text-gray-400 leading-relaxed ml-11">
            If the timer expires without any "heartbeat" from the creator, the vault is considered <em className="text-white">unclaimed</em>. At this point, any registered heir can trigger the claim function. Additionally, our <strong className="text-white">Keeper Network</strong> can automatically execute this transaction.
          </p>
        </Card>
      </div>
    </div>
  );
}
