import cron from 'node-cron';
import { createServer } from './server';
import { config } from './config';
import { syncVaults, findExpiredVaults } from './services/vault_monitor';
import { processExpiredVaults } from './services/claim';
import { healthCheck } from './db/supabase';

// ============================================================
// Entry Point — Crypto-Heranca Keeper
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     Crypto-Heranca Keeper v0.1.0                         ║');
  console.log('║     Dead Man\'s Switch Monitoring Service                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();

  // Validate configuration
  console.log('[Startup] Validating configuration...');
  console.log(`[Config] RPC: ${config.SOLANA_RPC_URL}`);
  console.log(`[Config] Program: ${config.PROGRAM_ID}`);
  console.log(`[Config] Monitor interval: ${config.MONITOR_INTERVAL_MINUTES}min`);
  console.log(`[Config] Claim check interval: ${config.CLAIM_CHECK_INTERVAL_MINUTES}min`);

  // Check Supabase connection
  console.log('[Startup] Checking Supabase connection...');
  const dbHealthy = await healthCheck();
  if (!dbHealthy) {
    console.error('[Startup] ❌ Supabase connection failed. Exiting.');
    process.exit(1);
  }
  console.log('[Startup] ✅ Supabase connected');

  // Initial sync
  console.log('[Startup] Performing initial vault sync...');
  const initialSync = await syncVaults();
  console.log(`[Startup] ✅ Initial sync: ${initialSync.synced} vaults`);

  // Setup cron jobs
  console.log('[Startup] Scheduling cron jobs...');

  // Vault sync job (every N minutes)
  const syncInterval = `*/${config.MONITOR_INTERVAL_MINUTES} * * * *`;
  cron.schedule(syncInterval, async () => {
    console.log('[Cron] Running vault sync...');
    try {
      await syncVaults();
    } catch (err) {
      console.error('[Cron] Sync error:', err);
    }
  });
  console.log(`[Cron] Vault sync scheduled: every ${config.MONITOR_INTERVAL_MINUTES} minutes`);

  // Claim execution job (every N minutes)
  const claimInterval = `*/${config.CLAIM_CHECK_INTERVAL_MINUTES} * * * *`;
  cron.schedule(claimInterval, async () => {
    console.log('[Cron] Checking for expired vaults...');
    try {
      const expired = await findExpiredVaults();
      if (expired.length > 0) {
        console.log(`[Cron] Found ${expired.length} expired vaults. Executing claims...`);
        await processExpiredVaults(expired);
      } else {
        console.log('[Cron] No expired vaults found.');
      }
    } catch (err) {
      console.error('[Cron] Claim check error:', err);
    }
  });
  console.log(`[Cron] Claim check scheduled: every ${config.CLAIM_CHECK_INTERVAL_MINUTES} minutes`);

  // Start API server
  const app = createServer();
  const port = config.API_PORT;

  app.listen(port, () => {
    console.log();
    console.log(`[Server] 🚀 API running on http://localhost:${port}`);
    console.log(`[Server] Health check: http://localhost:${port}/api/v1/health`);
    console.log();
    console.log('Keeper is ready. Press Ctrl+C to stop.');
  });
}

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('[Fatal] Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Fatal] Unhandled rejection:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Shutdown] Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Shutdown] Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

main().catch((err) => {
  console.error('[Fatal] Startup error:', err);
  process.exit(1);
});
