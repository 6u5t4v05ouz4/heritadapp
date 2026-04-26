"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useVault } from "@/hooks/useVault";
import { useEffect, useState } from "react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { Vault, Shield, Clock, TrendingUp } from "lucide-react";
import ClientOnly from "@/components/ClientOnly";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import VaultCard from "@/components/vault/VaultCard";
import Button from "@/components/ui/Button";

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
  const { connection } = useConnection();
  const { fetchVaultsByOwner } = useVault();
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    if (!connected || !publicKey) {
      setVaults([]);
      setTotalBalance(0);
      return;
    }
    setLoading(true);
    fetchVaultsByOwner(publicKey)
      .then(async (data) => {
        const vaultList = (data || []) as VaultData[];
        setVaults(vaultList);
        // Calculate total balance
        let total = 0;
        for (const v of vaultList) {
          try {
            const bal = await connection.getBalance(v.publicKey);
            total += bal;
          } catch {
            // ignore
          }
        }
        setTotalBalance(total);
      })
      .finally(() => setLoading(false));
  }, [connected, publicKey, fetchVaultsByOwner, connection]);

  const nextExpiry = vaults.reduce((min, v) => {
    const lastHb = Number(v.account.lastHeartbeat?.toString() || 0);
    const period = Number(v.account.inactivityPeriod?.toString() || 0);
    if (lastHb === 0) return min;
    const expiry = lastHb + period;
    if (min === 0 || expiry < min) return expiry;
    return min;
  }, 0);

  const formatNextExpiry = () => {
    if (nextExpiry === 0) return "—";
    const now = Math.floor(Date.now() / 1000);
    const diff = nextExpiry - now;
    if (diff <= 0) return "Expirado";
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <PageHeader
        title="Meus Vaults"
        description="Gerencie seus cofres de herança"
        actionLabel="+ Novo Vault"
        actionHref="/vaults/create"
      />

      {!connected && (
        <Card className="mt-8">
          <div className="flex flex-col items-center justify-center text-center p-8 md:p-12">
            <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center mb-5">
              <Shield className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Conecte sua carteira</h3>
            <p className="text-sm text-text-secondary max-w-sm mb-6">
              Conecte sua carteira Solana para visualizar seus vaults de herança.
            </p>
            <ClientOnly fallback={<Button disabled>Conectar Carteira</Button>}>
              <WalletMultiButton />
            </ClientOnly>
          </div>
        </Card>
      )}

      {connected && (
        <>
          {/* Stats */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card padding="default" className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0">
                <Vault className="w-5 h-5 text-accent-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary font-mono">{vaults.length}</p>
                <p className="text-xs text-text-tertiary">Total de vaults</p>
              </div>
            </Card>
            <Card padding="default" className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary font-mono">
                  {(totalBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL
                </p>
                <p className="text-xs text-text-tertiary">Valor total protegido</p>
              </div>
            </Card>
            <Card padding="default" className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary font-mono">{formatNextExpiry()}</p>
                <p className="text-xs text-text-tertiary">Próximo vencimento</p>
              </div>
            </Card>
          </div>

          {/* Loading */}
          {loading && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} padding="default" className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                  <div className="flex gap-3 pt-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && vaults.length === 0 && (
            <Card className="mt-8">
              <EmptyState
                title="Nenhum vault criado ainda"
                description="Crie seu primeiro vault de herança digital em poucos passos. Proteja seus ativos para o futuro."
                actionLabel="Criar meu primeiro Vault"
                actionHref="/vaults/create"
                icon={<Shield className="w-8 h-8 text-accent-primary" />}
              />
            </Card>
          )}

          {/* Grid */}
          {!loading && vaults.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {vaults.map((vault) => (
                <VaultCard key={vault.publicKey.toBase58()} vault={vault} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
