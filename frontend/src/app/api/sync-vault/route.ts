import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import idl from "@/lib/idl/crypto_heranca.json";

const PROGRAM_ID = new PublicKey(
  "8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX"
);

interface HeirContact {
  name: string;
  email: string;
  phone: string;
  wallet: string;
  asset: string;
  allocationType: "percentage" | "fixed";
  allocationValue: string;
}

interface SyncPayload {
  vaultAddress: string;
  ownerAddress: string;
  seed: number;
  inactivityPeriod: number; // seconds
  keeperFeeBps: number;
  gasReserveLamports: number;
  solBalance: number;
  heirs: HeirContact[];
}

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

export async function POST(request: NextRequest) {
  try {
    const body: SyncPayload = await request.json();

    // ── 1. Basic validation ─────────────────────────────────────
    if (
      !body.vaultAddress ||
      !body.ownerAddress ||
      typeof body.seed !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let vaultPubkey: PublicKey;
    let ownerPubkey: PublicKey;
    try {
      vaultPubkey = new PublicKey(body.vaultAddress);
      ownerPubkey = new PublicKey(body.ownerAddress);
    } catch {
      return NextResponse.json(
        { error: "Invalid public key format" },
        { status: 400 }
      );
    }

    // ── 2. On-chain verification ────────────────────────────────
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const dummyWallet = { publicKey: PublicKey.default, signAllTransactions: async (txs: any[]) => txs, signTransaction: async (tx: any) => tx } as any;
    const provider = new AnchorProvider(connection, dummyWallet, {
      commitment: "confirmed",
    });
    const program = new Program(idl as any, provider);

    let vaultAccount: any;
    try {
      vaultAccount = await (program as any).account.vault.fetch(vaultPubkey);
    } catch {
      return NextResponse.json(
        { error: "Vault not found on-chain" },
        { status: 404 }
      );
    }

    if (vaultAccount.owner.toBase58() !== ownerPubkey.toBase58()) {
      return NextResponse.json(
        { error: "Owner mismatch with on-chain vault" },
        { status: 403 }
      );
    }

    const onChainSeed = (vaultAccount.seed as BN).toNumber();
    const onChainInactivity = (vaultAccount.inactivityPeriod as BN).toNumber();
    const onChainKeeperFee = vaultAccount.keeperFeeBps as number;
    const onChainGasReserve = (vaultAccount.gasReserveLamports as BN).toNumber();

    if (onChainSeed !== body.seed) {
      return NextResponse.json({ error: "Seed mismatch" }, { status: 400 });
    }
    if (onChainInactivity !== body.inactivityPeriod) {
      return NextResponse.json(
        { error: "Inactivity period mismatch" },
        { status: 400 }
      );
    }
    if (onChainKeeperFee !== body.keeperFeeBps) {
      return NextResponse.json(
        { error: "Keeper fee mismatch" },
        { status: 400 }
      );
    }
    if (onChainGasReserve !== body.gasReserveLamports) {
      return NextResponse.json(
        { error: "Gas reserve mismatch" },
        { status: 400 }
      );
    }

    // Heirs count check
    if (vaultAccount.heirs.length !== body.heirs.length) {
      return NextResponse.json(
        { error: "Heirs count mismatch" },
        { status: 400 }
      );
    }

    // ── 3. Supabase insert (service role) ───────────────────────
    const supabase = getSupabaseServiceClient();

    const lastHeartbeat = new Date(
      (vaultAccount.lastHeartbeat as BN).toNumber() * 1000
    ).toISOString();

    const { data: vaultRow, error: vaultError } = await supabase
      .from("vaults")
      .insert({
        vault_address: body.vaultAddress,
        owner_address: body.ownerAddress,
        seed: body.seed,
        inactivity_period: body.inactivityPeriod,
        last_heartbeat: lastHeartbeat,
        keeper_fee_bps: body.keeperFeeBps,
        gas_reserve_lamports: body.gasReserveLamports,
        status: "active",
        sol_balance: body.solBalance,
      })
      .select("id")
      .single();

    if (vaultError || !vaultRow) {
      console.error("[api/sync-vault] Vault insert error:", vaultError);
      // Duplicate vault_address
      if (vaultError?.code === "23505") {
        return NextResponse.json(
          { error: "Vault already synced" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Failed to sync vault" },
        { status: 500 }
      );
    }

    const vaultId = vaultRow.id;

    // Insert heirs
    if (body.heirs.length > 0) {
      const heirRows = body.heirs.map((h) => ({
        vault_id: vaultId,
        name: h.name || null,
        wallet_address: h.wallet,
        asset_mint: h.asset,
        allocation_type:
          h.allocationType === "percentage" ? "percentage" : "fixed_amount",
        allocation_value: Number(h.allocationValue),
      }));

      const { error: heirsError } = await supabase
        .from("heirs")
        .insert(heirRows);
      if (heirsError) {
        console.error("[api/sync-vault] Heirs insert error:", heirsError);
      }
    }

    // Insert notification preferences
    const notifications = [];
    for (const h of body.heirs) {
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
        console.error(
          "[api/sync-vault] Notification insert error:",
          notifError
        );
      }
    }

    return NextResponse.json({ success: true, vaultId }, { status: 200 });
  } catch (err: any) {
    console.error("[api/sync-vault] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
