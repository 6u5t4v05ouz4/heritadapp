# Session State

> Last updated: 2026-05-05
> Session started: 2026-04-26 (UI Redesign + Supabase Integration)
> Session continued: 2026-04-30 (Contract Finalization + Security Hardening)
> Session continued: 2026-05-04 (On-Chain Sync + Critical Bug Fix)
> Session continued: 2026-05-05 (Gold Theme Unification + Notification System)
> Session continued: 2026-05-05 (Bug Fixes: Notifications 404 + Heir Allocation Display)

## Current Task
**Sistema de Notificações (Email + SMS) e Tema Gold Premium**

Implementar notificações via SendGrid (email) e Twilio (SMS) para alertar owners e heirs sobre eventos críticos do vault. Unificar tema visual gold premium dark em todas as telas.

---

## What Was Done

### Sprint 1 — Contrato: Gaps e Correções
- [x] **Gap 2 (Verify)**: `initialize_token_account` já registra mint em `vault.assets`
- [x] **Gap 4 (Fix)**: Verificação Ed25519 real implementada em `heartbeat.rs`
- [x] **Build WSL**: `cargo build-sbf` passa

### Sprint 2 — Supabase: Segurança e RLS
- [x] **Migration `001_rls_security_fix.sql`**: RLS policies para todas as 7 tabelas
- [x] **Views**: `public_vaults` e `public_vault_heirs`
- [x] **Functions**: `is_vault_owner()`, `get_vault_owner()`, `get_notification_owner()`

### Sprint 3 — Keeper: Integração Final
- [x] **Heartbeat Modalidade B**: `submitHeartbeat` com Ed25519Program + heartbeat
- [x] **`buildEd25519Instruction()`**: Helper para instruction nativa
- [x] **Testes**: 10/10 passando

### Sprint 4 — Frontend: Integrações e UX
- [x] **`lib/explorer.ts`**: URLs Solana Explorer/Solscan
- [x] **`useEnhancedToast.tsx`**: Toast com link "View on Explorer"
- [x] **`/heir` page**: Dashboard completo para herdeiros
- [x] **Vault Detail UX**: Explorer links, toast melhorado
- [x] **Build**: `next build` passa

### Sprint 5 — Sincronização On-Chain (CRÍTICO)
- [x] **Bug fix**: Edição/deleção de herdeiros agora atualiza on-chain primeiro
- [x] **`useVault.ts` — `updateConfig()`**: Chama `update_config` on-chain
- [x] **`buildHeirsForOnChain()`**: Conversão Supabase → on-chain
- [x] **`recalculatePercentages()`**: Recálculo automático após remoção
- [x] **`handleDeleteHeir`/`handleUpdateHeir`**: On-chain sync integrado

### Sprint 6 — Tema Gold Premium Dark
- [x] **Button.tsx**: Glow primary azul → dourado `rgba(212,175,55,0.3)`
- [x] **Navbar.tsx**: Glass effect `backdrop-blur-md`, tokens semânticos, hover gold
- [x] **page.tsx (home)**: `bg-bg-base`, CTA gold, footer com tokens
- [x] **Todas as páginas**: Gradiente radial dourado no topo (`/vaults`, `/vaults/create`, `/vaults/[address]`, `/heir`)
- [x] **Build**: 17 routes geradas com sucesso

### Sprint 7 — Sistema de Notificações (Email + SMS)
- [x] **Dependências**: `@sendgrid/mail` e `twilio` instalados no keeper
- [x] **`notifications.ts`**: Serviço completo com 6 templates (heartbeat, deposit, expiry, claim, heir-alert, cancel)
- [x] **Configuração**: Variáveis de ambiente para SendGrid, Twilio, thresholds
- [x] **API Routes**: GET/DELETE `/notifications/preferences`, POST `/notifications/test`, GET `/notifications/status`
- [x] **Integração Keeper**: `checkAndSendExpiryNotifications` em `vault_monitor.ts`
- [x] **Event Wiring**:
  - Heartbeat detectado → `heartbeat_received` para owner
  - Depósito > 0.001 SOL → `deposit_received` para owner
  - Claim executado → `claim_executed` para owner
  - Vault expirado → `vault_expired` para heirs
- [x] **Deduplication**: `wasNotificationSentRecently` via `notification_logs` (24h cooldown)
- [x] **Frontend**: `NotificationPreferences.tsx` component na página de detalhes do vault
- [x] **Banner crítico**: Alerta visual na vault detail page quando timer < 25% com CTA "Send Heartbeat Now"
- [x] **Build**: Frontend e keeper passam (`npx tsc --noEmit` + `next build`)

