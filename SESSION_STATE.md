# Session State

> Last updated: 2026-04-28
> Session started: 2026-04-26 (UI Redesign + Supabase Integration)

## Current Task
**Deploy para Produção — Crypto-Heranca Keeper + Frontend**

A interface do HERITA foi completamente redesenhada de um wireframe genérico (zinc-only) para um design system premium dark-first chamado "Sovereign Legacy". Toda a aplicação está agora em EN-US. Além disso, o frontend agora sincroniza dados off-chain (heir contacts: name, email, phone) com o Supabase após a criação de um vault.

## What Was Done

### UI/UX Redesign (Fases 1-4 do UI-REDESIGN-PLAN.md)
- [x] **Design System**: Paleta dark-first customizada (`#080C14` base, sky `#38BDF8` accent, warm amber `#FBBF24`), tipografia Geist Sans/Mono, grid 4px.
- [x] **Componentes Base**: Button, Card, Badge, Input, Skeleton, EmptyState, CopyButton, ProgressBar, Toast, StepIndicator, WalletButton.
- [x] **Layout**: Navbar fixo com blur backdrop, PageHeader reutilizável.
- [x] **Home (`/`)**: Hero com gradiente, social proof cards (Self-custody, Multi-heir, Smart Timer), seção "How it works" em 4 cards, CTA duplo, footer minimal. Tudo em EN-US.
- [x] **Vaults List (`/vaults`)**: Stats row (total vaults, SOL protegido, próximo vencimento), grid de VaultCard com timer visual dinâmico (cor verde → âmbar → vermelho), empty state ilustrado, skeleton loading com shimmer.
- [x] **Create Vault (`/vaults/create`)**: Wizard 3 steps com StepIndicator visual, layout 2 colunas em desktop, validação de email em tempo real, checkbox de confirmação. **Novos campos de contato por herdeiro**: Full Name, Email, Phone.
- [x] **Vault Detail (`/vaults/[address]`)**: Timer hero grande, dashboard grid (saldo + configurações), actions panel 2×2 (Deposit SOL, Heartbeat, Cancel Vault, Execute Claim), lista de herdeiros, timeline de atividade. Toast notifications para sucesso/erro.
- [x] **Wallet Adapter Customizado**: CSS override para combinar com o tema dark (bordas, cores, modais).

### Integração Supabase (Frontend)
- [x] **Schema SQL atualizado**: Coluna `name` adicionada à tabela `heirs`. Script tornado idempotente (`DROP IF EXISTS` em policies/triggers, `EXCEPTION WHEN duplicate_object` em realtime).
- [x] **Cliente Supabase no frontend**: `lib/supabase.ts` com lazy client (não quebra SSR/build sem env vars).
- [x] **Sync de vault**: `lib/vault-sync.ts` — após `initializeVault()` on-chain, sincroniza automaticamente:
  1. `vaults` (address, owner, seed, inactivity, keeper fee, gas reserve, status)
  2. `heirs` (name, wallet, asset, allocation type/value)
  3. `notification_preferences` (email → channel: email, phone → channel: sms)
- [x] **Template de env**: `.env.local.example` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Active Problem / Blocker
**Vercel Deployment Protection ativado** — o frontend está requerendo autenticação Vercel para acessar. Precisa desativar em:
https://vercel.com/6u5t4v0s-projects/frontend/settings/deployment-protection

## What's Pending / Next Steps

### Deploy (Em Progresso)
1. **✅ Step 0 — Code Changes**: Commit com API route segura + ajustes do keeper (PORT, Procfile, railway.json)
2. **✅ Step 1 — Supabase**: Schema já aplicado, env vars configuradas
3. **✅ Step 2 — Keeper no Railway**: Deployado em `https://crypto-heranca-keeper-production.up.railway.app` (health: OK)
4. **✅ Step 3 — Frontend no Vercel**: Deployado em `https://frontend-f41l78ous-6u5t4v0s-projects.vercel.app`
5. **⏳ Step 4 — End-to-End Test**: Aguardando desativação do Vercel Deployment Protection
6. **⏳ Step 5 — Domínio Customizado**: Opcional, após E2E passar

### Próximas Features (Pós-Deploy)
7. **Notificações (Fase 4)**
   - Implementar despachante (Resend/SendGrid para email, Twilio para SMS)
   - Integrar com `notification_preferences` e `notification_logs`

8. **Keeper Indexing**
   - Escutar eventos on-chain e atualizar Supabase em tempo real
   - Atualmente o sync é feito pelo frontend no momento da criação

