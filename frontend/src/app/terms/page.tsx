"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="flex flex-col min-h-screen bg-[#050505]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-20 md:py-32 w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-gray-500 hover:text-[#D4AF37] uppercase transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-white tracking-[0.05em] uppercase mb-12">
          Terms of Service
        </h1>

        <div className="prose prose-invert max-w-none text-gray-400 prose-headings:font-playfair prose-headings:text-white prose-headings:font-bold prose-headings:tracking-wide prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-a:text-[#D4AF37] hover:prose-a:text-[#b08835] prose-a:transition-colors prose-strong:text-gray-200">
          <p className="text-lg md:text-xl leading-relaxed mb-8 italic font-serif">
            These Terms of Service govern your access to and use of the HERITA decentralized application and protocol. By creating a vault, connecting your wallet, or interacting with HERITA smart contracts, you acknowledge and agree to these terms.
          </p>

          <p className="mb-10 leading-relaxed">
            If you have any questions about these terms, contact us at: <a href="mailto:heritadapp@gmail.com">heritadapp@gmail.com</a>
          </p>

          <h2>1. Nature of the Service</h2>
          <p className="mb-4 leading-relaxed">
            HERITA is a <strong>non-custodial, decentralized inheritance protocol</strong> deployed on the Solana blockchain. It allows users to create on-chain vaults that automatically distribute SOL and supported tokens to designated heirs after a configurable period of inactivity.
          </p>
          <ul className="list-disc pl-6 mb-8 space-y-3">
            <li>We do not hold, manage, or control your assets at any time.</li>
            <li>All vaults are Program Derived Addresses (PDAs) governed by open-source smart contracts.</li>
            <li>HERITA is currently deployed on <strong>Solana Devnet</strong> and is labeled as experimental.</li>
          </ul>

          <h2>2. Eligibility and Wallet Responsibility</h2>
          <p className="mb-4 leading-relaxed">
            To use HERITA, you must:
          </p>
          <ul className="list-disc pl-6 mb-8 space-y-3">
            <li>Have a compatible Solana wallet (e.g., Phantom, Solflare) and maintain sole control over its private keys or seed phrase.</li>
            <li>Be of legal age in your jurisdiction to enter into binding agreements.</li>
            <li>Ensure that all heir wallet addresses you provide are accurate and belong to the intended recipients.</li>
          </ul>
          <p className="mb-8 leading-relaxed">
            <strong>We cannot recover lost wallets, reset vault ownership, or reverse transactions.</strong> If you lose access to your wallet, you will be unable to manage your vaults or trigger heartbeats.
          </p>

          <h2>3. Vault Creation and Configuration</h2>
          <p className="mb-4 leading-relaxed">
            When creating a vault, you configure several on-chain parameters. You are solely responsible for these choices:
          </p>
          <ul className="list-disc pl-6 mb-8 space-y-3">
            <li><strong>Inactivity Period:</strong> Must be between 30 days and 2 years. Once set, it can only be changed by the vault owner while the vault is active.</li>
            <li><strong>Heirs:</strong> Up to 10 wallet addresses can be registered per vault. You must ensure each address is correct — transfers to wrong addresses are irreversible.</li>
            <li><strong>Allocation:</strong> You may assign fixed amounts or percentage-based allocations. Percentage allocations for a given asset must sum to exactly 100%.</li>
            <li><strong>Gas Reserve:</strong> A minimum of 0.01 SOL is recommended to cover future claim transaction costs.</li>
            <li><strong>Keeper Fee:</strong> You may optionally set a fee of up to 1% to incentivize automated execution of the claim process.</li>
          </ul>

          <h2>4. Heartbeat and Inactivity Timer</h2>
          <p className="mb-4 leading-relaxed">
            The inactivity timer counts down from the last recorded interaction. Deposits and heartbeat transactions reset this timer. It is your responsibility to:
          </p>
          <ul className="list-disc pl-6 mb-8 space-y-3">
            <li>Monitor your vault's remaining time.</li>
            <li>Trigger a heartbeat or deposit before the timer expires if you wish to maintain control.</li>
            <li>Understand that once the timer expires, heirs or the Keeper Network may initiate a claim, which is irreversible.</li>
          </ul>

          <h2>5. Deposits and Withdrawals</h2>
          <p className="mb-4 leading-relaxed">
            HERITA supports deposits of SOL and SPL tokens into vault-associated token accounts. You acknowledge that:
          </p>
          <ul className="list-disc pl-6 mb-8 space-y-3">
            <li>All deposits are on-chain transactions subject to Solana network fees.</li>
            <li>While a vault is active, only the owner can cancel it and reclaim all remaining assets.</li>
            <li>After a successful claim, the vault is closed and its status permanently set to "Claimed."</li>
          </ul>

          <h2>6. The Claiming Process</h2>
          <p className="mb-4 leading-relaxed">
            If the inactivity timer expires without a heartbeat, the vault becomes eligible for claiming:
          </p>
          <ul className="list-disc pl-6 mb-8 space-y-3">
            <li>Any registered heir or the Keeper Network may trigger the claim transaction.</li>
            <li>Assets are distributed according to the allocation rules defined at vault creation.</li>
            <li>The Keeper Fee, if configured, is deducted from the first heir's distribution and sent to the executor of the claim.</li>
            <li>The vault is closed after a successful claim, and any remaining rent-exempt SOL and unused gas reserve are transferred to the claim executor.</li>
          </ul>

          <h2>7. Risks and Disclaimers</h2>
          <p className="mb-4 leading-relaxed">
            By using HERITA, you explicitly acknowledge the following risks:
          </p>
          <ul className="list-disc pl-6 mb-8 space-y-3">
            <li><strong>Smart Contract Risk:</strong> Although our contracts are open-source, they have not yet undergone a formal independent audit. Bugs, exploits, or unexpected behavior could result in partial or total loss of funds.</li>
            <li><strong>Blockchain Risk:</strong> Solana network congestion, outages, or protocol changes may delay or prevent transactions.</li>
            <li><strong>Irreversibility:</strong> All blockchain transactions are final. Incorrect heir addresses, misconfigured allocations, or accidental cancellations cannot be undone by HERITA.</li>
            <li><strong>Volatility:</strong> The value of deposited assets may fluctuate significantly. HERITA does not guarantee the value of any asset at the time of claim.</li>
            <li><strong>Experimental Status:</strong> HERITA is currently on Devnet. Do not deposit mainnet assets or funds you cannot afford to lose.</li>
          </ul>

          <h2>8. No Financial or Legal Advice</h2>
          <p className="mb-8 leading-relaxed">
            HERITA does not provide tax, legal, estate planning, or investment advice. You should consult with qualified professionals in your jurisdiction to ensure that your vault configuration complies with local inheritance laws and tax regulations.
          </p>

          <h2>9. Prohibited Use</h2>
          <p className="mb-4 leading-relaxed">
            You may not use HERITA to:
          </p>
          <ul className="list-disc pl-6 mb-8 space-y-3">
            <li>Circumvent sanctions, launder money, or finance illegal activities.</li>
            <li>Impersonate another person or submit false heir information.</li>
            <li>Attempt to exploit, attack, or reverse-engineer the smart contracts or frontend.</li>
            <li>Use bots or automated systems to spam, manipulate, or abuse the protocol.</li>
          </ul>

          <h2>10. Intellectual Property</h2>
          <p className="mb-8 leading-relaxed">
            All HERITA branding, frontend code, documentation, and related materials are the intellectual property of the HERITA team. The smart contract code is open-source and available for public review under its respective license.
          </p>

          <h2>11. Limitation of Liability</h2>
          <p className="mb-8 leading-relaxed">
            To the fullest extent permitted by law, HERITA and its contributors shall not be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in connection with your use of the protocol, including but not limited to loss of funds, data, or profits.
          </p>

          <h2>12. Modifications to These Terms</h2>
          <p className="mb-8 leading-relaxed">
            We may update these Terms of Service from time to time. Changes will be posted on this page with an updated effective date. Continued use of HERITA after changes constitutes acceptance of the revised terms.
          </p>

          <h2>13. Contact</h2>
          <p className="mb-4 leading-relaxed">For questions, concerns, or legal inquiries:</p>
          <p className="mb-8 leading-relaxed">
            <strong className="text-[#D4AF37] font-playfair tracking-widest uppercase">HERITA</strong><br />
            <a href="mailto:heritadapp@gmail.com">heritadapp@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
