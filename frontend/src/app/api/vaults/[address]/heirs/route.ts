import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServiceClient() {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase configuration. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── GET — List heirs for a vault (from Supabase) ───────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address: vaultAddress } = await params;

    if (!vaultAddress) {
      return NextResponse.json(
        { error: "Vault address is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Find vault by address
    const { data: vault, error: vaultError } = await supabase
      .from("vaults")
      .select("id")
      .eq("vault_address", vaultAddress)
      .single();

    if (vaultError || !vault) {
      return NextResponse.json(
        { error: "Vault not found" },
        { status: 404 }
      );
    }

    // Get heirs
    const { data: heirs, error: heirsError } = await supabase
      .from("heirs")
      .select("*")
      .eq("vault_id", vault.id)
      .order("created_at", { ascending: true });

    if (heirsError) {
      console.error("[api/vaults/heirs] Error:", heirsError);
      return NextResponse.json(
        { error: "Failed to fetch heirs" },
        { status: 500 }
      );
    }

    // Get notification preferences for these heirs
    const { data: notifications } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("vault_id", vault.id)
      .eq("recipient_type", "heir");

    // Merge notifications into heirs by heir_wallet_address
    const heirsWithContacts = (heirs || []).map((heir: any) => {
      const heirNotifications = (notifications || []).filter(
        (n: any) => n.heir_wallet_address === heir.wallet_address
      );
      return {
        ...heir,
        email:
          heirNotifications.find((n: any) => n.channel === "email")?.address ||
          null,
        phone:
          heirNotifications.find((n: any) => n.channel === "sms")?.address ||
          null,
      };
    });

    return NextResponse.json(
      { success: true, heirs: heirsWithContacts },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[api/vaults/heirs] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
