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

// ── Verify ownership via Supabase ──────────────────────────────
async function verifyOwner(supabase: any, heirId: string, ownerAddress: string) {
  const { data: heir, error: heirError } = await supabase
    .from("heirs")
    .select("vault_id")
    .eq("id", heirId)
    .single();

  if (heirError || !heir) {
    return { ok: false, status: 404, error: "Heir not found" };
  }

  const { data: vault, error: vaultError } = await supabase
    .from("vaults")
    .select("owner_address")
    .eq("id", heir.vault_id)
    .single();

  if (vaultError || !vault) {
    return { ok: false, status: 404, error: "Vault not found" };
  }

  if (vault.owner_address !== ownerAddress) {
    return { ok: false, status: 403, error: "Unauthorized — not vault owner" };
  }

  return { ok: true, vaultId: heir.vault_id };
}

// ── PUT — Update heir ──────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: heirId } = await params;
    const body = await request.json();
    const { ownerAddress, name, walletAddress, assetMint, allocationType, allocationValue } = body;

    if (!ownerAddress) {
      return NextResponse.json(
        { error: "ownerAddress is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();
    const auth = await verifyOwner(supabase, heirId, ownerAddress);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name || null;
    if (walletAddress !== undefined) updates.wallet_address = walletAddress;
    if (assetMint !== undefined) updates.asset_mint = assetMint;
    if (allocationType !== undefined) {
      updates.allocation_type = allocationType === "percentage" ? "percentage" : "fixed_amount";
    }
    if (allocationValue !== undefined) {
      updates.allocation_value = Number(allocationValue);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("heirs")
      .update(updates)
      .eq("id", heirId)
      .select()
      .single();

    if (error) {
      console.error("[api/heirs] Update error:", error);
      return NextResponse.json(
        { error: "Failed to update heir" },
        { status: 500 }
      );
    }

    // Update notification preferences (email + phone)
    const { email, phone } = body;
    if (email !== undefined || phone !== undefined) {
      // Get current heir data for vault_id
      const { data: heirData } = await supabase
        .from("heirs")
        .select("vault_id, wallet_address")
        .eq("id", heirId)
        .single();

      if (heirData) {
        // Delete old notifications for THIS SPECIFIC HEIR only
        await supabase
          .from("notification_preferences")
          .delete()
          .eq("vault_id", heirData.vault_id)
          .eq("recipient_type", "heir")
          .eq("heir_wallet_address", heirData.wallet_address);

        // Insert new notifications
        const notifications = [];
        if (email) {
          notifications.push({
            vault_id: heirData.vault_id,
            recipient_type: "heir",
            channel: "email",
            address: email,
            heir_wallet_address: heirData.wallet_address,
            is_verified: true,
          });
        }
        if (phone) {
          notifications.push({
            vault_id: heirData.vault_id,
            recipient_type: "heir",
            channel: "sms",
            address: phone,
            heir_wallet_address: heirData.wallet_address,
            is_verified: true,
          });
        }

        if (notifications.length > 0) {
          const { error: notifError } = await supabase
            .from("notification_preferences")
            .insert(notifications);
          if (notifError) {
            console.error("[api/heirs] Notification update error:", notifError);
          }
        }
      }
    }

    return NextResponse.json({ success: true, heir: data }, { status: 200 });
  } catch (err: any) {
    console.error("[api/heirs] PUT error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── DELETE — Remove heir ───────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: heirId } = await params;
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get("ownerAddress");

    if (!ownerAddress) {
      return NextResponse.json(
        { error: "ownerAddress is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();
    const auth = await verifyOwner(supabase, heirId, ownerAddress);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Also delete associated notification preferences for this specific heir
    const { data: heir } = await supabase
      .from("heirs")
      .select("vault_id, wallet_address")
      .eq("id", heirId)
      .single();

    if (heir) {
      await supabase
        .from("notification_preferences")
        .delete()
        .eq("vault_id", heir.vault_id)
        .eq("recipient_type", "heir")
        .eq("heir_wallet_address", heir.wallet_address);
    }

    const { error } = await supabase.from("heirs").delete().eq("id", heirId);

    if (error) {
      console.error("[api/heirs] Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete heir" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[api/heirs] DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