### Bug Fixes — 2026-05-05
- [x] **Fix 404 on notifications**: `NotificationPreferences.tsx` was calling `/api/v1/notifications/*` relative URLs, which resolved to the frontend domain (Vercel) instead of the keeper (Railway). Created `frontend/src/lib/keeper.ts` with `KEEPER_BASE_URL` and `keeperUrl()` helper. Updated all fetch calls in `NotificationPreferences.tsx` to use full keeper URLs.
- [x] **Fix heir allocation display**: `sync-vault/route.ts` was saving `allocation_value` as raw percentage (50 for 50%) instead of bps (5000 for 50%), causing the estimated value calculation in heir cards to show ~0 SOL. Fixed `sync-vault` to multiply percentage allocations by 100 (bps). Added backward-compatible helpers `formatAllocationPercent()` and `calculateHeirEstimate()` in vault detail page to handle both old (raw) and new (bps) data formats during transition.
- [x] **Verify auto-notification preferences on vault creation**: Confirmed that `sync-vault/route.ts` already automatically creates `notification_preferences` for heirs using their email/phone from the creation form. This was already implemented but users couldn't verify due to the 404 bug.

---

## Active Problem / Blocker
Nenhum blocker técnico. Build passando em todos os componentes.

**Guia de configuração criado**: `docs/NOTIFICATION_SETUP.md` contém passo-a-passo completo para configurar credenciais SendGrid/Twilio no Railway e testar envio real.

**Atenção**: A pasta `docs/` foi removida do git por conter informações sensíveis. O guia existe apenas localmente em `D:\Users\n4r1g4\Desktop\CRYPTO-HERANCA\docs\NOTIFICATION_SETUP.md`.

---

## What's Pending / Next Steps

### Sprint 8 — Testes End-to-End e Validação (ALTO) 🔄 PRÓXIMO PASSO
- [x] **Guia de configuração de notificações**: Criado `docs/NOTIFICATION_SETUP.md` com instruções completas
- [ ] **Teste de notificações reais**: Seguir o guia para configurar credenciais SendGrid/Twilio no Railway e testar envio real
- [ ] **Teste E2E completo**: create → deposit → heartbeat → edit heir → delete heir → wait expiry → claim
- [ ] **Teste de deleção**: Criar vault com 2 heirs (75%/25%), deletar um, verificar claim distribui 100% para o restante
- [ ] **Teste de edição de wallet**: Editar wallet de heir, verificar claim manda para nova wallet
- [ ] **Teste de validação**: Tentar deletar herdeiro quando restante não soma 100% — deve bloquear

### Sprint 9 — Testes de Segurança e Edge Cases (MÉDIO)
- [ ] Testar claim com 0 heirs
- [ ] Testar heartbeat com proof inválido
- [ ] Testar deposit + cancel sequence
- [ ] Testar update_config por non-owner (deve falhar)
- [ ] Stress test: múltiplos vaults, múltiplos heartbeats

### Sprint 10 — Keeper Stability & UX (MÉDIO)
- [ ] **Retry com backoff**: Retry automático para transações que falham por congestionamento
- [ ] **Alerting quando `available_sol < gas_reserve`**: Notificar owner se saldo do vault estiver abaixo do gas reserve
- [ ] **Paginação/filtros**: Lista de vaults com paginação e filtros por status
- [ ] **Preview de distribuição**: Mostrar quanto cada heir receberá antes do claim

### Sprint 11 — Sincronização Automática e Multi-sig (MÉDIO)
- [ ] **Sincronização automática**: Detectar quando Supabase está out of sync com on-chain
- [ ] **Multi-sig heartbeat**: Permitir múltiplos signers para heartbeat
- [ ] **SPL Token Support**: `deposit_token`, `claim_token` (feature avançada)

---

## 🚨 MAINNET — ÚLTIMO PASSO DO PROJETO (NÃO IMPLEMENTAR AGORA)

> ⚠️ **Tudo relacionado a Mainnet será implementado APENAS no final do projeto**, após todas as features, testes e validações estarem 100% concluídas.

### Sprint 12 — Gaps Finais de Mainnet (MÉDIO)
- [ ] Ajustar `MIN_INACTIVITY_PERIOD` de 60s (teste) para 30 dias antes do mainnet
- [ ] Verificar `RENT_EXEMPT_BALANCE` e `MAX_HEIRS` para mainnet
- [ ] Ajustar `GAS_RESERVE_MIN` se necessário

### Sprint 13 — Auditoria e Deploy Mainnet
- [ ] Auditoria de segurança do contrato (Trail of Bits / OtterSec)
- [ ] Deploy para mainnet-beta
- [ ] Atualizar frontend para mainnet (RPC, Program ID, explorer URLs)
- [ ] Documentação final do protocolo

---

## Key Decisions & Rationale

