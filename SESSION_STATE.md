# Session State

> Last updated: 2026-04-28
> Session started: 2026-04-26 (UI Redesign + Supabase Integration)

## Current Task
**Fix: Claim Distribution + Edit Heir Feature — Crypto-Heranca**

A distribuição de claims foi corrigida para calcular porcentagens corretamente sobre a base fixa (não sobre saldo decrescente). O sistema de notificações foi refatorado para usar `heir_wallet_address` ao invés de matching por email/nome. Feature de editar herdeiro implementada e testada.

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
- [x] **Coluna `heir_wallet_address`** adicionada em `notification_preferences` para matching correto de notificações por wallet (não por email).
- [x] **Cliente Supabase no frontend**: `lib/supabase.ts` com lazy client (não quebra SSR/build sem env vars).
- [x] **Sync de vault**: `lib/vault-sync.ts` — após `initializeVault()` on-chain, sincroniza automaticamente:
  1. `vaults` (address, owner, seed, inactivity, keeper fee, gas reserve, status)
  2. `heirs` (name, wallet, asset, allocation type/value)
  3. `notification_preferences` (email → channel: email, phone → channel: sms)
- [x] **Template de env**: `.env.local.example` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Deploy (Concluído)
1. **✅ Step 0 — Code Changes**: Commit com API route segura + ajustes do keeper
2. **✅ Step 1 — Supabase**: Schema aplicado, env vars configuradas
3. **✅ Step 2 — Keeper no Railway**: Deployado e healthy
4. **✅ Step 3 — Frontend no Vercel**: Deployado e acessível
5. **✅ Step 4 — End-to-End Test**: Passou (landing, health, vaults, CORS)
6. **✅ Step 5 — Domínio Customizado**: `herita.xyz` configurado

### Editar Herdeiro (Vault Detail)
7. **✅ API routes**: `PUT/DELETE /api/heirs/[id]` com verificação de ownership
8. **✅ API route**: `GET /api/vaults/[address]/heirs` para listar dados enriquecidos com notificações
9. **✅ Modal de edição na página de detalhes do vault**
   - Campos editáveis: name, wallet, allocation type/value, email, phone
   - **Asset mint: desabilitado** (não pode ser alterado após criação)
   - Botões de editar/deletar sempre visíveis (não hover-only, funciona em mobile)
   - Notificações sincronizadas no Supabase ao editar (email/phone salvos em `notification_preferences`)

### Fix: Claim Distribution (CRÍTICO)
10. **✅ Bug encontrado**: Cálculo de porcentagem usava `remaining_sol` que diminuía a cada herdeiro
    - Exemplo errado: H1 50% de 1.0 = 0.5, H2 50% de 0.5 = 0.25 (total: 0.75, resto para H1)
11. **✅ Correção no Rust (WSL)**: Adicionada variável `percentage_base` fixa
    - Agora: H1 50% de 0.99 = 0.495, H2 50% de 0.99 = 0.495 (distribuição correta)
12. **✅ Basis points mantido**: Divisor `10_000` (padrão Solana/DeFi)
    - Frontend converte: usuário digita 25 → envia 2500 para o programa
    - Display: 2500 → mostra "25%"
13. **✅ Keeper IDL atualizado**: Copiado do build WSL (`~/crypto-heranca-build/target/idl/`)
14. **✅ Keeper `fetchAllVaults()`**: Corrigido de `.all()` quebrado para `getProgramAccounts` + `memcmp` filter

### Fix: Notification Preferences (CRÍTICO)
15. **✅ Matching por wallet**: `GET /api/vaults/[address]/heirs` agora usa `n.heir_wallet_address === heir.wallet_address`
    - Antes: `n.address === heir.wallet_address` (email vs pubkey = nunca dava match)
16. **✅ PUT heir**: Deleta/insere notificações apenas do **herdeiro específico** (não de todos do vault)
17. **✅ Schema atualizado**: `heir_wallet_address TEXT` em `notification_preferences` com unique constraint

## Active Problem / Blocker
Nenhum blocker. Distribuição testada e funcionando corretamente.

## What's Pending / Next Steps

### Próximas Features

#### 1. **Notifications (Fase 4)** — PRIORITÁRIO
- Implementar despachante (Resend/SendGrid para email, Twilio para SMS)
- Integrar com `notification_preferences` e `notification_logs`
- Enviar alertas quando vault estiver próximo de expirar (7 dias, 1 dia, 1 hora)
- Enviar notificação de claim executado para herdeiros

#### 2. **Keeper Stability**
- Adicionar retry com backoff exponencial em chamadas RPC
- Alertar no log quando vault tem `available_sol < gas_reserve` (não vai distribuir nada)
- Separar keeper fee do gas refund no log de claim_executions

#### 3. **Frontend UX Improvements**
- Adicionar preview de distribuição antes do claim ("H1 receberá X SOL, H2 receberá Y SOL")
- Mostrar warning quando vault balance < gas_reserve ("Adicione mais SOL para cobrir a reserva de gas")
- Adicionar paginação na lista de vaults
- Filtros por status (active, expired, claimed)

