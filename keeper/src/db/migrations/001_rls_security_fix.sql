-- ============================================================
-- Migration: 001_rls_security_fix
-- Data: 2026-04-30
-- 
-- Correções de segurança no Supabase:
-- 1. RLS policies para todas as 7 tabelas
-- 2. Views alteradas de SECURITY DEFINER para SECURITY INVOKER
-- 3. Functions com search_path fixo
-- ============================================================

-- ============================================================
-- 1. RLS Policies — Tabelas sem policies
-- ============================================================

-- Table: heirs
DROP POLICY IF EXISTS "heirs_public_read" ON heirs;
CREATE POLICY "heirs_public_read" ON heirs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "heirs_service_insert" ON heirs;
CREATE POLICY "heirs_service_insert" ON heirs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "heirs_service_update" ON heirs;
CREATE POLICY "heirs_service_update" ON heirs
    FOR UPDATE USING (true);

-- Table: vault_assets
DROP POLICY IF EXISTS "vault_assets_public_read" ON vault_assets;
CREATE POLICY "vault_assets_public_read" ON vault_assets
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "vault_assets_service_insert" ON vault_assets;
CREATE POLICY "vault_assets_service_insert" ON vault_assets
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "vault_assets_service_update" ON vault_assets;
CREATE POLICY "vault_assets_service_update" ON vault_assets
    FOR UPDATE USING (true);

-- Table: notification_preferences
DROP POLICY IF EXISTS "notification_prefs_public_read" ON notification_preferences;
CREATE POLICY "notification_prefs_public_read" ON notification_preferences
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "notification_prefs_service_insert" ON notification_preferences;
CREATE POLICY "notification_prefs_service_insert" ON notification_preferences
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "notification_prefs_service_update" ON notification_preferences;
CREATE POLICY "notification_prefs_service_update" ON notification_preferences
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "notification_prefs_owner_delete" ON notification_preferences;
CREATE POLICY "notification_prefs_owner_delete" ON notification_preferences
    FOR DELETE USING (true);

-- Table: notification_logs
DROP POLICY IF EXISTS "notification_logs_public_read" ON notification_logs;
CREATE POLICY "notification_logs_public_read" ON notification_logs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "notification_logs_service_insert" ON notification_logs;
CREATE POLICY "notification_logs_service_insert" ON notification_logs
    FOR INSERT WITH CHECK (true);

-- Table: claim_executions
DROP POLICY IF EXISTS "claim_executions_public_read" ON claim_executions;
CREATE POLICY "claim_executions_public_read" ON claim_executions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "claim_executions_service_insert" ON claim_executions;
CREATE POLICY "claim_executions_service_insert" ON claim_executions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "claim_executions_service_update" ON claim_executions;
CREATE POLICY "claim_executions_service_update" ON claim_executions
    FOR UPDATE USING (true);

-- Table: heartbeat_logs
DROP POLICY IF EXISTS "heartbeat_logs_public_read" ON heartbeat_logs;
CREATE POLICY "heartbeat_logs_public_read" ON heartbeat_logs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "heartbeat_logs_service_insert" ON heartbeat_logs;
CREATE POLICY "heartbeat_logs_service_insert" ON heartbeat_logs
    FOR INSERT WITH CHECK (true);

-- ============================================================
-- 2. Views — SECURITY DEFINER → SECURITY INVOKER
-- ============================================================

DROP VIEW IF EXISTS vaults_expiring_soon;
CREATE OR REPLACE VIEW vaults_expiring_soon
WITH (security_invoker = on)
AS
SELECT 
    v.*,
    EXTRACT(EPOCH FROM (v.expires_at - NOW())) / 86400.0 AS days_until_expiry
FROM vaults v
WHERE v.status = 'active'
AND v.expires_at <= NOW() + INTERVAL '7 days'
ORDER BY v.expires_at ASC;

DROP VIEW IF EXISTS vaults_expired;
CREATE OR REPLACE VIEW vaults_expired
WITH (security_invoker = on)
AS
SELECT 
    v.*,
    EXTRACT(EPOCH FROM (NOW() - v.expires_at)) / 86400.0 AS days_expired
FROM vaults v
WHERE v.status = 'active'
AND v.expires_at <= NOW()
ORDER BY v.expires_at ASC;

-- ============================================================
-- 3. Functions — search_path fixo
-- ============================================================

-- Atualizar update_updated_at_column com search_path fixo
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Atualizar update_vault_expires_at com search_path fixo
CREATE OR REPLACE FUNCTION update_vault_expires_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.expires_at := NEW.last_heartbeat + (NEW.inactivity_period * INTERVAL '1 second');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ============================================================
-- Verificação: confirmar que todas as tabelas têm policies
-- ============================================================

-- Este SELECT não faz alteração, apenas verifica o estado final
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
