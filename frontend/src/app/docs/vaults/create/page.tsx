import Card from "@/components/ui/Card";

export default function CreateVaultPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-playfair font-bold text-white tracking-[0.05em] uppercase mb-6">Creating a Vault</h1>
      <p className="text-lg text-gray-400 mb-12 leading-relaxed">
        Setting up your digital inheritance vault takes only a few minutes. You define the rules, and the blockchain enforces them.
      </p>

      <h2 className="text-2xl font-playfair font-bold text-white tracking-[0.05em] uppercase border-b border-white/10 pb-4 mb-8">
        Step-by-step Guide
      </h2>
      
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border-subtle before:to-transparent">
        
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#050505] text-[#D4AF37] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_15px_rgba(56,189,248,0.2)] relative z-10">
            1
          </div>
          <Card padding="default" className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white/5 border-white/10">
            <h3 className="font-semibold text-white mb-2">Connect Your Wallet</h3>
            <p className="text-sm text-gray-400">Navigate to the App and connect your Solana wallet (Phantom, Solflare, etc.). Ensure you are on the correct network.</p>
          </Card>
        </div>

        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#050505] text-[#D4AF37] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
            2
          </div>
          <Card padding="default" className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white/5 border-white/10">
            <h3 className="font-semibold text-white mb-2">Access the Form</h3>
            <p className="text-sm text-gray-400">Click on <em className="text-white">Create My Vault</em> in the top navigation or on the homepage.</p>
          </Card>
        </div>

        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#050505] text-[#D4AF37] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
            3
          </div>
          <Card padding="default" className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white/5 border-white/10">
            <h3 className="font-semibold text-white mb-2">Set Inactivity Period</h3>
            <p className="text-sm text-gray-400">Choose how long the vault should wait without any activity from you before allowing heirs to claim (e.g., 3, 6, or 12 months).</p>
          </Card>
        </div>

        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#050505] text-[#D4AF37] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
            4
          </div>
          <Card padding="default" className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white/5 border-white/10">
            <h3 className="font-semibold text-white mb-2">Add Heirs</h3>
            <p className="text-sm text-gray-400">Enter the Solana addresses of the beneficiaries. Assign a percentage to each heir. Total must equal 100%.</p>
          </Card>
        </div>
        
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#050505] text-[#D4AF37] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
            5
          </div>
          <Card padding="default" className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white/5 border-white/10">
            <h3 className="font-semibold text-white mb-2">Confirm Transaction</h3>
            <p className="text-sm text-gray-400">Review the small network fees, click Create Vault, and approve the transaction in your wallet.</p>
          </Card>
        </div>

      </div>

      <div className="mt-16 bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-6 rounded-xl">
        <h3 className="text-lg font-playfair font-bold text-[#D4AF37] uppercase tracking-wider mb-2">Next Steps: Awaiting Deposit</h3>
        <p className="text-gray-400 leading-relaxed">
          A newly created vault is empty and its inactivity timer is paused. The timer will only start ticking down after you make your first deposit (SOL or SPL Tokens) into the vault. This ensures you aren't penalized for creating a vault and funding it later.
        </p>
      </div>
    </div>
  );
}
