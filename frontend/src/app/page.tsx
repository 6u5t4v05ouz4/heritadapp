"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-start py-16 px-8 gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
            Crypto-Herança
          </h1>
          <p className="max-w-lg text-lg text-zinc-600 dark:text-zinc-400">
            Dead Man's Switch para herança de ativos na Solana. Proteja seu
            patrimônio digital com contratos inteligentes.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <WalletMultiButton className="!bg-zinc-900 !text-white hover:!bg-zinc-700 dark:!bg-zinc-100 dark:!text-black dark:hover:!bg-zinc-300" />

          {mounted && connected && publicKey && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
              {publicKey.toBase58().slice(0, 4)}...
              {publicKey.toBase58().slice(-4)}
            </p>
          )}
        </div>

        {mounted && connected && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <Link href="/vaults/create" className="block">
              <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
                <h2 className="text-xl font-semibold mb-2 dark:text-white">
                  Criar Vault
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  Configure um novo cofre de herança com seus herdeiros e período
                  de inatividade.
                </p>
                <span className="inline-block w-full py-2 px-4 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black font-medium text-center hover:opacity-90 transition-opacity">
                  Novo Vault →
                </span>
              </div>
            </Link>

            <Link href="/vaults" className="block">
              <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
                <h2 className="text-xl font-semibold mb-2 dark:text-white">
                  Meus Vaults
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  Visualize e gerencie seus cofres ativos.
                </p>
                <span className="inline-block w-full py-2 px-4 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black font-medium text-center hover:opacity-90 transition-opacity">
                  Listar Vaults →
                </span>
              </div>
            </Link>
          </div>
        )}

        {mounted && !connected && (
          <div className="mt-8 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 max-w-lg">
            <h2 className="text-lg font-semibold mb-2 dark:text-white">
              Como funciona?
            </h2>
            <ul className="list-disc list-inside text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <li>Conecte sua carteira Solana</li>
              <li>Crie um vault configurando herdeiros e período de inatividade</li>
              <li>Deposite SOL ou tokens no vault</li>
              <li>Envie heartbeat periodicamente para manter ativo</li>
              <li>Se ficar inativo, os herdeiros podem resgatar os ativos</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
