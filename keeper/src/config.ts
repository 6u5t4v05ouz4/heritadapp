import dotenv from 'dotenv';
import { PublicKey } from '@solana/web3.js';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  SOLANA_RPC_URL: z.string().url().default('https://api.devnet.solana.com'),
  KEEPER_PRIVATE_KEY: z.string().min(1, 'KEEPER_PRIVATE_KEY is required'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  API_PORT: z.string().transform(Number).default('3000'),
  API_RATE_LIMIT_PER_MINUTE: z.string().transform(Number).default('100'),
  MONITOR_INTERVAL_MINUTES: z.string().transform(Number).default('5'),
  CLAIM_CHECK_INTERVAL_MINUTES: z.string().transform(Number).default('5'),
  PROGRAM_ID: z.string().default('8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Config validation error:', parsed.error.format());
  process.exit(1);
}

export const config = {
  ...parsed.data,
  PROGRAM_ID_PUBKEY: new PublicKey(parsed.data.PROGRAM_ID),
};
