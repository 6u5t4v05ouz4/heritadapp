"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useVault } from "@/hooks/useVault";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import Link from "next/link";
import { Trash2, ExternalLink, RefreshCw, Copy, Check, Clock, Wallet, AlertTriangle, ArrowLeft, Heart, TrendingUp, Ban, Settings, Coins, Shield, User, Users, Info, X, CheckCircle, Zap, Pencil } from "lucide-react";
import Confetti from "react-confetti";
import ClientOnly from "@/components/ClientOnly";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import CopyButton from "@/components/ui/CopyButton";
import ProgressBar from "@/components/ui/ProgressBar";
import Skeleton from "@/components/ui/Skeleton";
import { useEnhancedToast } from "@/hooks/useEnhancedToast";
import { getAddressExplorerUrl, getTxExplorerUrl } from "@/lib/explorer";

export default function VaultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { fetchVault, depositSol, heartbeat, cancelVault, claim, updateConfig } = useVault();
  const { success, error: showError, ToastContainer } = useEnhancedToast();

  const vaultAddress = params.address as string;
  const [vault, setVault] = useState<any>(null);
  const [vaultBalance, setVaultBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [now, setNow] = useState(Date.now());

  // Supabase heirs data (enriched with name, email, phone)
  const [supabaseHeirs, setSupabaseHeirs] = useState<any[]>([]);
  const [heirsLoading, setHeirsLoading] = useState(false);
  const [isVaultSynced, setIsVaultSynced] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Edit modal state
  const [editingHeir, setEditingHeir] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    walletAddress: "",
    assetMint: "",
    allocationType: "percentage",
    allocationValue: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [deletingHeirId, setDeletingHeirId] = useState<string | null>(null);

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

  // Load heirs from Supabase
  useEffect(() => {
    if (!vaultAddress) return;
    loadSupabaseHeirs();
  }, [vaultAddress]);

  const loadSupabaseHeirs = async () => {
    setHeirsLoading(true);
    try {
      const res = await fetch(`/api/vaults/${vaultAddress}/heirs`);
      if (res.ok) {
        const data = await res.json();
        setSupabaseHeirs(data.heirs || []);
        setIsVaultSynced(true);
      } else if (res.status === 404) {
        setSupabaseHeirs([]);
        setIsVaultSynced(false);
      } else {
        console.error("[VaultDetail] Failed to load heirs:", res.status);
        setSupabaseHeirs([]);
        setIsVaultSynced(false);
      }
    } catch (err) {
      console.error("[VaultDetail] Failed to load heirs:", err);
      setSupabaseHeirs([]);
      setIsVaultSynced(false);
    } finally {
      setHeirsLoading(false);
    }
  };

  // Helper: converte herdeiros do Supabase para formato on-chain
  const buildHeirsForOnChain = (heirsList: any[]): { wallet: string; asset: string; allocationType: { percentage: {} } | { fixedAmount: {} }; allocationValue: number }[] => {
    return heirsList.map((h) => ({
      wallet: h.wallet_address,
      asset: h.asset_mint || "11111111111111111111111111111111",
      allocationType:
        h.allocation_type === "percentage"
          ? ({ percentage: {} } as { percentage: {} })
          : ({ fixedAmount: {} } as { fixedAmount: {} }),
      allocationValue: h.allocation_value,
    }));
  };

  // Helper: recalcula percentuais para somar 10000 bps após remoção
  const recalculatePercentages = (heirsList: any[]): any[] => {
    const result = heirsList.map((h) => ({ ...h }));
    const percentageHeirs = result.filter((h) => h.allocation_type === "percentage");
    if (percentageHeirs.length > 0) {
      const total = percentageHeirs.reduce((sum, h) => sum + h.allocation_value, 0);
      if (total > 0 && total !== 10000) {
        const factor = 10000 / total;
        let newTotal = 0;
        for (let i = 0; i < percentageHeirs.length; i++) {
          const h = percentageHeirs[i];
          const newValue = i === percentageHeirs.length - 1
            ? 10000 - newTotal
            : Math.floor(h.allocation_value * factor);
          h.allocation_value = newValue;
          newTotal += newValue;
        }
      }
    }
    return result;
  };

  const openEditModal = (heir: any) => {
    setEditingHeir(heir);
    setEditForm({
      name: heir.name || "",
      email: heir.email || "",
      phone: heir.phone || "",
      walletAddress: heir.wallet_address || "",
      assetMint: heir.asset_mint || "11111111111111111111111111111111",
      allocationType: heir.allocation_type === "percentage" ? "percentage" : "fixed",
      allocationValue:
        heir.allocation_type === "percentage" && heir.allocation_value
          ? (heir.allocation_value / 100).toString()
          : heir.allocation_value?.toString() || "",
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingHeir(null);
    setEditLoading(false);
  };

  const handleUpdateHeir = async () => {
    if (!editingHeir || !publicKey) return;

    if (!editForm.name.trim() || !editForm.walletAddress.trim() || !editForm.allocationValue) {
      showError("Please fill all required fields");
      return;
    }
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      showError("Invalid email address");
      return;
    }
    if (editForm.walletAddress === publicKey.toBase58()) {
      showError("You cannot use your own wallet as an heir");
      return;
    }
    try {
      new PublicKey(editForm.walletAddress.trim());
    } catch (e) {
      showError("Invalid Solana wallet address");
      return;
    }

    const otherHeirs = supabaseHeirs.filter(h => h.id !== editingHeir.id);
    if (otherHeirs.some(h => h.wallet_address === editForm.walletAddress.trim())) {
      showError("Another heir already uses this wallet address");
      return;
    }
    if (editForm.email && otherHeirs.some(h => h.email?.toLowerCase() === editForm.email.trim().toLowerCase())) {
      showError("Another heir already uses this email");
      return;
    }
    if (editForm.phone && otherHeirs.some(h => h.phone === editForm.phone.trim())) {
      showError("Another heir already uses this phone number");
      return;
    }

    setEditLoading(true);
    try {
      // Verifica se dados on-chain mudaram (wallet, allocationType, allocationValue)
      const onChainChanged =
        editForm.walletAddress.trim() !== editingHeir.wallet_address ||
        editForm.allocationType !== (editingHeir.allocation_type === "percentage" ? "percentage" : "fixed") ||
        Number(editForm.allocationValue) !== (editingHeir.allocation_type === "percentage" ? editingHeir.allocation_value / 100 : editingHeir.allocation_value);

      if (onChainChanged) {
        // Atualizar on-chain primeiro
        const updatedSupabaseHeirs = supabaseHeirs.map((h) =>
          h.id === editingHeir.id
            ? {
                ...h,
                wallet_address: editForm.walletAddress.trim(),
                allocation_type: editForm.allocationType === "percentage" ? "percentage" : "fixed_amount",
                allocation_value:
                  editForm.allocationType === "percentage"
                    ? Number(editForm.allocationValue) * 100
                    : Number(editForm.allocationValue),
              }
            : h
        );

        // Se porcentagem, validar soma
        const pctSum = updatedSupabaseHeirs
          .filter((h) => h.allocation_type === "percentage")
          .reduce((sum, h) => sum + h.allocation_value, 0);
        if (pctSum !== 10000) {
          throw new Error(`Percentage allocations must sum to 100% (current: ${(pctSum / 100).toFixed(2)}%)`);
        }

        const onChainHeirs = buildHeirsForOnChain(updatedSupabaseHeirs);
        await updateConfig(new PublicKey(vaultAddress), onChainHeirs);
        success("On-chain configuration updated!");
      }

      // Atualizar no Supabase (sempre, mesmo que on-chain não mudou — nome/email/phone podem ter mudado)
      const res = await fetch(`/api/heirs/${editingHeir.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerAddress: publicKey.toBase58(),
            name: editForm.name,
            walletAddress: editForm.walletAddress,
            assetMint: editForm.assetMint,
            allocationType: editForm.allocationType,
            allocationValue:
              editForm.allocationType === "percentage"
                ? Number(editForm.allocationValue) * 100
                : Number(editForm.allocationValue),
            email: editForm.email,
            phone: editForm.phone,
          }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update heir");
      }

      success("Heir updated successfully!");
      closeEditModal();
      await loadSupabaseHeirs();
      // Refresh vault on-chain data
      const updatedVault = await fetchVault(new PublicKey(vaultAddress));
      if (updatedVault) setVault(updatedVault);
    } catch (err: any) {
      showError(err.message || "Error updating heir");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteHeir = async (heir: any) => {
    if (!publicKey) return;
    if (!confirm(`Are you sure you want to remove heir "${heir.name || heir.wallet_address}"? This will also update the on-chain configuration.`)) return;

    setDeletingHeirId(heir.id);
    try {
      // 1. Construir nova lista de herdeiros sem o removido
      const remainingHeirs = supabaseHeirs.filter((h) => h.id !== heir.id);

      // 2. Se restam herdeiros com percentage, recalcular para 100%
      const heirsForOnChain = remainingHeirs.length > 0 ? recalculatePercentages(remainingHeirs) : [];

      // 3. Validar soma de percentuais
      const pctSum = heirsForOnChain
        .filter((h) => h.allocation_type === "percentage")
        .reduce((sum, h) => sum + h.allocation_value, 0);
      if (heirsForOnChain.length > 0 && pctSum !== 10000) {
        throw new Error(`Percentage allocations must sum to 100% (current: ${(pctSum / 100).toFixed(2)}%). Please adjust remaining heirs before removing.`);
      }

      // 4. Atualizar on-chain primeiro
      if (heirsForOnChain.length > 0) {
        const onChainHeirs = buildHeirsForOnChain(heirsForOnChain);
        await updateConfig(new PublicKey(vaultAddress), onChainHeirs);
        success("On-chain configuration updated!");
      } else {
        // Se não restam herdeiros, atualizar com lista vazia
        await updateConfig(new PublicKey(vaultAddress), []);
        success("On-chain heirs cleared!");
      }

      // 5. Deletar do Supabase
      const res = await fetch(
        `/api/heirs/${heir.id}?ownerAddress=${publicKey.toBase58()}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete heir");
      }

      success("Heir removed successfully!");
      await loadSupabaseHeirs();
      // Refresh vault on-chain data
      const updatedVault = await fetchVault(new PublicKey(vaultAddress));
      if (updatedVault) setVault(updatedVault);
    } catch (err: any) {
      showError(err.message || "Error removing heir");
    } finally {
      setDeletingHeirId(null);
    }
  };

  const handleDeposit = async () => {
    setError("");
    setActionLoading("deposit");
    try {
      const tx = await depositSol(new PublicKey(vaultAddress), Number(depositAmount));
      success("Deposit sent!", `${depositAmount} SOL deposited`, tx);
      setDepositAmount("");
      const updated = await fetchVault(new PublicKey(vaultAddress));
      setVault(updated);
      const bal = await connection.getBalance(new PublicKey(vaultAddress));
      setVaultBalance(bal);
    } catch (err: any) {
      const msg = err.message || "Error depositing";
      setError(msg);
      showError("Deposit failed", msg);
    } finally {
      setActionLoading("");
    }
  };

  const handleHeartbeat = async () => {
    setError("");
    setActionLoading("heartbeat");
    try {
      const tx = await heartbeat(new PublicKey(vaultAddress));
      success("Heartbeat sent!", "Inactivity timer reset", tx);
      const updated = await fetchVault(new PublicKey(vaultAddress));
      setVault(updated);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 8000);
    } catch (err: any) {
      const msg = err.message || "Heartbeat error";
      setError(msg);
      showError("Heartbeat failed", msg);
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
      success("Vault canceled!", "All funds returned to owner", tx);
      setTimeout(() => router.push("/vaults"), 2000);
    } catch (err: any) {
      const msg = err.message || "Error canceling";
      setError(msg);
      showError("Cancel failed", msg);
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
      success("Claim executed!", "Assets distributed to heirs", tx);
      setTimeout(() => router.push("/vaults"), 2000);
    } catch (err: any) {
      const msg = err.message || "Error executing claim";
      setError(msg);
      showError("Claim failed", msg);
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

  const isCheckedInToday =
    lastHeartbeat > 0 &&
    new Date(lastHeartbeat * 1000).toDateString() === new Date(now).toDateString();

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 relative overflow-hidden">
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Confetti
            recycle={false}
            numberOfPieces={400}
            gravity={0.15}
            onConfettiComplete={() => setShowConfetti(false)}
          />
        </div>
      )}
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
              <a
                href={getAddressExplorerUrl(vaultAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-text-tertiary hover:text-accent-primary transition-colors"
                title="View on Solana Explorer"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
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
              <Heart className={`w-4 h-4 text-accent-primary ${isCheckedInToday ? '' : 'animate-pulse'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Heartbeat</h3>
              <p className="text-xs text-text-tertiary">Resets the inactivity timer</p>
            </div>
          </div>

          <div className="mb-4">
            {lastHeartbeat > 0 ? (
              <p className="text-xs text-text-secondary flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                Last check-in: <span className="font-medium text-text-primary">{new Date(lastHeartbeat * 1000).toLocaleString()}</span>
              </p>
            ) : (
              <p className="text-xs text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                No check-in recorded yet
              </p>
            )}
          </div>

          <Button
            onClick={handleHeartbeat}
            disabled={actionLoading === "heartbeat" || isCheckedInToday}
            isLoading={actionLoading === "heartbeat"}
            className="w-full"
            variant={isCheckedInToday ? "secondary" : "primary"}
          >
            {isCheckedInToday ? "Check-in realizado hoje" : "Send Heartbeat"}
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
      {(vault.heirs?.length > 0 || supabaseHeirs.length > 0) && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent-warm/10 border border-accent-warm/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-accent-warm" />
              </div>
              <h3 className="font-semibold text-text-primary">
                Heirs ({isVaultSynced ? supabaseHeirs.length : vault.heirs?.length || 0})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {heirsLoading && (
                <span className="text-xs text-text-tertiary">Syncing...</span>
              )}
              <button
                onClick={loadSupabaseHeirs}
                disabled={heirsLoading}
                className="text-xs text-accent-primary hover:text-accent-primary/80 transition-colors disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Warning: on-chain heirs not in Supabase */}
          {vault.heirs?.length > 0 && isVaultSynced === false && !heirsLoading && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              Heirs found on-chain but not synced with database. Edit/delete unavailable until synced.
            </div>
          )}

          <div className="space-y-3">
            {/* Supabase heirs (editable) */}
            {supabaseHeirs.map((heir: any) => (
              <div
                key={heir.id}
                className="p-4 rounded-xl bg-bg-elevated border border-border-subtle"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {heir.name ? (
                        <span className="font-semibold text-text-primary text-sm">
                          {heir.name}
                        </span>
                      ) : (
                        <span className="text-sm text-text-tertiary italic">
                          Unnamed heir
                        </span>
                      )}
                      <Badge variant="default" className="text-[10px]">
                        {heir.allocation_type === "percentage" ? "%" : "Fixed"}
                      </Badge>
                    </div>
                    <div className="font-mono text-xs text-text-tertiary truncate">
                      {heir.wallet_address}
                    </div>
                    {(heir.email || heir.phone) && (
                      <div className="flex items-center gap-3 mt-1.5">
                        {heir.email && (
                          <span className="text-xs text-text-secondary">
                            {heir.email}
                          </span>
                        )}
                        {heir.phone && (
                          <span className="text-xs text-text-secondary">
                            {heir.phone}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-text-tertiary">
                        Asset:{" "}
                        <span className="font-mono">
                          {heir.asset_mint === "11111111111111111111111111111111"
                            ? "SOL (Native)"
                            : `${heir.asset_mint.slice(0, 6)}...${heir.asset_mint.slice(-6)}`}
                        </span>
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="text-text-primary font-medium font-mono text-sm">
                          {heir.allocation_type === "percentage"
                            ? `${(heir.allocation_value / 100).toFixed(0)}%`
                            : heir.allocation_value}
                        </span>
                        {heir.allocation_type === "percentage" && (
                          <span className="text-[10px] text-emerald-400 font-mono mt-0.5">
                            Est: {((vaultBalance / LAMPORTS_PER_SOL) * (heir.allocation_value / 10000)).toFixed(5)} SOL
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(heir)}
                      className="p-1.5 rounded-lg text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 transition-colors"
                      aria-label="Edit heir"
                      title="Edit heir"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteHeir(heir)}
                      disabled={deletingHeirId === heir.id}
                      className="p-1.5 rounded-lg text-text-tertiary hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Delete heir"
                      title="Remove heir"
                    >
                      {deletingHeirId === heir.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* On-chain heirs fallback (not editable) */}
            {isVaultSynced === false &&
              vault.heirs?.map((heir: any, i: number) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-bg-elevated border border-border-subtle opacity-70"
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
                      Asset:{" "}
                      <span className="font-mono text-xs text-text-tertiary">
                        {heir.asset?.toBase58?.() || heir.asset}
                      </span>
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="text-text-primary font-medium font-mono">
                        {heir.allocationType?.percentage !== undefined
                          ? `${(Number(heir.allocationValue?.toString?.() || heir.allocationValue) / 100).toFixed(0)}%`
                          : heir.allocationValue?.toString?.() || heir.allocationValue}
                      </span>
                      {heir.allocationType?.percentage !== undefined && (
                        <span className="text-[10px] text-emerald-400 font-mono mt-0.5">
                          Est: {((vaultBalance / LAMPORTS_PER_SOL) * (Number(heir.allocationValue?.toString?.() || heir.allocationValue) / 10000)).toFixed(5)} SOL
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Edit Heir Modal */}
      {showEditModal && editingHeir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-bg-base border border-border-subtle rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary">
                Edit Heir
              </h3>
              <button
                onClick={closeEditModal}
                className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Full Name
                </label>
                <Input
                  value={editForm.name}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^A-Za-zÀ-ÿ\s]/g, "");
                    setEditForm((f) => ({ ...f, name: val }));
                  }}
                  placeholder="Heir name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Wallet Address
                </label>
                <Input
                  value={editForm.walletAddress}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, walletAddress: e.target.value }))
                  }
                  placeholder="Solana wallet address"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Asset Mint
                </label>
                <Input
                  value={editForm.assetMint}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, assetMint: e.target.value }))
                  }
                  placeholder="Token mint address"
                  disabled
                  className="opacity-60 cursor-not-allowed"
                />
                <p className="text-[10px] text-text-tertiary mt-1">
                  Asset cannot be changed after creation
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Allocation Type
                  </label>
                  <select
                    value={editForm.allocationType}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        allocationType: e.target.value,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-lg bg-bg-elevated border border-border-subtle text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Value
                  </label>
                  <Input
                    type="number"
                    value={editForm.allocationValue}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        allocationValue: e.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Email
                </label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="heir@email.com"
                />
                <p className="text-[10px] text-text-tertiary mt-1">
                  Email will be saved in notification preferences
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Phone
                </label>
                <Input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d+\-()\s]/g, "");
                    setEditForm((f) => ({ ...f, phone: val }));
                  }}
                  placeholder="+1 234 567 890"
                />
                <p className="text-[10px] text-text-tertiary mt-1">
                  Phone will be saved in notification preferences
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={closeEditModal}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateHeir}
                isLoading={editLoading}
                disabled={editLoading}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
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
          {lastHeartbeat > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-accent-warm mt-2 shrink-0" />
              <div>
                <p className="text-sm text-text-primary font-medium">Last check-in</p>
                <p className="text-xs text-text-tertiary">Recorded on {new Date(lastHeartbeat * 1000).toLocaleString()}</p>
              </div>
            </div>
          )}
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
