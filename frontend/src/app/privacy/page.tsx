"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
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
          Privacy Policy
        </h1>

        <div className="prose prose-invert max-w-none text-gray-400 prose-headings:font-playfair prose-headings:text-white prose-headings:font-bold prose-headings:tracking-wide prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-a:text-[#D4AF37] hover:prose-a:text-[#b08835] prose-a:transition-colors prose-strong:text-gray-200">
          <p className="text-lg md:text-xl leading-relaxed mb-8 italic font-serif">
            At HERITA, one of our core priorities is protecting the privacy and data of our users whether you're creating a vault or acting as an heir. This Privacy Policy outlines the types of information we collect, how we use it, and your rights over your data.
          </p>

          <p className="mb-10 leading-relaxed">
            If you have any questions or require more information about our Privacy Policy, feel free to contact us at: <a href="mailto:heritadapp@gmail.com">heritadapp@gmail.com</a>
          </p>

          <h2>Consent</h2>
          <p className="mb-8 leading-relaxed">
            By using HERITA, you consent to this Privacy Policy and agree to its terms.
          </p>

          <h2>Information We Collect</h2>
          <p className="mb-4 leading-relaxed">We may collect the following types of information:</p>
          <ul className="list-disc pl-6 mb-8 space-y-3">
            <li><strong>Basic account data:</strong> wallet address</li>
            <li><strong>Submitted content:</strong> vault configurations, heir addresses</li>
            <li><strong>Technical data:</strong> IP address, browser type, device info, usage behavior</li>
          </ul>
          <p className="mb-8 leading-relaxed">
            Some of this data is provided directly by the user (e.g., during vault creation), while other data may be collected via integrated APIs or analytics.
          </p>

          <h2>How We Use Your Information</h2>
          <p className="mb-4 leading-relaxed">We use collected information to:</p>
          <ul className="list-disc pl-6 mb-8 space-y-3">
            <li>Operate, maintain, and improve the HERITA platform</li>
            <li>Automate smart contract interactions and claim eligibility</li>
            <li>Validate submitted transactions and detect suspicious or fraudulent activity</li>
            <li>Generate anonymous usage statistics to improve the product</li>
            <li>Comply with legal or regulatory obligations</li>
          </ul>
          <p className="mb-8 leading-relaxed">
            We do not sell user data or use it for advertising purposes.
          </p>

          <h2>Cookies & Tracking</h2>
          <p className="mb-4 leading-relaxed">
            We may use basic cookies and analytics tools to understand how users interact with the platform. These help us:
          </p>
          <ul className="list-disc pl-6 mb-8 space-y-3">
            <li>Identify technical issues</li>
            <li>Improve user experience</li>
            <li>Prevent spam or bot activity</li>
          </ul>
          <p className="mb-8 leading-relaxed">
            You can disable cookies in your browser settings at any time.
          </p>

          <h2>Third-Party Integrations</h2>
          <p className="mb-4 leading-relaxed">
            HERITA may connect to third-party services such as:
          </p>
          <ul className="list-disc pl-6 mb-8 space-y-3">
            <li><strong>Wallet services (e.g. Phantom, Solflare):</strong> for on-chain identity verification and transactions</li>
          </ul>
          <p className="mb-8 leading-relaxed">
            We do not control the data handling policies of these platforms. Please refer to their respective Privacy Policies.
          </p>

          <h2>Data Protection Rights (GDPR / CCPA)</h2>
          <p className="mb-4 leading-relaxed">Depending on your location, you may have rights including:</p>
          <ul className="list-disc pl-6 mb-8 space-y-3">
            <li>Right to access your personal data</li>
            <li>Right to correct inaccurate data</li>
            <li>Right to request deletion of your data</li>
            <li>Right to object or restrict how we process your data</li>
            <li>Right to data portability</li>
          </ul>
          <p className="mb-8 leading-relaxed">
            To request any of the above, email us at <a href="mailto:heritadapp@gmail.com">heritadapp@gmail.com</a>.
          </p>

          <h2>Updates to This Policy</h2>
          <p className="mb-8 leading-relaxed">
            We may update this Privacy Policy periodically. Any changes will be posted here, with an updated effective date.
          </p>

          <h2>Contact Us</h2>
          <p className="mb-4 leading-relaxed">For any questions, concerns, or data requests:</p>
          <p className="mb-8 leading-relaxed">
            <strong className="text-[#D4AF37] font-playfair tracking-widest uppercase">HERITA</strong><br />
            <a href="mailto:heritadapp@gmail.com">heritadapp@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
