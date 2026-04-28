import { getSupabaseClient } from "@/lib/supabase";

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
}

export async function syncVaultToSupabase(data: VaultSyncData): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("[syncVaultToSupabase] Supabase not configured, skipping sync");
    return;
  }

  const supabase = getSupabaseClient();

  // 1. Insert vault
  const { data: vaultRow, error: vaultError } = await supabase
    .from("vaults")
    .insert({
      vault_address: data.vaultAddress,
      owner_address: data.ownerAddress,
      seed: data.seed,
      inactivity_period: data.inactivityPeriod,
      last_heartbeat: new Date().toISOString(),
      keeper_fee_bps: data.keeperFeeBps,
      gas_reserve_lamports: data.gasReserveLamports,
      status: "active",
      sol_balance: data.solBalance,
    })
    .select("id")
    .single();

  if (vaultError || !vaultRow) {
    console.error("[syncVaultToSupabase] Vault insert error:", vaultError);
    throw new Error("Failed to sync vault to Supabase");
  }

  const vaultId = vaultRow.id;

  // 2. Insert heirs
  const heirRows = data.heirs.map((h) => ({
    vault_id: vaultId,
    name: h.name || null,
    wallet_address: h.wallet,
    asset_mint: h.asset,
    allocation_type: h.allocationType === "percentage" ? "percentage" : "fixed_amount",
    allocation_value: Number(h.allocationValue),
  }));

  const { error: heirsError } = await supabase.from("heirs").insert(heirRows);
  if (heirsError) {
    console.error("[syncVaultToSupabase] Heirs insert error:", heirsError);
    // Non-fatal: vault is already created
  }

  // 3. Insert notification preferences (email + sms per heir)
  const notifications = [];
  for (const h of data.heirs) {
    if (h.email) {
      notifications.push({
        vault_id: vaultId,
        recipient_type: "heir",
        channel: "email",
        address: h.email,
      });
    }
    if (h.phone) {
      notifications.push({
        vault_id: vaultId,
        recipient_type: "heir",
        channel: "sms",
        address: h.phone,
      });
    }
  }

  if (notifications.length > 0) {
    const { error: notifError } = await supabase
      .from("notification_preferences")
      .insert(notifications);
    if (notifError) {
      console.error("[syncVaultToSupabase] Notification insert error:", notifError);
    }
  }
}
