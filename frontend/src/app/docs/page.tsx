import { DocCard } from "@/components/docs/DocCard";
import { FileText, Shield, UserCog, KeyRound } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-playfair font-bold text-white tracking-[0.05em] uppercase mb-6">
        Herita Documentation
      </h1>
      
      <div className="prose prose-invert max-w-none text-gray-400 prose-headings:font-playfair prose-headings:text-white prose-headings:font-bold prose-headings:tracking-wide prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-a:text-[#D4AF37] hover:prose-a:text-[#b08835] prose-a:transition-colors prose-strong:text-gray-200 mb-12">
        <p className="text-lg leading-relaxed mb-6">
          Welcome to the Herita docs. Here you'll find how we think about decentralized inheritance, how the protocol works, and how to protect your legacy or claim assets as an heir.
        </p>
        <p className="text-lg leading-relaxed">
          The documentation is split into four areas. <strong className="text-white">Overview</strong> introduces Herita and the problem we solve. <strong className="text-white">Protocol</strong> covers the smart contracts, our Keeper network, and the operational workflow. <strong className="text-white">For Users</strong> explains how to create vaults, configure the inactivity timer, and manage heirs. <strong className="text-white">For Heirs</strong> describes the claiming process.
        </p>
        <p className="text-lg leading-relaxed mt-6">
          Use the cards below to jump into a section, or the sidebar to move between pages.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DocCard
          title="Overview"
          description="What Herita is, the decentralized inheritance problem we solve, and how the platform works."
          href="/docs/how-it-works"
          icon={<FileText className="w-6 h-6" />}
        />
        
        <DocCard
          title="Protocol"
          description="Smart contract architecture, the decentralized Keeper network, and real operational workflow."
          href="/docs/smart-contracts"
          icon={<Shield className="w-6 h-6" />}
        />
        
        <DocCard
          title="For Users"
          description="How to create a vault, configure the inactivity timer, deposit assets, and manage your heirs."
          href="/docs/vaults/create"
          icon={<UserCog className="w-6 h-6" />}
        />
        
        <DocCard
          title="For Heirs"
          description="How to verify vault status and claim your designated assets once the inactivity period expires."
          href="/docs/heirs/claim"
          icon={<KeyRound className="w-6 h-6" />}
        />
      </div>
    </div>
  );
}
