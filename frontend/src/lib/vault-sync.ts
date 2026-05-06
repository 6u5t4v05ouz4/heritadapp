interface HeirContact {
  name: string;
  email: string;
  phone: string;
  wallet: string;
  asset: string;
  allocationType: "percentage" | "fixed";
  allocationValue: string;
}

interface VaultSyncData {
  vaultAddress: string;
  ownerAddress: string;
  seed: number;
  inactivityPeriod: number; // in seconds
  keeperFeeBps: number;
  gasReserveLamports: number;
  solBalance: number;
  heirs: HeirContact[];
  ownerEmail?: string;
  ownerPhone?: string;
}

export async function syncVaultToSupabase(data: VaultSyncData): Promise<void> {
  try {
    const res = await fetch("/api/sync-vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Sync failed with status ${res.status}`);
    }
  } catch (err: any) {
    console.error("[syncVaultToSupabase] Error:", err.message);
    // Best-effort: don't block the user flow
    throw err;
  }
}