## Key Decisions & Rationale
- **Lazy Supabase Client**: Evita erro de build SSR quando env vars não estão definidas (prerender estático). O cliente só é instanciado no momento da chamada.
- **Best-Effort Sync**: O sync para o Supabase não bloqueia o redirect. Se falhar, o vault já existe on-chain e o usuário pode continuar. O log de warning ajuda a debugar.
- **Service Role via API Route**: O frontend nunca mais faz INSERT direto no Supabase. A API route `/api/sync-vault` valida a vault on-chain (owner, parâmetros, heirs) e usa `SUPABASE_SERVICE_ROLE_KEY` server-side. Isso elimina a necessidade de abrir RLS INSERT para anon key.
- **On-Chain Validation na API Route**: Antes de persistir, a route confere `vault.owner`, `seed`, `inactivityPeriod`, `keeperFeeBps`, `gasReserveLamports` e `heirs.length` contra a conta on-chain. Isso previne sync de dados falsificados.
- **Campo `name` em `heirs`**: Adicionado no schema para personalização de notificações ("Olá João, o vault de Maria expirou...").

## Files Modified / Created (Nesta sessão)

### Novos componentes UI
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/components/ui/Card.tsx`
- `frontend/src/components/ui/Badge.tsx`
- `frontend/src/components/ui/Input.tsx`
- `frontend/src/components/ui/Skeleton.tsx`
- `frontend/src/components/ui/EmptyState.tsx`
- `frontend/src/components/ui/CopyButton.tsx`
- `frontend/src/components/ui/ProgressBar.tsx`
- `frontend/src/components/ui/Toast.tsx`
- `frontend/src/components/ui/StepIndicator.tsx`
- `frontend/src/components/ui/WalletButton.tsx`
- `frontend/src/components/layout/Navbar.tsx`
- `frontend/src/components/layout/PageHeader.tsx`
- `frontend/src/components/vault/VaultCard.tsx`
- `frontend/src/components/vault/VaultTimer.tsx`
- `frontend/src/hooks/useToast.tsx`

### Páginas redesenhadas
- `frontend/src/app/layout.tsx`
- `frontend/src/app/globals.css`
- `frontend/src/app/page.tsx`
- `frontend/src/app/vaults/page.tsx`
- `frontend/src/app/vaults/create/page.tsx`
- `frontend/src/app/vaults/[address]/page.tsx`

### Supabase integration (Anterior)
- `frontend/src/lib/utils.ts` (cn helper)
- `frontend/src/lib/supabase.ts`
- `frontend/src/lib/vault-sync.ts`
- `frontend/.env.local.example`
- `keeper/src/db/schema.sql` (atualizado com `name` em heirs + idempotência)

### Supabase Security & API Route (Sessão anterior)
- `frontend/src/app/api/sync-vault/route.ts` (nova API route com validação on-chain + service role insert)
- `frontend/src/lib/vault-sync.ts` (refatorado para chamar `/api/sync-vault` via fetch)
- `frontend/.env.local.example` (adicionado `SUPABASE_SERVICE_ROLE_KEY`)

### Deploy para Produção (Esta sessão)
- `keeper/Procfile` (novo — define comando de start para Railway)
- `keeper/railway.json` (novo — configuração de build/deploy do Railway)
- `keeper/src/index.ts` (editado — adicionado `process.env.PORT` fallback)
- `frontend/.env.local` (corrigido — substituída Service Role Key por Anon Key correta)
- **Keeper deployado no Railway**: `https://crypto-heranca-keeper-production.up.railway.app`
  - Health check: ✅ API + Supabase conectados
  - Cron jobs: vault sync (5min) + claim check (5min)
  - CORS restrito ao domínio do Vercel
- **Frontend deployado no Vercel**: `https://frontend-f41l78ous-6u5t4v0s-projects.vercel.app`
  - Env vars configuradas: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (server-only), SOLANA_NETWORK, PROGRAM_ID

## Important Context
- Repositório: https://github.com/6u5t4v05ouz4/heritadapp
- Program ID devnet: `8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX`
- Idioma UI: EN-US
- Stack: Next.js 16 + React 19 + Tailwind CSS v4 + TypeScript + Anchor 0.32 + Supabase

## Deploy URLs
- **Frontend (Vercel)**: https://frontend-f41l78ous-6u5t4v0s-projects.vercel.app
- **Keeper (Railway)**: https://crypto-heranca-keeper-production.up.railway.app
- **Supabase**: https://naotxbbzuexiaiwbmikr.supabase.co
