import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { processHeartbeat, HeartbeatRequest } from '../services/heartbeat';
import { findExpiredVaults, findVaultsExpiringSoon } from '../services/vault_monitor';
import { getSupabaseClient } from '../db/supabase';

const router = Router();
const supabase = getSupabaseClient();

// ============================================================
// POST /api/v1/heartbeat
// Receives off-chain heartbeat proof and submits on-chain
// ============================================================
const heartbeatSchema = z.object({
  vault_address: z.string().min(32).max(44),
  timestamp: z.number().int().positive(),
  signature: z.string().min(1), // base58 or base64
  pubkey: z.string().min(32).max(44),
});

router.post('/heartbeat', async (req: Request, res: Response) => {
  try {
    const parsed = heartbeatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'invalid_input',
        details: parsed.error.format(),
      });
    }

    const request: HeartbeatRequest = {
      vaultAddress: parsed.data.vault_address,
      timestamp: parsed.data.timestamp,
      signature: parsed.data.signature,
      pubkey: parsed.data.pubkey,
    };

    const result = await processHeartbeat(request);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[API] Heartbeat error:', err);
    return res.status(500).json({
      success: false,
      error: 'internal_error',
    });
  }
});

// ============================================================
// GET /api/v1/vaults/:vault_address/status
// Returns indexed vault status from Supabase
// ============================================================
router.get('/vaults/:vault_address/status', async (req: Request, res: Response) => {
  try {
    const { vault_address } = req.params;

    const { data, error } = await supabase
      .from('vaults')
      .select(`
        *,
        heirs (*),
        vault_assets (*)
      `)
      .eq('vault_address', vault_address)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'vault_not_found',
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error('[API] Vault status error:', err);
    return res.status(500).json({
      success: false,
      error: 'internal_error',
    });
  }
});

// ============================================================
// GET /api/v1/vaults
// List active vaults (paginated)
// ============================================================
router.get('/vaults', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('vaults')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('expires_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: any) {
    console.error('[API] List vaults error:', err);
    return res.status(500).json({
      success: false,
      error: 'internal_error',
    });
  }
});

// ============================================================
// POST /api/v1/notifications/register
// Register notification preference for a vault
// ============================================================
const notificationSchema = z.object({
  vault_address: z.string().min(32).max(44),
  channel: z.enum(['email', 'telegram', 'sms']),
  address: z.string().min(1),
  recipient_type: z.enum(['owner', 'heir']),
});

router.post('/notifications/register', async (req: Request, res: Response) => {
  try {
    const parsed = notificationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'invalid_input',
        details: parsed.error.format(),
      });
    }

    const { vault_address, channel, address, recipient_type } = parsed.data;

    // Get vault ID
    const { data: vaultData, error: vaultError } = await supabase
      .from('vaults')
      .select('id')
      .eq('vault_address', vault_address)
      .single();

    if (vaultError || !vaultData) {
      return res.status(404).json({
        success: false,
        error: 'vault_not_found',
      });
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .insert({
        vault_id: vaultData.id,
        channel,
        address,
        recipient_type,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error('[API] Notification register error:', err);
    return res.status(500).json({
      success: false,
      error: 'internal_error',
    });
  }
});

// ============================================================
// GET /api/v1/health
// Health check endpoint
// ============================================================
router.get('/health', async (_req: Request, res: Response) => {
  const supabaseHealthy = await getSupabaseClient()
    .from('vaults')
    .select('count')
    .limit(1)
    .then(() => true)
    .catch(() => false);

  return res.status(200).json({
    success: true,
    status: 'healthy',
    services: {
      api: true,
      supabase: supabaseHealthy,
    },
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// GET /api/v1/expired
// Admin endpoint: list expired vaults ready for claim
// ============================================================
router.get('/expired', async (_req: Request, res: Response) => {
  try {
    const expired = await findExpiredVaults();
    return res.status(200).json({
      success: true,
      count: expired.length,
      vaults: expired.map(({ pubkey, account }) => ({
        address: pubkey.toBase58(),
        owner: account.owner.toBase58(),
        last_heartbeat: account.lastHeartbeat.toNumber(),
        inactivity_period: account.inactivityPeriod.toNumber(),
        expires_at: account.lastHeartbeat.toNumber() + account.inactivityPeriod.toNumber(),
        keeper_fee_bps: account.keeperFeeBps,
        heirs_count: account.heirs.length,
      })),
    });
  } catch (err: any) {
    console.error('[API] Expired vaults error:', err);
    return res.status(500).json({
      success: false,
      error: 'internal_error',
    });
  }
});

export default router;