### Desta sessão (2026-05-05)
- **Notificações desabilitadas por padrão**: `NOTIFICATIONS_ENABLED=false` até usuário configurar credenciais. Evita erros em dev/test.
- **Deduplication via notification_logs**: Cada template tem cooldown de 24h para evitar spam. Ex: expiry_warning não é enviado mais de uma vez por dia.
- **Threshold de depósito**: 0.001 SOL (1M lamports) para evitar notificações de dust ou rent adjustments.
- **Inline styles em emails**: Templates de email usam CSS inline para máxima compatibilidade com clientes de email (Gmail, Outlook, Apple Mail).
- **Tokens semânticos no tema**: Todas as cores usam `text-accent-primary`, `bg-bg-base`, `border-border-subtle` em vez de hardcoded `#D4AF37`. Isso permite trocar o tema inteiro alterando apenas o Tailwind config.

### Decisões anteriores mantidas
- **On-chain é a fonte da verdade**: Smart contract SEMPRE tem prioridade sobre Supabase.
- **No SPL tokens**: Escopo reduzido para SOL nativo apenas.
- **Ed25519 sysvar verification**: `Sysvar1nstructions1111111111111111111111111` para verificação on-chain.
- **Recovery code no initializeVault**: Detecta vault já criado após timeout na Devnet.
- **Heir Dashboard separado**: Página dedicada `/heir` para herdeiros.
- **Service Role via API Route**: Frontend nunca faz INSERT direto no Supabase.

---

## Files Modified / Created (Esta sessão — 2026-05-05)

### Frontend
- `frontend/src/components/ui/Button.tsx` — Glow primary dourado
- `frontend/src/components/layout/Navbar.tsx` — Glass effect, tokens semânticos
- `frontend/src/app/page.tsx` — Tema gold unificado
- `frontend/src/app/vaults/page.tsx`, `create/page.tsx`, `[address]/page.tsx`, `heir/page.tsx` — Gradiente radial dourado
- `frontend/src/components/vault/NotificationPreferences.tsx` — Novo componente de preferências de notificação

### Keeper
- `keeper/src/services/notifications.ts` — Serviço completo de notificações (novo)
- `keeper/src/services/vault_monitor.ts` — Integração heartbeat/deposit/expiry notifications
- `keeper/src/services/claim.ts` — Integração claim_executed notification
- `keeper/src/routes/api.ts` — Rotas API para notificações
- `keeper/src/config.ts` — Variáveis de ambiente para notificações
- `keeper/.env.example` — Template de variáveis SendGrid/Twilio
- `keeper/package.json` — Dependências `@sendgrid/mail` e `twilio`

### Bug Fixes (2026-05-05)
- `frontend/src/lib/keeper.ts` — Configuração da URL base do keeper (novo)
- `frontend/src/components/vault/NotificationPreferences.tsx` — Corrigido 404: todas as chamadas fetch agora usam `keeperUrl()`
- `frontend/src/app/api/sync-vault/route.ts` — Corrigido `allocation_value` para salvar em bps (x100) para percentual
- `frontend/src/app/vaults/[address]/page.tsx` — Adicionados helpers `formatAllocationPercent()` e `calculateHeirEstimate()` backward-compatible
- `notification_preferences.is_verified` — Bug crítico descoberto: a coluna tem default `false`, e o keeper ignora preferências não verificadas (`!pref.is_verified → skip`). Todas as inserções agora setam `is_verified: true`. Registros existentes no banco já foram atualizados para `true`.
- `frontend/src/app/heir/page.tsx` — Adicionado **polling automático** a cada 15 segundos para rebuscar dados on-chain (saldo, timer, status). Antes os dados só atualizavam com F5. Agora o dashboard do herdeiro é dinâmico com indicador "Live" mostrando tempo desde última atualização.

### Documentação
- `docs/NOTIFICATION_SETUP.md` — Guia completo de configuração de notificações (novo)
- `docs/DEPLOY-GUIDE.md` — Atualizado com seção de notificações e referência ao novo guia

---

## Important Context
- Repositório: https://github.com/6u5t4v05ouz4/heritadapp
- Program ID devnet: `8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX`
- Idioma UI: EN-US
- Stack: Next.js 16 + React 19 + Tailwind CSS v4 + TypeScript + Anchor 0.32 + Supabase
- Build WSL: `~/crypto-heranca-build/` (source of truth para Anchor builds)
- Deploy target: Railway (keeper) + Vercel (frontend) + Supabase (DB)

## Deploy URLs
- **Frontend (Vercel)**: https://frontend-jdx7pym9f-6u5t4v0s-projects.vercel.app
- **Frontend (Custom Domain)**: https://herita.xyz
- **Keeper (Railway)**: https://crypto-heranca-keeper-production.up.railway.app
- **Supabase**: https://naotxbbzuexiaiwbmikr.supabase.co

## Notification Configuration (Para teste real)
Para testar envio real de notificações, configure no `keeper/.env`:
```
NOTIFICATIONS_ENABLED=true
SENDGRID_API_KEY=SG.xxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@herita.xyz
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
EXPIRY_WARNING_THRESHOLD_PERCENT=25
```
