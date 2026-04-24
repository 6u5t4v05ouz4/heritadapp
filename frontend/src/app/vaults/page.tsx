"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useVault } from "@/hooks/useVault";
import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";

interface VaultData {
  publicKey: PublicKey;
  account: {
    owner: PublicKey;
    seed: any;
    lastHeartbeat: any;
    inactivityPeriod: any;
    status: any;
    assets: PublicKey[];
    heirs: any[];
  };
}

export default function VaultsPage() {
  const { publicKey, connected } = useWallet();
  const { fetchVaultsByOwner } = useVault();
  const [mounted, setMounted] = useState(false);
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !connected || !publicKey) {
      setVaults([]);
      return;
    }
    setLoading(true);
    fetchVaultsByOwner(publicKey)
      .then((data) => setVaults(data || []))
      .finally(() => setLoading(false));
  }, [connected, publicKey, fetchVaultsByOwner]);

  const formatTimeRemaining = (lastHeartbeat: number, inactivityPeriod: number) => {
    const now = Math.floor(Date.now() / 1000);
    const expiry = lastHeartbeat + inactivityPeriod;
    const diff = expiry - now;
    if (diff <= 0) return "Expirado";
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    return `${days}d ${hours}h restantes`;
  };

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-black py-12 px-4">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Meus Vaults
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Gerencie seus cofres de herança
            </p>
          </div>
          <div className="flex items-center gap-4">
            {mounted && connected && (
              <Link
                href="/vaults/create"
                className="py-2 px-4 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black font-medium hover:opacity-90 transition-opacity"
              >
                + Novo Vault
              </Link>
            )}
            <WalletMultiButton className="!bg-zinc-900 !text-white hover:!bg-zinc-700 dark:!bg-zinc-100 dark:!text-black dark:hover:!bg-zinc-300" />
          </div>
        </div>

        {!mounted && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse"
              >
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {mounted && !connected && (
          <div className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Conecte sua carteira para ver seus vaults
            </p>
            <WalletMultiButton className="!bg-zinc-900 !text-white hover:!bg-zinc-700 dark:!bg-zinc-100 dark:!text-black dark:hover:!bg-zinc-300" />
          </div>
        )}

        {mounted && connected && loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse"
              >
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {mounted && connected && !loading && vaults.length === 0 && (
          <div className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Você ainda não tem nenhum vault
            </p>
            <Link
              href="/vaults/create"
              className="inline-block py-2 px-4 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black font-medium hover:opacity-90 transition-opacity"
            >
              Criar meu primeiro Vault
            </Link>
          </div>
        )}

        {mounted && connected && !loading && vaults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vaults.map((vault) => (
              <Link
                key={vault.publicKey.toBase58()}
                href={`/vaults/${vault.publicKey.toBase58()}`}
                className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-black dark:text-white font-mono text-sm">
                    {vault.publicKey.toBase58().slice(0, 8)}...
                    {vault.publicKey.toBase58().slice(-8)}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      vault.account.status?.active
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : vault.account.status?.claimed
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    }`}
                  >
                    {vault.account.status?.active
                      ? "Ativo"
                      : vault.account.status?.claimed
                      ? "Resgatado"
                      : "Cancelado"}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <p>
                    Herdeiros:{" "}
                    <span className="text-black dark:text-white font-medium">
                      {vault.account.heirs?.length || 0}
                    </span>
                  </p>
                  <p>
                    Assets:{" "}
                    <span className="text-black dark:text-white font-medium">
                      {vault.account.assets?.length || 0}
                    </span>
                  </p>
                  <p>
                    Timer:{" "}
                    <span className="text-black dark:text-white font-medium">
                      {formatTimeRemaining(
                        Number(vault.account.lastHeartbeat?.toString() || 0),
                        Number(vault.account.inactivityPeriod?.toString() || 0)
                      )}
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
