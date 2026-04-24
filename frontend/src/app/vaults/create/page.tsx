"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useVault } from "@/hooks/useVault";
import { PublicKey } from "@solana/web3.js";
import Link from "next/link";

interface HeirInput {
  wallet: string;
  asset: string;
  allocationType: "percentage" | "fixed";
  allocationValue: string;
}

export default function CreateVaultPage() {
  const router = useRouter();
  const { connected } = useWallet();
  const { initializeVault } = useVault();

  const [step, setStep] = useState(1);
  const [seed, setSeed] = useState(Date.now().toString());
  const [inactivityMinutes, setInactivityMinutes] = useState("60");
  const [keeperFeeBps, setKeeperFeeBps] = useState("100");
  const [gasReserve, setGasReserve] = useState("0.01");
  const [heirs, setHeirs] = useState<HeirInput[]>([
    { wallet: "", asset: "11111111111111111111111111111111", allocationType: "percentage", allocationValue: "10000" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addHeir = () => {
    if (heirs.length >= 10) return;
    setHeirs([...heirs, { wallet: "", asset: "11111111111111111111111111111111", allocationType: "percentage", allocationValue: "" }]);
  };

  const removeHeir = (index: number) => {
    setHeirs(heirs.filter((_, i) => i !== index));
  };

  const updateHeir = (index: number, field: keyof HeirInput, value: string) => {
    const updated = [...heirs];
    updated[index] = { ...updated[index], [field]: value };
    setHeirs(updated);
  };

  const validateForm = (): string | null => {
    const minutes = Number(inactivityMinutes);
    if (minutes < 1 || minutes > 525600) {
      return "Período de inatividade deve estar entre 1 minuto e 525.600 minutos (1 ano)";
    }
    const fee = Number(keeperFeeBps);
    if (fee < 0 || fee > 100) {
      return "Taxa do keeper deve estar entre 0 e 100 basis points (1%)";
    }
    const gas = Number(gasReserve);
    if (gas < 0.01) {
      return "Reserva de gas mínima é 0.01 SOL";
    }
    if (heirs.length === 0) {
      return "Adicione pelo menos um herdeiro";
    }
    if (heirs.length > 10) {
      return "Máximo de 10 herdeiros";
    }
    
    // Verificar duplicatas de wallet
    const wallets = heirs.map(h => h.wallet);
    if (new Set(wallets).size !== wallets.length) {
      return "Herdeiros não podem ter endereços duplicados";
    }
    
    // Verificar carteiras vazias
    if (heirs.some(h => !h.wallet.trim())) {
      return "Todos os herdeiros devem ter um endereço de carteira";
    }
    
    // Validar soma de percentuais por asset = 10000 bps (100%)
    const percentageByAsset: Record<string, number> = {};
    for (const heir of heirs) {
      if (heir.allocationType === "percentage") {
        const val = Number(heir.allocationValue);
        if (isNaN(val) || val <= 0) {
          return `Herdeiro ${heirs.indexOf(heir) + 1} tem alocação percentual inválida`;
        }
        percentageByAsset[heir.asset] = (percentageByAsset[heir.asset] || 0) + val;
      }
    }
    for (const [asset, sum] of Object.entries(percentageByAsset)) {
      if (sum !== 10000) {
        return `Asset ${asset.slice(0, 8)}...: soma dos percentuais deve ser exatamente 10000 bps (100%). Atual: ${sum}`;
      }
    }
    
    return null;
  };

  const handleSubmit = async () => {
    setError("");
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);

    try {
      const parsedHeirs = heirs.map((h) => ({
        wallet: h.wallet,
        asset: h.asset,
        allocationType:
          h.allocationType === "percentage"
            ? ({ percentage: {} } as any)
            : ({ fixedAmount: {} } as any),
        allocationValue: Number(h.allocationValue),
      }));

      const { tx, vaultPDA } = await initializeVault(
        Number(seed),
        Number(inactivityMinutes),
        parsedHeirs,
        Number(keeperFeeBps),
        Number(gasReserve)
      );

      router.push(`/vaults/${vaultPDA.toBase58()}`);
    } catch (err: any) {
      setError(err.message || "Erro ao criar vault");
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black py-12 px-4">
        <div className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center max-w-md">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
            Criar Vault
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Conecte sua carteira para criar um novo cofre de herança
          </p>
          <WalletMultiButton className="!bg-zinc-900 !text-white hover:!bg-zinc-700 dark:!bg-zinc-100 dark:!text-black dark:hover:!bg-zinc-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-black py-12 px-4">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Criar Vault
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Configure seu cofre de herança passo a passo
            </p>
          </div>
          <Link
            href="/vaults"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            ← Voltar
          </Link>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full ${
                s <= step
                  ? "bg-zinc-900 dark:bg-zinc-100"
                  : "bg-zinc-200 dark:bg-zinc-800"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Configuração Básica */}
        {step === 1 && (
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Configuração Básica
            </h2>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Seed (identificador único)
              </label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Permite criar múltiplos vaults com a mesma carteira
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Período de Inatividade (minutos)
              </label>
              <input
                type="number"
                min="1"
                max="525600"
                value={inactivityMinutes}
                onChange={(e) => setInactivityMinutes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Mínimo: 1 minuto | Máximo: 525.600 minutos (1 ano)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Taxa do Keeper (basis points)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={keeperFeeBps}
                onChange={(e) => setKeeperFeeBps(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              <p className="text-xs text-zinc-500 mt-1">
                100 = 1% (máximo). Recompensa para quem executar o claim.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Reserva de Gas (SOL)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={gasReserve}
                onChange={(e) => setGasReserve(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Mínimo: 0.01 SOL. Reembolso para o keeper no heartbeat.
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-2 px-4 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black font-medium hover:opacity-90 transition-opacity"
            >
              Continuar →
            </button>
          </div>
        )}

        {/* Step 2: Herdeiros */}
        {step === 2 && (
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Herdeiros ({heirs.length}/10)
            </h2>

            {heirs.map((heir, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Herdeiro #{index + 1}
                  </span>
                  {heirs.length > 1 && (
                    <button
                      onClick={() => removeHeir(index)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Carteira do Herdeiro
                  </label>
                  <input
                    type="text"
                    placeholder="Endereço Solana..."
                    value={heir.wallet}
                    onChange={(e) => updateHeir(index, "wallet", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Tipo
                    </label>
                    <select
                      value={heir.allocationType}
                      onChange={(e) => updateHeir(index, "allocationType", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    >
                      <option value="percentage">Percentual (%)</option>
                      <option value="fixed">Valor Fixo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Valor
                    </label>
                    <input
                      type="number"
                      placeholder={heir.allocationType === "percentage" ? "10000 = 100%" : "Quantidade"}
                      value={heir.allocationValue}
                      onChange={(e) => updateHeir(index, "allocationValue", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            {heirs.length < 10 && (
              <button
                onClick={addHeir}
                className="w-full py-2 px-4 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm"
              >
                + Adicionar Herdeiro
              </button>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2 px-4 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                ← Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-2 px-4 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black font-medium hover:opacity-90 transition-opacity"
              >
                Revisar →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Revisão */}
        {step === 3 && (
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Revisar
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Seed</span>
                <span className="font-mono text-black dark:text-white">{seed}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Inatividade</span>
                <span className="text-black dark:text-white">{inactivityMinutes} minutos</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Taxa Keeper</span>
                <span className="text-black dark:text-white">{Number(keeperFeeBps) / 100}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Gas Reserve</span>
                <span className="text-black dark:text-white">{gasReserve} SOL</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Herdeiros ({heirs.length})
              </h3>
              <div className="space-y-2">
                {heirs.map((h, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-sm"
                  >
                    <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400 truncate">
                      {h.wallet || "(sem endereço)"}
                    </p>
                    <p className="text-zinc-500 mt-1">
                      {h.allocationType === "percentage" ? "Percentual" : "Fixo"}:{" "}
                      <span className="text-black dark:text-white font-medium">
                        {h.allocationValue}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                disabled={loading}
                className="flex-1 py-2 px-4 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                ← Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2 px-4 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Criando..." : "Criar Vault"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
