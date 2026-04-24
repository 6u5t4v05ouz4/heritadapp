import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    }
    supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabase;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('vaults').select('count').limit(1);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase health check failed:', err);
    return false;
  }
}
