"use client";

import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useHeirVaults, HeirVault } from "@/hooks/useHeirVaults";
import { useVault } from "@/hooks/useVault";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import Link from "next/link";
import {
  Shield,
  Wallet,
  Clock,
  Zap,
  AlertTriangle,
  Users,
  Coins,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import ClientOnly from "@/components/ClientOnly";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import { useEnhancedToast } from "@/hooks/useEnhancedToast";
import { getAddressExplorerUrl } from "@/lib/explorer";

export default function HeirPage() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { fetchHeirVaults, getMyAllocation, isClaimable, getTimeRemaining } = useHeirVaults();
  const { claim } = useVault();
  const { success, error: showError, ToastContainer } = useEnhancedToast();

  const [vaults, setVaults] = useState<HeirVault[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string>("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!connected || !publicKey) {
      setVaults([]);
      return;
    }
    loadVaults();
  }, [connected, publicKey]);

  const loadVaults = async () => {
    setLoading(true);
    try {
      const data = await fetchHeirVaults();
      setVaults(data);
    } catch (err: any) {
      showError("Failed to load vaults", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (vault: HeirVault) => {
    setActionLoading(vault.publicKey.toBase58());
    try {
      const heirPubkeys = vault.heirs.map((h) => h.wallet);
      const tx = await claim(vault.publicKey, heirPubkeys);
      success(
        "Claim executed!",
        `Assets distributed from vault ${vault.publicKey.toBase58().slice(0, 8)}...`,
        tx
      );
      // Refresh after claim
      setTimeout(() => loadVaults(), 2000);
    } catch (err: any) {
      showError("Claim failed", err.message);
    } finally {
      setActionLoading("");
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return "Expired";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    return `${minutes}m ${secs}s`;
  };

  const getStatusBadge = (vault: HeirVault) => {
    if (vault.status === "cancelled") return { label: "Cancelled", variant: "default" as const };
    if (vault.status === "claimed") return { label: "Claimed", variant: "default" as const };
    if (isClaimable(vault)) return { label: "Claimable", variant: "active" as const };
    if (vault.lastHeartbeat === 0) return { label: "Waiting deposit", variant: "waiting" as const };
    return { label: "Active", variant: "active" as const };
  };

  if (!connected) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <PageHeader
          title="Heir Dashboard"
          description="View and claim inheritance vaults where you are listed as an heir"
        />
        <Card className="mt-8">
          <div className="flex flex-col items-center justify-center text-center p-8 md:p-12">
            <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center mb-5">
              <Wallet className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Connect your wallet
            </h3>
            <p className="text-sm text-text-secondary max-w-sm mb-6">
              Connect your Solana wallet to view vaults where you are listed as an heir.
            </p>
            <ClientOnly fallback={<Button disabled>Connect Wallet</Button>}>
              <WalletMultiButton />
            </ClientOnly>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <ToastContainer />
      <PageHeader
        title="Heir Dashboard"
        description="Vaults where you are listed as an heir"
      />

      {/* Stats */}
      {vaults.length > 0 && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card padding="default" className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary font-mono">{vaults.length}</p>
              <p className="text-xs text-text-tertiary">Vaults as heir</p>
            </div>
          </Card>
          <Card padding="default" className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary font-mono">
                {(vaults.reduce((sum, v) => sum + v.balance, 0) / LAMPORTS_PER_SOL).toFixed(4)} SOL
              </p>
              <p className="text-xs text-text-tertiary">Total potential value</p>
            </div>
          </Card>
          <Card padding="default" className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary font-mono">
                {vaults.filter((v) => isClaimable(v)).length}
              </p>
              <p className="text-xs text-text-tertiary">Ready to claim</p>
            </div>
          </Card>
        </div>
      )}

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
          <div className="flex flex-col items-center justify-center text-center p-8 md:p-12">
            <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center mb-5">
              <Users className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No vaults found
            </h3>
            <p className="text-sm text-text-secondary max-w-sm mb-6">
              You are not listed as an heir in any vault yet. Ask the vault owner to add your wallet address.
            </p>
            <div className="text-xs text-text-tertiary font-mono bg-bg-elevated px-4 py-2 rounded-lg border border-border-subtle">
              {publicKey?.toBase58()}
            </div>
          </div>
        </Card>
      )}

      {/* Vaults grid */}
      {!loading && vaults.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {vaults.map((vault) => {
            const status = getStatusBadge(vault);
            const myAlloc = getMyAllocation(vault);
            const canClaim = isClaimable(vault);
            const timeRemaining = getTimeRemaining(vault);
            const totalSecs = vault.inactivityPeriod;
            const progress = vault.lastHeartbeat === 0
              ? 0
              : canClaim
              ? 100
              : ((totalSecs - timeRemaining) / totalSecs) * 100;

            return (
              <Card key={vault.publicKey.toBase58()} className="flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text-primary text-sm truncate">
                        Vault {vault.publicKey.toBase58().slice(0, 8)}...
                      </h3>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <a
                      href={getAddressExplorerUrl(vault.publicKey.toBase58())}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-text-tertiary hover:text-accent-primary transition-colors"
                    >
                      {vault.publicKey.toBase58().slice(0, 16)}...
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-mono font-bold text-text-primary">
                      {(vault.balance / LAMPORTS_PER_SOL).toFixed(4)} SOL
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {myAlloc
                        ? myAlloc.type === "percentage"
                          ? `${(myAlloc.value / 100).toFixed(0)}% share`
                          : `${myAlloc.value} fixed`
                        : "No allocation"}
                    </p>
                  </div>
                </div>

                {/* Timer */}
                {vault.lastHeartbeat > 0 && vault.status === "active" && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-text-tertiary flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {canClaim ? "Expired" : "Time remaining"}
                      </span>
                      <span
                        className={`font-mono font-medium ${
                          canClaim
                            ? "text-rose-400"
                            : timeRemaining < totalSecs * 0.25
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {formatTimeRemaining(timeRemaining)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-bg-elevated rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          canClaim
                            ? "bg-rose-400"
                            : timeRemaining < totalSecs * 0.25
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="space-y-1.5 text-xs text-text-tertiary mb-4">
                  <div className="flex justify-between">
                    <span>Owner</span>
                    <a
                      href={getAddressExplorerUrl(vault.owner.toBase58())}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-text-secondary hover:text-accent-primary transition-colors"
                    >
                      {vault.owner.toBase58().slice(0, 8)}...{vault.owner.toBase58().slice(-4)}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span>Heirs</span>
                    <span className="text-text-secondary">{vault.heirs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Keeper Fee</span>
                    <span className="text-text-secondary">{(vault.keeperFeeBps / 100).toFixed(2)}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-auto pt-4 border-t border-border-subtle">
                  {vault.status === "claimed" ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <Zap className="w-3.5 h-3.5" />
                      Claim already executed
                    </div>
                  ) : vault.status === "cancelled" ? (
                    <div className="flex items-center gap-2 text-xs text-text-tertiary">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Vault cancelled by owner
                    </div>
                  ) : canClaim ? (
                    <Button
                      onClick={() => handleClaim(vault)}
                      isLoading={actionLoading === vault.publicKey.toBase58()}
                      disabled={!!actionLoading}
                      className="w-full"
                    >
                      <Zap className="w-4 h-4 mr-1.5" />
                      Execute Claim
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-text-tertiary">
                      <Clock className="w-3.5 h-3.5" />
                      {vault.lastHeartbeat === 0
                        ? "Waiting for owner deposit"
                        : `Available in ${formatTimeRemaining(timeRemaining)}`}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
