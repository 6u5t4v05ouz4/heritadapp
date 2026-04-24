"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useVault } from "@/hooks/useVault";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import Link from "next/link";

export default function VaultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { connected } = useWallet();
  const { fetchVault, depositSol, heartbeat, cancelVault, claim } = useVault();

  const vaultAddress = params.address as string;
  const [vault, setVault] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  useEffect(() => {
    if (!vaultAddress) return;
    setLoading(true);
    fetchVault(new PublicKey(vaultAddress))
      .then((data) => {
        setVault(data);
      })
      .catch(() => setVault(null))
      .finally(() => setLoading(false));
  }, [vaultAddress, fetchVault]);

  const handleDeposit = async () => {
    setError("");
    setSuccess("");
    setActionLoading("deposit");
    try {
      const tx = await depositSol(new PublicKey(vaultAddress), Number(depositAmount));
      setSuccess(`Depósito enviado! Tx: ${tx.slice(0, 20)}...`);
      setDepositAmount("");
      // Refresh vault
      const updated = await fetchVault(new PublicKey(vaultAddress));
      setVault(updated);
    } catch (err: any) {
      setError(err.message || "Erro ao depositar");
    } finally {
      setActionLoading("");
    }
  };

  const handleHeartbeat = async () => {
    setError("");
    setSuccess("");
    setActionLoading("heartbeat");
    try {
      const tx = await heartbeat(new PublicKey(vaultAddress));
      setSuccess(`Heartbeat enviado! Tx: ${tx.slice(0, 20)}...`);
      const updated = await fetchVault(new PublicKey(vaultAddress));
      setVault(updated);
    } catch (err: any) {
      setError(err.message || "Erro no heartbeat");
    } finally {
      setActionLoading("");
    }
  };

  const handleCancel = async () => {
    if (!confirm("Tem certeza que deseja cancelar este vault? Todos os fundos serão devolvidos.")) return;
    setError("");
    setSuccess("");
    setActionLoading("cancel");
    try {
      const tx = await cancelVault(new PublicKey(vaultAddress));
      setSuccess(`Vault cancelado! Tx: ${tx.slice(0, 20)}...`);
      setTimeout(() => router.push("/vaults"), 2000);
    } catch (err: any) {
      setError(err.message || "Erro ao cancelar");
    } finally {
      setActionLoading("");
    }
  };

  const handleClaim = async () => {
    if (!confirm("Executar claim? Esta ação distribuirá os ativos para os herdeiros.")) return;
    setError("");
    setSuccess("");
    setActionLoading("claim");
    try {
      const tx = await claim(new PublicKey(vaultAddress));
      setSuccess(`Claim executado! Tx: ${tx.slice(0, 20)}...`);
      setTimeout(() => router.push("/vaults"), 2000);
    } catch (err: any) {
      setError(err.message || "Erro ao executar claim");
    } finally {
      setActionLoading("");
    }
  };

  const formatTimeRemaining = (lastHeartbeat: number, inactivityPeriod: number) => {
    const now = Math.floor(Date.now() / 1000);
    const expiry = lastHeartbeat + inactivityPeriod;
    const diff = expiry - now;
    if (diff <= 0) return "Expirado";
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (!connected) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-12 px-4">
        <div className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center max-w-md">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
            Detalhes do Vault
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Conecte sua carteira para visualizar este vault
          </p>
          <WalletMultiButton className="!bg-zinc-900 !text-white hover:!bg-zinc-700 dark:!bg-zinc-100 dark:!text-black dark:hover:!bg-zinc-300" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-12">
        <div className="animate-pulse space-y-4 w-full max-w-2xl">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3"></div>
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
          <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-12 px-4">
        <div className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center max-w-md">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
            Vault não encontrado
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Este endereço não corresponde a nenhum vault ativo
          </p>
          <Link
            href="/vaults"
            className="inline-block py-2 px-4 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black font-medium hover:opacity-90 transition-opacity"
          >
            ← Voltar para Vaults
          </Link>
        </div>
      </div>
    );
  }

  const lastHeartbeat = Number(vault.lastHeartbeat?.toString() || 0);
  const inactivityPeriod = Number(vault.inactivityPeriod?.toString() || 0);
  const isExpired = Math.floor(Date.now() / 1000) > lastHeartbeat + inactivityPeriod;
  const isActive = vault.status?.active !== undefined;

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-black py-12 px-4">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Vault
            </h1>
            <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {vaultAddress}
            </p>
          </div>
          <Link
            href="/vaults"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            ← Voltar
          </Link>
        </div>

        {/* Status Card */}
        <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black dark:text-white">
              Status
            </h2>
            <span
              className={`text-sm px-3 py-1 rounded-full font-medium ${
                isActive
                  ? isExpired
                    ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {isActive ? (isExpired ? "Expirado" : "Ativo") : "Inativo"}
            </span>
          </div>

          {isActive && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-500">Tempo restante</span>
                <span className="font-mono text-black dark:text-white">
                  {formatTimeRemaining(lastHeartbeat, inactivityPeriod)}
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isExpired ? "bg-red-500 w-full" : "bg-green-500"
                  }`}
                  style={{
                    width: isExpired
                      ? "100%"
                      : `${Math.max(
                          0,
                          Math.min(
                            100,
                            ((lastHeartbeat + inactivityPeriod - Math.floor(Date.now() / 1000)) /
                              inactivityPeriod) *
                              100
                          )
                        )}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">Dono</span>
              <p className="font-mono text-xs text-black dark:text-white truncate">
                {vault.owner?.toBase58?.() || vault.owner}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Seed</span>
              <p className="text-black dark:text-white font-medium">
                {vault.seed?.toString?.() || vault.seed}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Taxa Keeper</span>
              <p className="text-black dark:text-white font-medium">
                {(Number(vault.keeperFeeBps?.toString?.() || vault.keeperFeeBps) / 100).toFixed(2)}%
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Gas Reserve</span>
              <p className="text-black dark:text-white font-medium">
                {((Number(vault.gasReserveLamports?.toString?.() || vault.gasReserveLamports)) / LAMPORTS_PER_SOL).toFixed(4)} SOL
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-600 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Deposit SOL */}
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-3">
              Depositar SOL
            </h3>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="Quantidade em SOL"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              <button
                onClick={handleDeposit}
                disabled={actionLoading === "deposit" || !depositAmount}
                className="py-2 px-4 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {actionLoading === "deposit" ? "..." : "Depositar"}
              </button>
            </div>
          </div>

          {/* Heartbeat */}
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-3">
              Heartbeat
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
              Reinicia o timer de inatividade. Garante que o vault permaneça ativo.
            </p>
            <button
              onClick={handleHeartbeat}
              disabled={actionLoading === "heartbeat"}
              className="w-full py-2 px-4 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {actionLoading === "heartbeat" ? "Enviando..." : "Enviar Heartbeat"}
            </button>
          </div>

          {/* Cancel */}
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-3">
              Cancelar Vault
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
              Devolve todos os fundos para o dono e fecha o vault.
            </p>
            <button
              onClick={handleCancel}
              disabled={actionLoading === "cancel"}
              className="w-full py-2 px-4 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              {actionLoading === "cancel" ? "Cancelando..." : "Cancelar Vault"}
            </button>
          </div>

          {/* Claim */}
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-3">
              Executar Claim
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
              Distribui os ativos para os herdeiros. Só disponível após expiração.
            </p>
            <button
              onClick={handleClaim}
              disabled={actionLoading === "claim" || !isExpired}
              className="w-full py-2 px-4 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {actionLoading === "claim" ? "Executando..." : "Executar Claim"}
            </button>
          </div>
        </div>

        {/* Heirs */}
        {vault.heirs && vault.heirs.length > 0 && (
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
              Herdeiros ({vault.heirs.length})
            </h3>
            <div className="space-y-3">
              {vault.heirs.map((heir: any, i: number) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {heir.wallet?.toBase58?.() || heir.wallet}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                      {heir.allocationType?.percentage !== undefined ? "%" : "Fixo"}
                    </span>
                  </div>
                  <p className="text-zinc-500 mt-1">
                    Asset:{" "}
                    <span className="font-mono text-xs">
                      {heir.asset?.toBase58?.() || heir.asset}
                    </span>
                  </p>
                  <p className="text-black dark:text-white font-medium mt-1">
                    Valor: {heir.allocationValue?.toString?.() || heir.allocationValue}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
