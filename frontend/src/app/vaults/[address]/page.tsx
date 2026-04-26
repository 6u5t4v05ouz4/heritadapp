"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useVault } from "@/hooks/useVault";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Ban,
  Zap,
  Coins,
  Wallet,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  Settings,
} from "lucide-react";
import ClientOnly from "@/components/ClientOnly";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import CopyButton from "@/components/ui/CopyButton";
import ProgressBar from "@/components/ui/ProgressBar";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/hooks/useToast";

export default function VaultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { connected } = useWallet();
  const { connection } = useConnection();
  const { fetchVault, depositSol, heartbeat, cancelVault, claim } = useVault();
  const { success, error: showError, ToastContainer } = useToast();

  const vaultAddress = params.address as string;
  const [vault, setVault] = useState<any>(null);
  const [vaultBalance, setVaultBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!vaultAddress) return;
    setLoading(true);

    const loadVault = async () => {
      try {
        const data = await fetchVault(new PublicKey(vaultAddress));
        setVault(data);
        const balance = await connection.getBalance(new PublicKey(vaultAddress));
        setVaultBalance(balance);
      } catch {
        setVault(null);
        setVaultBalance(0);
      } finally {
        setLoading(false);
      }
    };

    loadVault();
  }, [vaultAddress, fetchVault, connection]);

  const handleDeposit = async () => {
    setError("");
    setActionLoading("deposit");
    try {
      const tx = await depositSol(new PublicKey(vaultAddress), Number(depositAmount));
      success(`Deposit sent! Tx: ${tx.slice(0, 20)}...`);
      setDepositAmount("");
      const updated = await fetchVault(new PublicKey(vaultAddress));
      setVault(updated);
      const bal = await connection.getBalance(new PublicKey(vaultAddress));
      setVaultBalance(bal);
    } catch (err: any) {
      const msg = err.message || "Error depositing";
      setError(msg);
      showError(msg);
    } finally {
      setActionLoading("");
    }
  };

  const handleHeartbeat = async () => {
    setError("");
    setActionLoading("heartbeat");
    try {
      const tx = await heartbeat(new PublicKey(vaultAddress));
      success(`Heartbeat sent! Tx: ${tx.slice(0, 20)}...`);
      const updated = await fetchVault(new PublicKey(vaultAddress));
      setVault(updated);
    } catch (err: any) {
      const msg = err.message || "Heartbeat error";
      setError(msg);
      showError(msg);
    } finally {
      setActionLoading("");
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this vault? All funds will be returned.")) return;
    setError("");
    setActionLoading("cancel");
    try {
      const tx = await cancelVault(new PublicKey(vaultAddress));
      success(`Vault canceled! Tx: ${tx.slice(0, 20)}...`);
      setTimeout(() => router.push("/vaults"), 2000);
    } catch (err: any) {
      const msg = err.message || "Error canceling";
      setError(msg);
      showError(msg);
    } finally {
      setActionLoading("");
    }
  };

  const handleClaim = async () => {
    if (!confirm("Execute claim? This action will distribute assets to the heirs.")) return;
    setError("");
    setActionLoading("claim");
    try {
      const heirPubkeys = vault?.heirs?.map((h: any) => {
        const addr = h.wallet?.toBase58?.() || h.wallet;
        return new PublicKey(addr);
      }) || [];

      const tx = await claim(new PublicKey(vaultAddress), heirPubkeys);
      success(`Claim executed! Tx: ${tx.slice(0, 20)}...`);
      setTimeout(() => router.push("/vaults"), 2000);
    } catch (err: any) {
      const msg = err.message || "Error executing claim";
      setError(msg);
      showError(msg);
    } finally {
      setActionLoading("");
    }
  };

  const formatTimeRemaining = (lastHeartbeat: number, inactivityPeriod: number) => {
    if (lastHeartbeat === 0) return "Waiting for deposit";
    const nowSec = Math.floor(now / 1000);
    const expiry = lastHeartbeat + inactivityPeriod;
    const diff = expiry - nowSec;
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  if (!connected) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <PageHeader title="Vault Details" />
        <Card className="mt-8">
          <div className="flex flex-col items-center justify-center text-center p-8 md:p-12">
            <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center mb-5">
              <Wallet className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Connect your wallet</h3>
            <p className="text-sm text-text-secondary max-w-sm mb-6">
              Connect your wallet to view this vault.
            </p>
            <ClientOnly fallback={<Button disabled>Connect Wallet</Button>}>
              <WalletMultiButton />
            </ClientOnly>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Card className="mb-6">
          <Skeleton className="h-32 w-full" />
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card><Skeleton className="h-24 w-full" /></Card>
          <Card><Skeleton className="h-24 w-full" /></Card>
          <Card><Skeleton className="h-24 w-full" /></Card>
          <Card><Skeleton className="h-24 w-full" /></Card>
        </div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <PageHeader title="Vault not found" backHref="/vaults" />
        <Card className="mt-8">
          <div className="flex flex-col items-center justify-center text-center p-8 md:p-12">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Vault not found</h3>
            <p className="text-sm text-text-secondary max-w-sm mb-6">
              This address does not match any active vault.
            </p>
            <Link href="/vaults">
              <Button variant="secondary">← Back to Vaults</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const lastHeartbeat = Number(vault.lastHeartbeat?.toString?.() || vault.lastHeartbeat || 0);
  const inactivityPeriod = Number(vault.inactivityPeriod?.toString?.() || vault.inactivityPeriod || 0);
  const isWaiting = lastHeartbeat === 0;
  const isTimerActive = lastHeartbeat !== 0;
  const isExpired = isTimerActive && Math.floor(now / 1000) > lastHeartbeat + inactivityPeriod;
  const isActive = vault.status?.active !== undefined;

  const totalSeconds = inactivityPeriod;
  const remainingSeconds = isExpired ? 0 : Math.max(0, lastHeartbeat + inactivityPeriod - Math.floor(now / 1000));
  const progress = isWaiting ? 0 : isExpired ? 100 : ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
  let timerVariant: "success" | "warning" | "danger" | "neutral" = "success";
  if (isWaiting) timerVariant = "neutral";
  else if (isExpired) timerVariant = "danger";
  else if (remainingSeconds < totalSeconds * 0.25) timerVariant = "danger";
  else if (remainingSeconds < totalSeconds * 0.5) timerVariant = "warning";

  const statusBadge = isActive
    ? isExpired
      ? "expired"
      : isWaiting
      ? "waiting"
      : "active"
    : "default";

  const statusLabel = isActive
    ? isExpired
      ? "Expired"
      : isWaiting
      ? "Waiting for Deposit"
      : "Active"
    : "Inactive";

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <ToastContainer />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/vaults"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-focus transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">Vault</h1>
            <div className="flex items-center gap-2 mt-1">
              <CopyButton
                text={vaultAddress}
                displayText={`${vaultAddress.slice(0, 8)}...${vaultAddress.slice(-8)}`}
                className="text-xs font-mono text-text-tertiary"
              />
              <Badge variant={statusBadge as any}>{statusLabel}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Timer Hero */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border-subtle flex items-center justify-center">
              <Clock className="w-5 h-5 text-text-secondary" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">
                {isWaiting ? "Inactivity timer" : isExpired ? "Status" : "Time remaining"}
              </p>
              <p
                className={`text-2xl md:text-3xl font-mono font-bold ${
                  timerVariant === "danger"
                    ? "text-rose-400"
                    : timerVariant === "warning"
                    ? "text-amber-400"
                    : timerVariant === "success"
                    ? "text-emerald-400"
                    : "text-text-primary"
                }`}
              >
                {formatTimeRemaining(lastHeartbeat, inactivityPeriod)}
              </p>
            </div>
          </div>
        </div>
        <ProgressBar value={progress} variant={timerVariant} />
      </Card>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Coins className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-text-primary">Balance</h3>
          </div>
          <p className="text-2xl font-mono font-bold text-text-primary">
            {(vaultBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL
          </p>
          <p className="text-xs text-text-tertiary mt-1">{vault.account?.assets?.length || 0} assets</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
              <Settings className="w-4 h-4 text-accent-primary" />
            </div>
            <h3 className="font-semibold text-text-primary">Settings</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-tertiary">Keeper Fee</span>
              <span className="text-text-primary font-medium">
                {(Number(vault.keeperFeeBps?.toString?.() || vault.keeperFeeBps || 0) / 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Gas Reserve</span>
              <span className="text-text-primary font-medium">
                {((Number(vault.gasReserveLamports?.toString?.() || vault.gasReserveLamports || 0)) / LAMPORTS_PER_SOL).toFixed(4)} SOL
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Seed</span>
              <span className="text-text-primary font-mono">{vault.seed?.toString?.() || vault.seed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Inactivity</span>
              <span className="text-text-primary font-medium">{inactivityPeriod} min</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Deposit */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Deposit SOL</h3>
              <p className="text-xs text-text-tertiary">Add funds to the vault</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.001"
              min="0"
              placeholder="Amount in SOL"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleDeposit}
              disabled={actionLoading === "deposit" || !depositAmount}
              isLoading={actionLoading === "deposit"}
            >
              Deposit
            </Button>
          </div>
        </Card>

        {/* Heartbeat */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-accent-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Heartbeat</h3>
              <p className="text-xs text-text-tertiary">Resets the inactivity timer</p>
            </div>
          </div>
          <Button
            onClick={handleHeartbeat}
            disabled={actionLoading === "heartbeat"}
            isLoading={actionLoading === "heartbeat"}
            className="w-full"
          >
            Send Heartbeat
          </Button>
        </Card>

        {/* Cancel */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Ban className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Cancel Vault</h3>
              <p className="text-xs text-text-tertiary">Returns funds and closes the vault</p>
            </div>
          </div>
          <Button
            variant="danger"
            onClick={handleCancel}
            disabled={actionLoading === "cancel"}
            isLoading={actionLoading === "cancel"}
            className="w-full"
          >
            Cancel Vault
          </Button>
        </Card>

        {/* Claim */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Execute Claim</h3>
              <p className="text-xs text-text-tertiary">
                {isExpired ? "Available — vault expired" : "Available after expiration"}
              </p>
            </div>
          </div>
          <Button
            onClick={handleClaim}
            disabled={actionLoading === "claim" || !isExpired}
            isLoading={actionLoading === "claim"}
            className="w-full"
          >
            {!isExpired ? "Waiting for expiration" : "Execute Claim"}
          </Button>
        </Card>
      </div>

      {/* Heirs */}
      {vault.heirs && vault.heirs.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-accent-warm/10 border border-accent-warm/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-accent-warm" />
            </div>
            <h3 className="font-semibold text-text-primary">Heirs ({vault.heirs.length})</h3>
          </div>
          <div className="space-y-3">
            {vault.heirs.map((heir: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-bg-elevated border border-border-subtle"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-text-tertiary truncate max-w-[70%]">
                    {heir.wallet?.toBase58?.() || heir.wallet}
                  </span>
                  <Badge variant="default">
                    {heir.allocationType?.percentage !== undefined ? "%" : "Fixed"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">
                    Asset: <span className="font-mono text-xs text-text-tertiary">{heir.asset?.toBase58?.() || heir.asset}</span>
                  </span>
                  <span className="text-text-primary font-medium font-mono">
                    {heir.allocationValue?.toString?.() || heir.allocationValue}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Timeline / Activity */}
      <Card className="mt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Info className="w-4 h-4 text-sky-400" />
          </div>
          <h3 className="font-semibold text-text-primary">Activity</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
            <div>
              <p className="text-sm text-text-primary font-medium">Vault created</p>
              <p className="text-xs text-text-tertiary">Address: {vaultAddress.slice(0, 12)}...</p>
            </div>
          </div>
          {vaultBalance > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-accent-primary mt-2 shrink-0" />
              <div>
                <p className="text-sm text-text-primary font-medium">Current balance</p>
                <p className="text-xs text-text-tertiary">{(vaultBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