#### 4. **Token Support (SPL Tokens)**
- Implementar `deposit_token` e `claim_token` no frontend
- Mostrar saldo de tokens no vault detail
- Suportar múltiplos assets por vault

#### 5. **Multi-Sig / Recovery**
- Permitir múltiplos signers para heartbeat
- Implementar recovery de vault via proof

#### 6. **Test Coverage**
- Adicionar testes unitários para claim distribution math
- Testes de integração keeper ↔ Supabase
- Testes E2E para fluxo completo (create → deposit → heartbeat → claim)

## Key Decisions & Rationale
- **Lazy Supabase Client**: Evita erro de build SSR quando env vars não estão definidas (prerender estático). O cliente só é instanciado no momento da chamada.
- **Best-Effort Sync**: O sync para o Supabase não bloqueia o redirect. Se falhar, o vault já existe on-chain e o usuário pode continuar. O log de warning ajuda a debugar.
- **Service Role via API Route**: O frontend nunca mais faz INSERT direto no Supabase. A API route `/api/sync-vault` valida a vault on-chain (owner, parâmetros, heirs) e usa `SUPABASE_SERVICE_ROLE_KEY` server-side. Isso elimina a necessidade de abrir RLS INSERT para anon key.
- **On-Chain Validation na API Route**: Antes de persistir, a route confere `vault.owner`, `seed`, `inactivityPeriod`, `keeperFeeBps`, `gasReserveLamports` e `heirs.length` contra a conta on-chain. Isso previne sync de dados falsificados.
- **Campo `name` em `heirs`**: Adicionado no schema para personalização de notificações ("Olá João, o vault de Maria expirou...").
- **Basis Points (10000)**: Mantido como padrão no Rust para compatibilidade com convenções Solana/DeFi. Frontend converte % → bps ao enviar, e bps → % ao exibir.
- **Percentage Base Fixa**: No claim, porcentagens são calculadas sobre `percentage_base` (saldo após fixed amounts), não sobre `remaining_sol` decrescente. Isso garante divisão proporcional correta entre herdeiros.
- **Asset Mint Não Editável**: Herdeiros não podem ter o asset alterado após criação do vault (constraint de design — cada herdeiro é vinculado a um asset específico).
- **Hover-Only Removido**: Botões de editar/deletar herdeiros agora sempre visíveis para suportar mobile/touch.

## Files Modified / Created (Esta sessão)

### Rust Program (WSL)
- `~/crypto-heranca-build/programs/crypto_heranca/src/lib.rs` — Fix: `percentage_base` para cálculo correto de porcentagens
- `~/crypto-heranca-build/programs/crypto_heranca/src/instructions/initialize_vault.rs` — Validação `sum == 10_000`
- `~/crypto-heranca-build/programs/crypto_heranca/src/instructions/update_config.rs` — Validação `sum == 10_000`
- `~/crypto-heranca-build/programs/crypto_heranca/src/errors.rs` — Mensagem de erro atualizada

### Keeper
- `keeper/src/services/idl/crypto_heranca.json` — IDL atualizado com novo build
- `keeper/src/services/solana.ts` — Fix: `fetchAllVaults()` usa `getProgramAccounts` + `memcmp`
- `keeper/src/services/vault_monitor.ts` — Fix: `syncHeirs()` preserva `name`, error handling melhorado
- `keeper/src/db/schema.sql` — Adicionado `heir_wallet_address` em `notification_preferences`

### Frontend API Routes
- `frontend/src/app/api/heirs/[id]/route.ts` — Fix: PUT/DELETE notificações por `heir_wallet_address`
- `frontend/src/app/api/vaults/[address]/heirs/route.ts` — Fix: matching por `heir_wallet_address`

### Frontend Pages
- `frontend/src/app/vaults/[address]/page.tsx` — Modal de edição, asset mint desabilitado, % display correto, botões sempre visíveis
- `frontend/src/app/vaults/create/page.tsx` — Envia `allocationValue * 100` (converte % → bps)

### Deploy
- `docs/DEPLOY-GUIDE.md` — Guia de deploy manual
- **Program ID devnet**: `8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX`

## Important Context
- Repositório: https://github.com/6u5t4v05ouz4/heritadapp
- Program ID devnet: `8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX`
- Idioma UI: EN-US
- Stack: Next.js 16 + React 19 + Tailwind CSS v4 + TypeScript + Anchor 0.32 + Supabase

## Deploy URLs
- **Frontend (Vercel)**: https://frontend-jdx7pym9f-6u5t4v0s-projects.vercel.app
- **Frontend (Custom Domain)**: https://herita.xyz
- **Keeper (Railway)**: https://crypto-heranca-keeper-production.up.railway.app
- **Supabase**: https://naotxbbzuexiaiwbmikr.supabase.co
