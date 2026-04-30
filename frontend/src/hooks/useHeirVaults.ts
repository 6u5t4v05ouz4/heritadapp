"use client";

import { useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "./useProgram";

export type VaultStatus = "active" | "cancelled" | "claimed";

export interface HeirVault {
  publicKey: PublicKey;
  owner: PublicKey;
  seed: number;
  lastHeartbeat: number;
  inactivityPeriod: number;
  status: VaultStatus;
  assets: PublicKey[];
  heirs: {
    wallet: PublicKey;
    asset: PublicKey;
    allocationType: { percentage?: {} } | { fixedAmount?: {} };
    allocationValue: number;
  }[];
  balance: number;
  keeperFeeBps: number;
  gasReserveLamports: number;
}

export function useHeirVaults() {
  const { program, publicKey } = useProgram();
  const { connection } = useConnection();

  const fetchHeirVaults = useCallback(async (): Promise<HeirVault[]> => {
    if (!program || !publicKey) return [];

    try {
      const allVaults = await (program as any).account.vault.all();
      const result: HeirVault[] = [];

      for (const v of allVaults) {
        const acc = v.account;
        const heirs = acc.heirs || [];

        // Check if current user is an heir
        const isHeir = heirs.some((h: any) => {
          const heirAddr = h.wallet?.toBase58?.() || h.wallet;
          return heirAddr === publicKey.toBase58();
        });

        if (!isHeir) continue;

        // Get vault balance
        let balance = 0;
        try {
          balance = await connection.getBalance(v.publicKey);
        } catch {
          // ignore
        }

        // Extract status string from Anchor enum object
        const rawStatus = acc.status;
        let status: VaultStatus = "active";
        if (rawStatus && typeof rawStatus === "object") {
          if ("cancelled" in rawStatus) status = "cancelled";
          else if ("claimed" in rawStatus) status = "claimed";
          else if ("active" in rawStatus) status = "active";
        }

        result.push({
          publicKey: v.publicKey,
          owner: acc.owner,
          seed: Number(acc.seed?.toString?.() || acc.seed || 0),
          lastHeartbeat: Number(acc.lastHeartbeat?.toString?.() || acc.lastHeartbeat || 0),
          inactivityPeriod: Number(acc.inactivityPeriod?.toString?.() || acc.inactivityPeriod || 0),
          status,
          assets: acc.assets || [],
          heirs: heirs.map((h: any) => ({
            wallet: new PublicKey(h.wallet?.toBase58?.() || h.wallet),
            asset: new PublicKey(h.asset?.toBase58?.() || h.asset),
            allocationType: h.allocationType,
            allocationValue: Number(h.allocationValue?.toString?.() || h.allocationValue || 0),
          })),
          balance,
          keeperFeeBps: Number(acc.keeperFeeBps?.toString?.() || acc.keeperFeeBps || 0),
          gasReserveLamports: Number(acc.gasReserveLamports?.toString?.() || acc.gasReserveLamports || 0),
        });
      }

      return result;
    } catch {
      return [];
    }
  }, [program, publicKey, connection]);

  const getMyAllocation = useCallback(
    (vault: HeirVault): { type: "percentage" | "fixed"; value: number } | null => {
      const myHeir = vault.heirs.find((h) => h.wallet.equals(publicKey!));
      if (!myHeir) return null;
      const isPercentage = myHeir.allocationType && "percentage" in myHeir.allocationType;
      return {
        type: isPercentage ? "percentage" : "fixed",
        value: myHeir.allocationValue,
      };
    },
    [publicKey]
  );

  const isClaimable = useCallback((vault: HeirVault): boolean => {
    if (vault.status !== "active") return false;
    const now = Math.floor(Date.now() / 1000);
    if (vault.lastHeartbeat === 0) return false; // No deposit yet
    return now > vault.lastHeartbeat + vault.inactivityPeriod;
  }, []);

  const getTimeRemaining = useCallback((vault: HeirVault): number => {
    const now = Math.floor(Date.now() / 1000);
    const expiry = vault.lastHeartbeat + vault.inactivityPeriod;
    return Math.max(0, expiry - now);
  }, []);

  return {
    fetchHeirVaults,
    getMyAllocation,
    isClaimable,
    getTimeRemaining,
  };
}
