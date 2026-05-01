"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Mail } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  {
    title: "OVERVIEW",
    links: [
      { href: "/docs", label: "Introduction" },
      { href: "/docs/how-it-works", label: "How it works" },
    ],
  },
  {
    title: "PROTOCOL",
    links: [
      { href: "/docs/smart-contracts", label: "Smart Contracts" },
      { href: "/docs/security", label: "Security & Audits" },
    ],
  },
  {
    title: "FOR USERS",
    links: [
      { href: "/docs/vaults/create", label: "Creating a Vault" },
      { href: "/docs/vaults/manage", label: "Managing Heirs" },
    ],
  },
  {
    title: "FOR HEIRS",
    links: [
      { href: "/docs/heirs/claim", label: "How to Claim" },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col border-r border-white/10 h-[calc(100vh-64px)] sticky top-16 py-8 pr-6">
      <nav className="flex-1 overflow-y-auto flex flex-col gap-8 pb-8">
        {navItems.map((section) => (
          <div key={section.title}>
            <h4 className="text-xs font-playfair font-bold text-gray-500 mb-3 tracking-widest uppercase">
              {section.title}
            </h4>
            <ul className="flex flex-col gap-2">
              {section.links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "text-sm block transition-colors duration-200 border-l-2 pl-3 py-1",
                        isActive
                          ? "border-[#D4AF37] text-white font-medium"
                          : "border-transparent text-gray-400 hover:text-white hover:border-white/10"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Social Links Footer */}
      <div className="mt-auto pt-6 border-t border-white/10 flex items-center gap-5">
        <a href="https://x.com/heritadapp" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#D4AF37] transition-colors" aria-label="X (Twitter)">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
        <a href="https://www.youtube.com/channel/UCpG1-nHq2m9REQZ3jf7TXlQ" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#D4AF37] transition-colors" aria-label="YouTube">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93-.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </a>
        <a href="mailto:heritadapp@gmail.com" className="text-gray-500 hover:text-[#D4AF37] transition-colors" aria-label="Email">
          <Mail className="w-4 h-4" />
        </a>
      </div>
    </aside>
  );
}
