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
  MONITOR_INTERVAL_MINUTES: z.string().transform(Number).default('30'),
  CLAIM_CHECK_INTERVAL_MINUTES: z.string().transform(Number).default('15'),
  PROGRAM_ID: z.string().default('8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Notifications (Resend for email)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional().default('noreply@herita.xyz'),
  // Legacy aliases (read SENDGRID_* if RESEND_* not set)
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  NOTIFICATIONS_ENABLED: z.string().transform((val) => val === 'true').default('false'),
  EXPIRY_WARNING_THRESHOLD_PERCENT: z.string().transform(Number).default('25'),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Config validation error:', parsed.error.format());
  process.exit(1);
}

// Resolve email provider: prefer RESEND_*, fall back to SENDGRID_*
const resolvedEmailApiKey = parsed.data.RESEND_API_KEY || parsed.data.SENDGRID_API_KEY || undefined;
const resolvedEmailFrom = parsed.data.RESEND_FROM_EMAIL || parsed.data.SENDGRID_FROM_EMAIL || 'noreply@herita.xyz';

export const config = {
  ...parsed.data,
  PROGRAM_ID_PUBKEY: new PublicKey(parsed.data.PROGRAM_ID),
  // Resolved email config (Resend)
  EMAIL_API_KEY: resolvedEmailApiKey,
  EMAIL_FROM: resolvedEmailFrom,
};
