-- ============================================================
-- Supabase Schema for Crypto-Heranca Keeper
-- ============================================================
-- Run this in your Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: vaults
-- Index of all vaults on-chain for fast querying
-- ============================================================
CREATE TABLE IF NOT EXISTS vaults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_address TEXT NOT NULL UNIQUE,
    owner_address TEXT NOT NULL,
    seed BIGINT NOT NULL,
    inactivity_period BIGINT NOT NULL,
    last_heartbeat TIMESTAMPTZ NOT NULL,
    keeper_fee_bps SMALLINT NOT NULL DEFAULT 0,
    gas_reserve_lamports BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('active', 'claimed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sol_balance BIGINT NOT NULL DEFAULT 0,
    claim_executed_at TIMESTAMPTZ,
    claim_executor TEXT,
    expires_at TIMESTAMPTZ GENERATED ALWAYS AS (
        last_heartbeat + (inactivity_period || ' seconds')::INTERVAL
    ) STORED
);

-- Indexes for vaults
CREATE INDEX IF NOT EXISTS idx_vaults_owner ON vaults(owner_address);
CREATE INDEX IF NOT EXISTS idx_vaults_status ON vaults(status);
CREATE INDEX IF NOT EXISTS idx_vaults_expires_at ON vaults(expires_at);
CREATE INDEX IF NOT EXISTS idx_vaults_status_expires ON vaults(status, expires_at) WHERE status = 'active';

-- ============================================================
-- Table: heirs
-- Herdeiros vinculados a cada vault
-- ============================================================
CREATE TABLE IF NOT EXISTS heirs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    asset_mint TEXT NOT NULL DEFAULT '11111111111111111111111111111111',
    allocation_type TEXT NOT NULL CHECK (allocation_type IN ('percentage', 'fixed_amount')),
    allocation_value BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_heirs_vault ON heirs(vault_id);
CREATE INDEX IF NOT EXISTS idx_heirs_wallet ON heirs(wallet_address);

-- ============================================================
-- Table: vault_assets
-- Assets (tokens) depositados em cada vault
-- ============================================================
CREATE TABLE IF NOT EXISTS vault_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    mint_address TEXT NOT NULL,
    balance BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(vault_id, mint_address)
);

CREATE INDEX IF NOT EXISTS idx_vault_assets_vault ON vault_assets(vault_id);

-- ============================================================
-- Table: notification_preferences
-- Preferências de notificação de owners e herdeiros
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('owner', 'heir')),
    channel TEXT NOT NULL CHECK (channel IN ('email', 'telegram', 'sms')),
    address TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_vault ON notification_preferences(vault_id);

-- ============================================================
-- Table: notification_logs
-- Histórico de notificações enviadas (evita spam)
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    notification_preference_id UUID REFERENCES notification_preferences(id),
    channel TEXT NOT NULL,
    recipient_address TEXT NOT NULL,
    template_name TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_notif_logs_vault ON notification_logs(vault_id);
CREATE INDEX IF NOT EXISTS idx_notif_logs_sent_at ON notification_logs(sent_at);

-- ============================================================
-- Table: claim_executions
-- Log de claims executados pelo keeper
-- ============================================================
CREATE TABLE IF NOT EXISTS claim_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    executor_address TEXT NOT NULL,
    tx_signature TEXT NOT NULL UNIQUE,
    total_sol_distributed BIGINT NOT NULL DEFAULT 0,
    keeper_fee_lamports BIGINT NOT NULL DEFAULT 0,
    gas_refund_lamports BIGINT NOT NULL DEFAULT 0,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending'))
);

CREATE INDEX IF NOT EXISTS idx_claims_vault ON claim_executions(vault_id);

-- ============================================================
-- Table: heartbeat_logs
-- Log de heartbeats processados
-- ============================================================
CREATE TABLE IF NOT EXISTS heartbeat_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    caller_address TEXT NOT NULL,
    tx_signature TEXT,
    mode TEXT NOT NULL CHECK (mode IN ('owner_direct', 'keeper_proof')),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_heartbeat_vault ON heartbeat_logs(vault_id);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE heirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartbeat_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for active vaults (dApp listing)
CREATE POLICY "vaults_public_read" ON vaults
    FOR SELECT USING (status = 'active');

-- Policy: Owner can read/update their own vaults
CREATE POLICY "vaults_owner_access" ON vaults
    FOR ALL USING (owner_address = auth.uid()::text);

-- Policy: Heirs can read vaults they are associated with
CREATE POLICY "heirs_vault_read" ON vaults
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM heirs h
            WHERE h.vault_id = vaults.id
            AND h.wallet_address = auth.uid()::text
        )
    );

-- Policy: Keeper service role can do everything (insert/update)
-- This is handled by the service role key bypassing RLS by default,
-- but if using anon key, create specific policies.

-- ============================================================
-- Views
-- ============================================================

-- View: Vaults expiring soon (next 7 days)
CREATE OR REPLACE VIEW vaults_expiring_soon AS
SELECT 
    v.*,
    EXTRACT(EPOCH FROM (v.expires_at - NOW())) / 86400.0 AS days_until_expiry
FROM vaults v
WHERE v.status = 'active'
AND v.expires_at <= NOW() + INTERVAL '7 days'
ORDER BY v.expires_at ASC;

-- View: Vaults expired (ready for claim)
CREATE OR REPLACE VIEW vaults_expired AS
SELECT 
    v.*,
    EXTRACT(EPOCH FROM (NOW() - v.expires_at)) / 86400.0 AS days_expired
FROM vaults v
WHERE v.status = 'active'
AND v.expires_at <= NOW()
ORDER BY v.expires_at ASC;

-- ============================================================
-- Functions
-- ============================================================

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_vaults_updated_at BEFORE UPDATE ON vaults
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_heirs_updated_at BEFORE UPDATE ON heirs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vault_assets_updated_at BEFORE UPDATE ON vault_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notif_prefs_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Realtime Setup (for dApp live updates)
-- ============================================================

-- Enable realtime for vaults table (dApp listens to timer updates)
BEGIN;
  -- Drop the replication slot if it exists (safe for initial setup)
  -- Note: In production, handle this carefully
  
  -- Add table to realtime publication
  -- This requires the supabase_realtime extension
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_extension WHERE extname = 'realtime'
    ) THEN
      -- Add vaults table to realtime publication
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE vaults';
    END IF;
  END $$;
COMMIT;

-- ============================================================
-- Instructions for Setup
-- ============================================================
-- 1. Create a Supabase project at https://supabase.com
-- 2. Go to SQL Editor → New Query
-- 3. Paste and run this entire file
-- 4. Copy Project URL and Service Role Key to .env
-- 5. (Optional) Enable Realtime in Dashboard → Database → Replication
-- ============================================================
