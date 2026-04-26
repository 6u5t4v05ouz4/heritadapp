"use client";

import Link from "next/link";
import { Shield, Users, Copy } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import CopyButton from "@/components/ui/CopyButton";
import VaultTimer from "./VaultTimer";

interface VaultCardProps {
  vault: {
    publicKey: { toBase58: () => string };
    account: {
      owner: { toBase58: () => string };
      seed: any;
      lastHeartbeat: any;
      inactivityPeriod: any;
      status: {
        active?: boolean;
        claimed?: boolean;
        cancelled?: boolean;
      };
      assets: any[];
      heirs: any[];
    };
  };
}

export default function VaultCard({ vault }: VaultCardProps) {
  const address = vault.publicKey.toBase58();
  const lastHeartbeat = Number(vault.account.lastHeartbeat?.toString?.() || vault.account.lastHeartbeat || 0);
  const inactivityPeriod = Number(vault.account.inactivityPeriod?.toString?.() || vault.account.inactivityPeriod || 0);
  const heirCount = vault.account.heirs?.length || 0;
  const assetCount = vault.account.assets?.length || 0;

  const status = vault.account.status?.active
    ? "active"
    : vault.account.status?.claimed
    ? "claimed"
    : vault.account.status?.cancelled
    ? "expired"
    : "waiting";

  const statusLabels: Record<string, string> = {
    active: "Active",
    claimed: "Claimed",
    expired: "Canceled",
    waiting: "Waiting",
  };

  return (
    <Link href={`/vaults/${address}`}>
      <Card hoverable className="h-full flex flex-col gap-4 cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-accent-primary" />
            </div>
            <div className="min-w-0">
              <CopyButton
                text={address}
                displayText={`${address.slice(0, 6)}...${address.slice(-6)}`}
                className="text-sm font-mono text-text-primary"
              />
              <p className="text-xs text-text-tertiary mt-0.5">
                Seed #{vault.account.seed?.toString?.() || vault.account.seed}
              </p>
            </div>
          </div>
          <Badge variant={status as any}>{statusLabels[status]}</Badge>
        </div>

        <VaultTimer lastHeartbeat={lastHeartbeat} inactivityPeriod={inactivityPeriod} />

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-subtle">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm text-text-secondary">
              {heirCount} heir{heirCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm text-text-secondary">
              {assetCount} asset{assetCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
