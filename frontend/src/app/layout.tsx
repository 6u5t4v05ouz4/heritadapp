import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppProviders from "./providers";
import Navbar from "@/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HERITA — Herança Digital na Solana",
  description: "Protocolo de herança digital on-chain. Proteja seu legado com smart contracts na Solana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary">
        <AppProviders>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </AppProviders>
      </body>
    </html>
  );
}
