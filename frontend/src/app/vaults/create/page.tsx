"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useVault } from "@/hooks/useVault";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { syncVaultToSupabase } from "@/lib/vault-sync";
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
  Mail,
  Phone,
} from "lucide-react";
import ClientOnly from "@/components/ClientOnly";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import StepIndicator from "@/components/ui/StepIndicator";
import Badge from "@/components/ui/Badge";
import { useEnhancedToast } from "@/hooks/useEnhancedToast";

interface HeirInput {
  name: string;
  email: string;
  phone: string;
  wallet: string;
  asset: string;
  allocationType: "percentage" | "fixed";
  allocationValue: string;
}

export default function CreateVaultPage() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { initializeVault } = useVault();
  const { success, error: showError, warning, ToastContainer } = useEnhancedToast();

  const [step, setStep] = useState(1);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString());
  const [inactivityMinutes, setInactivityMinutes] = useState("60");
  const [keeperFeeBps, setKeeperFeeBps] = useState("100");
  const [gasReserve, setGasReserve] = useState("0.01");
  const [heirs, setHeirs] = useState<HeirInput[]>([
    { name: "", email: "", phone: "", wallet: "", asset: "11111111111111111111111111111111", allocationType: "percentage", allocationValue: "100" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const addHeir = () => {
    if (heirs.length >= 10) return;
    setHeirs([...heirs, { name: "", email: "", phone: "", wallet: "", asset: "11111111111111111111111111111111", allocationType: "percentage", allocationValue: "" }]);
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

  const divideEqually = () => {
    const split = Math.floor(100 / heirs.length);
    let remainder = 100 % heirs.length;
    
    const updated = heirs.map((h) => {
      let val = split;
      if (remainder > 0) {
        val += 1;
        remainder -= 1;
      }
      return { ...h, allocationValue: val.toString() };
    });
    setHeirs(updated);
  };

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
    if (publicKey && wallets.includes(publicKey.toBase58())) {
      return "You cannot use your own wallet as an heir";
    }
    const emails = heirs.map((h) => h.email.trim().toLowerCase());
    if (new Set(emails).size !== emails.length) {
      return "Heirs cannot have duplicate emails";
    }
    const phones = heirs.map((h) => h.phone.trim());
    if (new Set(phones).size !== phones.length) {
      return "Heirs cannot have duplicate phone numbers";
    }
    for (let i = 0; i < heirs.length; i++) {
      const h = heirs[i];
      if (!h.name.trim() || !h.email.trim() || !h.phone.trim() || !h.wallet.trim() || !h.allocationValue) {
        return `Please fill all fields (Name, Email, Phone, Wallet, Value) for Heir #${i + 1}`;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(h.email)) {
        return `Heir #${i + 1} has an invalid email address`;
      }
      try {
        new PublicKey(h.wallet.trim());
      } catch (e) {
        return `Heir #${i + 1} has an invalid Solana wallet address`;
      }
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
      if (sum !== 100) {
        return `Asset ${asset.slice(0, 8)}...: percentage sum must be exactly 100%. Current: ${sum}%`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    setError("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      showError("Validation error", validationError);
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
        allocationType: { percentage: {} } as any,
        allocationValue: Number(h.allocationValue) * 100,
      }));

      const { tx, vaultPDA } = await initializeVault(
        Number(seed),
        Number(inactivityMinutes),
        parsedHeirs,
        Number(keeperFeeBps),
        Number(gasReserve)
      );

      // Sync to Supabase (best-effort, non-blocking)
      if (publicKey) {
        try {
          await syncVaultToSupabase({
            vaultAddress: vaultPDA.toBase58(),
            ownerAddress: publicKey.toBase58(),
            seed: Number(seed),
            inactivityPeriod: Number(inactivityMinutes) * 60,
            keeperFeeBps: Number(keeperFeeBps),
            gasReserveLamports: Math.floor(Number(gasReserve) * LAMPORTS_PER_SOL),
            solBalance: 0,
            heirs: heirs,
          });
        } catch (syncErr: any) {
          console.warn("[CreateVault] Supabase sync failed:", syncErr.message);
        }
      }

      if (tx) {
        success("Vault created successfully!", undefined, tx);
      } else {
        warning(
          "Vault created! (delayed confirmation)",
          "The network was slow, but your vault was created successfully. Redirecting..."
        );
      }
      router.push(`/vaults/${vaultPDA.toBase58()}`);
    } catch (err: any) {
      const msg = err.message || "Error creating vault";
      setError(msg);
      showError("Failed to create vault", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep2 = () => {
    if (heirs.length === 0) {
      showError("Validation error", "Add at least one heir");
      return;
    }
    
    const wallets = heirs.map((h) => h.wallet);
    if (new Set(wallets).size !== wallets.length) {
      showError("Validation error", "Heirs cannot have duplicate addresses");
      return;
    }
    if (publicKey && wallets.includes(publicKey.toBase58())) {
      showError("Validation error", "You cannot use your own wallet as an heir");
      return;
    }

    const emails = heirs.map((h) => h.email.trim().toLowerCase());
    if (new Set(emails).size !== emails.length) {
      showError("Validation error", "Heirs cannot have duplicate emails");
      return;
    }
    const phones = heirs.map((h) => h.phone.trim());
    if (new Set(phones).size !== phones.length) {
      showError("Validation error", "Heirs cannot have duplicate phone numbers");
      return;
    }

    for (let i = 0; i < heirs.length; i++) {
      const h = heirs[i];
      if (!h.name.trim() || !h.email.trim() || !h.phone.trim() || !h.wallet.trim() || !h.allocationValue) {
        showError("Validation error", `Please fill all fields (Name, Email, Phone, Wallet, Value) for Heir #${i + 1}`);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(h.email)) {
        showError("Validation error", `Heir #${i + 1} has an invalid email address`);
        return;
      }
      try {
        new PublicKey(h.wallet.trim());
      } catch (e) {
        showError("Validation error", `Heir #${i + 1} has an invalid Solana wallet address`);
        return;
      }
      if (Number(h.allocationValue) <= 0) {
        showError("Validation error", `Heir #${i + 1} must have a percentage > 0`);
        return;
      }
    }

    if (percentageSum !== 100) {
      showError("Validation error", `Total percentage must be exactly 100%. Current: ${percentageSum}%`);
      return;
    }

    setStep(3);
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
              disabled
            />
            <div>
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
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setInactivityMinutes("129600")}
                  className="px-2 py-1 text-xs rounded-md bg-bg-base border border-border-subtle hover:border-accent-primary hover:text-accent-primary transition-colors text-text-secondary"
                >
                  3 Months
                </button>
                <button
                  type="button"
                  onClick={() => setInactivityMinutes("259200")}
                  className="px-2 py-1 text-xs rounded-md bg-bg-base border border-border-subtle hover:border-accent-primary hover:text-accent-primary transition-colors text-text-secondary"
                >
                  6 Months
                </button>
                <button
                  type="button"
                  onClick={() => setInactivityMinutes("525600")}
                  className="px-2 py-1 text-xs rounded-md bg-bg-base border border-border-subtle hover:border-accent-primary hover:text-accent-primary transition-colors text-text-secondary"
                >
                  12 Months
                </button>
              </div>
            </div>
            <Input
              label="Keeper Fee (basis points)"
              type="number"
              min="0"
              max="100"
              value={keeperFeeBps}
              onChange={(e) => setKeeperFeeBps(e.target.value)}
              helper="100 = 1%. Reward for whoever executes the claim"
              icon={<Percent className="w-4 h-4" />}
              disabled
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
              disabled
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
            <Badge variant={percentageSum === 100 ? "active" : "waiting"}>
              Total: {percentageSum}%
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    value={heir.name}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^A-Za-zÀ-ÿ\s]/g, "");
                      updateHeir(index, "name", val);
                    }}
                    icon={<User className="w-4 h-4" />}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="john@example.com"
                    value={heir.email}
                    onChange={(e) => updateHeir(index, "email", e.target.value)}
                    icon={<Mail className="w-4 h-4" />}
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="+1 555 123 4567"
                    value={heir.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d+\-()\s]/g, "");
                      updateHeir(index, "phone", val);
                    }}
                    icon={<Phone className="w-4 h-4" />}
                  />
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
                    <Input
                      value="Percentage (%)"
                      disabled
                      icon={<Percent className="w-4 h-4" />}
                    />
                  </div>
                  <div>
                    <Input
                      label="Value (%)"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="100"
                      value={heir.allocationValue}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) {
                          updateHeir(index, "allocationValue", "");
                          return;
                        }
                        if (val < 0) val = 0;
                        const currentOthers = percentageSum - (Number(heir.allocationValue) || 0);
                        if (val + currentOthers > 100) {
                          val = 100 - currentOthers;
                        }
                        updateHeir(index, "allocationValue", val.toString());
                      }}
                    />
                    <div className="flex items-center gap-1 mt-2">
                      <button
                        type="button"
                        onClick={() => updateHeir(index, "allocationValue", "25")}
                        className="px-2 py-1 text-[10px] rounded bg-bg-base border border-border-subtle hover:border-accent-primary hover:text-accent-primary transition-colors text-text-secondary"
                      >
                        25%
                      </button>
                      <button
                        type="button"
                        onClick={() => updateHeir(index, "allocationValue", "50")}
                        className="px-2 py-1 text-[10px] rounded bg-bg-base border border-border-subtle hover:border-accent-primary hover:text-accent-primary transition-colors text-text-secondary"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => updateHeir(index, "allocationValue", "75")}
                        className="px-2 py-1 text-[10px] rounded bg-bg-base border border-border-subtle hover:border-accent-primary hover:text-accent-primary transition-colors text-text-secondary"
                      >
                        75%
                      </button>
                      <button
                        type="button"
                        onClick={() => updateHeir(index, "allocationValue", "100")}
                        className="px-2 py-1 text-[10px] rounded bg-bg-base border border-border-subtle hover:border-accent-primary hover:text-accent-primary transition-colors text-text-secondary"
                      >
                        100%
                      </button>
                    </div>
                  </div>
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

          {heirs.length > 1 && (
            <button
              onClick={divideEqually}
              className="mt-2 w-full py-2 px-4 rounded-xl border border-border-subtle bg-bg-base text-text-secondary hover:text-text-primary hover:border-accent-primary hover:bg-accent-primary/5 transition-all text-sm font-medium inline-flex items-center justify-center gap-2"
            >
              <Percent className="w-4 h-4" />
              Divide Percentages Equally
            </button>
          )}

          {percentageSum !== 100 && heirs.some((h) => h.allocationType === "percentage") && (
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-400">
              <AlertCircle className="w-4 h-4" />
              Total percentage: {percentageSum}% — {100 - percentageSum}% left to reach 100%
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button className="flex-1" onClick={handleNextStep2}>
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
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-text-primary">
                      {h.name || `Heir #${i + 1}`}
                    </span>
                    <span className="text-xs text-text-tertiary font-mono">
                      Percentage: {h.allocationValue}%
                    </span>
                  </div>
                  {(h.email || h.phone) && (
                    <div className="flex items-center gap-3 text-xs text-text-tertiary mb-1">
                      {h.email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{h.email}</span>}
                      {h.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{h.phone}</span>}
                    </div>
                  )}
                  <p className="font-mono text-xs text-text-tertiary truncate">
                    {h.wallet || "(no address)"}
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
