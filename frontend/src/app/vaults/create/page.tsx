"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useVault } from "@/hooks/useVault";
import { PublicKey } from "@solana/web3.js";
import Link from "next/link";
import {
  Clock,
  Percent,
  Fuel,
  Hash,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  User,
  Wallet,
} from "lucide-react";
import ClientOnly from "@/components/ClientOnly";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import StepIndicator from "@/components/ui/StepIndicator";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/hooks/useToast";

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
  const { success, error: showError, ToastContainer } = useToast();

  const [step, setStep] = useState(1);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString());
  const [inactivityMinutes, setInactivityMinutes] = useState("60");
  const [keeperFeeBps, setKeeperFeeBps] = useState("100");
  const [gasReserve, setGasReserve] = useState("0.01");
  const [heirs, setHeirs] = useState<HeirInput[]>([
    { wallet: "", asset: "11111111111111111111111111111111", allocationType: "percentage", allocationValue: "10000" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

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

  const percentageSum = heirs
    .filter((h) => h.allocationType === "percentage")
    .reduce((sum, h) => sum + (Number(h.allocationValue) || 0), 0);

  const validateForm = (): string | null => {
    const minutes = Number(inactivityMinutes);
    if (minutes < 1 || minutes > 525600) {
      return "Inactivity period must be between 1 minute and 525,600 minutes (1 year)";
    }
    const fee = Number(keeperFeeBps);
    if (fee < 0 || fee > 100) {
      return "Keeper fee must be between 0 and 100 basis points (1%)";
    }
    const gas = Number(gasReserve);
    if (gas < 0.01) {
      return "Minimum gas reserve is 0.01 SOL";
    }
    if (heirs.length === 0) {
      return "Add at least one heir";
    }
    if (heirs.length > 10) {
      return "Maximum of 10 heirs";
    }
    const wallets = heirs.map((h) => h.wallet);
    if (new Set(wallets).size !== wallets.length) {
      return "Heirs cannot have duplicate addresses";
    }
    if (heirs.some((h) => !h.wallet.trim())) {
      return "All heirs must have a wallet address";
    }
    const percentageByAsset: Record<string, number> = {};
    for (const heir of heirs) {
      if (heir.allocationType === "percentage") {
        const val = Number(heir.allocationValue);
        if (isNaN(val) || val <= 0) {
          return `Heir ${heirs.indexOf(heir) + 1} has invalid percentage allocation`;
        }
        percentageByAsset[heir.asset] = (percentageByAsset[heir.asset] || 0) + val;
      }
    }
    for (const [asset, sum] of Object.entries(percentageByAsset)) {
      if (sum !== 10000) {
        return `Asset ${asset.slice(0, 8)}...: percentage sum must be exactly 10000 bps (100%). Current: ${sum}`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    setError("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      showError(validationError);
      return;
    }
    if (!confirmed) {
      setError("You need to confirm you understand the risks");
      return;
    }
    setLoading(true);

    try {
      const parsedHeirs = heirs.map((h) => ({
        wallet: h.wallet,
        asset: h.asset,
        allocationType: h.allocationType === "percentage" ? ({ percentage: {} } as any) : ({ fixedAmount: {} } as any),
        allocationValue: Number(h.allocationValue),
      }));

      const { tx, vaultPDA } = await initializeVault(
        Number(seed),
        Number(inactivityMinutes),
        parsedHeirs,
        Number(keeperFeeBps),
        Number(gasReserve)
      );

      success("Vault created successfully!");
      router.push(`/vaults/${vaultPDA.toBase58()}`);
    } catch (err: any) {
      const msg = err.message || "Error creating vault";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <PageHeader title="Create Vault" description="Configure your inheritance vault" />
        <Card className="mt-8">
          <div className="flex flex-col items-center justify-center text-center p-8 md:p-12">
            <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-border-subtle flex items-center justify-center mb-5">
              <Wallet className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Connect your wallet</h3>
            <p className="text-sm text-text-secondary max-w-sm mb-6">
              Connect your wallet to create a new digital inheritance vault.
            </p>
            <ClientOnly fallback={<Button disabled>Connect Wallet</Button>}>
              <WalletMultiButton />
            </ClientOnly>
          </div>
        </Card>
      </div>
    );
  }

  const steps = [
    { number: 1, label: "Configuration" },
    { number: 2, label: "Heirs" },
    { number: 3, label: "Review" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <ToastContainer />
      <PageHeader title="Create Vault" description="Configure your inheritance vault step by step" backHref="/vaults" />

      <div className="mt-8">
        <StepIndicator steps={steps} currentStep={step} />
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <Card className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
              <Hash className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Basic Configuration</h2>
              <p className="text-xs text-text-tertiary">Your vault parameters</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Seed (unique identifier)"
              type="number"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              helper="Allows creating multiple vaults with the same wallet"
              icon={<Hash className="w-4 h-4" />}
            />
            <Input
              label="Inactivity Period (minutes)"
              type="number"
              min="1"
              max="525600"
              value={inactivityMinutes}
              onChange={(e) => setInactivityMinutes(e.target.value)}
              helper="Min: 1 min | Max: 525,600 min (1 year)"
              icon={<Clock className="w-4 h-4" />}
            />
            <Input
              label="Keeper Fee (basis points)"
              type="number"
              min="0"
              max="100"
              value={keeperFeeBps}
              onChange={(e) => setKeeperFeeBps(e.target.value)}
              helper="100 = 1%. Reward for whoever executes the claim"
              icon={<Percent className="w-4 h-4" />}
            />
            <Input
              label="Gas Reserve (SOL)"
              type="number"
              min="0.01"
              step="0.01"
              value={gasReserve}
              onChange={(e) => setGasReserve(e.target.value)}
              helper="Min: 0.01 SOL. Reimbursement for the keeper"
              icon={<Fuel className="w-4 h-4" />}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => setStep(2)}>Continue</Button>
          </div>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Card className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-warm/10 border border-accent-warm/20 flex items-center justify-center">
                <User className="w-5 h-5 text-accent-warm" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Heirs</h2>
                <p className="text-xs text-text-tertiary">{heirs.length}/10 heirs</p>
              </div>
            </div>
            <Badge variant={percentageSum === 10000 ? "active" : "waiting"}>
              Total: {percentageSum} bps
            </Badge>
          </div>

          <div className="space-y-4">
            {heirs.map((heir, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-border-subtle bg-bg-elevated space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-secondary">Heir #{index + 1}</span>
                  {heirs.length > 1 && (
                    <button
                      onClick={() => removeHeir(index)}
                      className="text-xs text-rose-400 hover:text-rose-300 transition-colors inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>

                <Input
                  label="Heir Wallet"
                  placeholder="Solana address..."
                  value={heir.wallet}
                  onChange={(e) => updateHeir(index, "wallet", e.target.value)}
                  icon={<Wallet className="w-4 h-4" />}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Type</label>
                    <select
                      value={heir.allocationType}
                      onChange={(e) => updateHeir(index, "allocationType", e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-border-subtle bg-bg-base text-text-primary text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <Input
                    label="Value"
                    type="number"
                    placeholder={heir.allocationType === "percentage" ? "10000 = 100%" : "Amount"}
                    value={heir.allocationValue}
                    onChange={(e) => updateHeir(index, "allocationValue", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          {heirs.length < 10 && (
            <button
              onClick={addHeir}
              className="mt-4 w-full py-3 px-4 rounded-xl border border-dashed border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-focus hover:bg-bg-elevated transition-all text-sm font-medium inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Heir
            </button>
          )}

          {percentageSum !== 10000 && heirs.some((h) => h.allocationType === "percentage") && (
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-400">
              <AlertCircle className="w-4 h-4" />
              Total percentage: {percentageSum} bps — {10000 - percentageSum} bps left to reach 100%
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => setStep(3)}>
              Review
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <Card className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Review</h2>
              <p className="text-xs text-text-tertiary">Confirm the data before creating</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2.5 border-b border-border-subtle">
              <span className="text-text-secondary">Seed</span>
              <span className="font-mono text-text-primary">{seed}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-border-subtle">
              <span className="text-text-secondary">Inactivity</span>
              <span className="text-text-primary">{inactivityMinutes} minutes</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-border-subtle">
              <span className="text-text-secondary">Keeper Fee</span>
              <span className="text-text-primary">{Number(keeperFeeBps) / 100}%</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-border-subtle">
              <span className="text-text-secondary">Gas Reserve</span>
              <span className="text-text-primary">{gasReserve} SOL</span>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-text-secondary mb-3">
              Heirs ({heirs.length})
            </h3>
            <div className="space-y-2">
              {heirs.map((h, i) => (
                <div key={i} className="p-3 rounded-xl bg-bg-elevated border border-border-subtle text-sm">
                  <p className="font-mono text-xs text-text-tertiary truncate">
                    {h.wallet || "(no address)"}
                  </p>
                  <p className="text-text-secondary mt-1">
                    {h.allocationType === "percentage" ? "Percentage" : "Fixed"}:{" "}
                    <span className="text-text-primary font-medium">{h.allocationValue}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <label className="mt-6 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border-subtle bg-bg-elevated text-accent-primary focus:ring-accent-primary/30"
            />
            <span className="text-sm text-text-secondary">
              I understand that deposited funds can only be claimed by heirs after the inactivity period, 
              and that canceling the vault returns funds to me.
            </span>
          </label>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(2)} disabled={loading}>
              Back
            </Button>
            <Button className="flex-1" onClick={handleSubmit} isLoading={loading} disabled={!confirmed}>
              {loading ? "Creating..." : "Create Vault"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
