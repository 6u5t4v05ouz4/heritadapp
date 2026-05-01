# Session State

> Last updated: 2026-04-30
> Session started: 2026-04-26 (UI Redesign + Supabase Integration)
> Session continued: 2026-04-30 (Contract Finalization + Security Hardening)

## Current Task
**Finalização do Crypto-Heranca: Contrato, Supabase, Keeper, Frontend**

Foco em finalizar o protocolo para deploy mainnet: corrigir gaps no contrato, endurecer segurança do Supabase, integrar keeper com verificação Ed25519 real, e melhorar UX do frontend com dashboard para herdeiros.

---

## What Was Done

### Sprint 1 — Contrato: Gaps e Correções
- [x] **Gap 2 (Verify)**: `initialize_token_account` já registra mint em `vault.assets` — verificado que o código já faz isso corretamente
- [x] **Gap 4 (Fix)**: Verificação Ed25519 real implementada em `heartbeat.rs`
  - Antes: placeholder `return Ok(())` (não verificava nada!)
  - Agora: lê sysvar de instructions, valida que instruction anterior foi `Ed25519Program`, extrai pubkey/signature, verifica match
  - Modalidade A (frontend): proof passado como parâmetro — verifica bytes brutos
  - Modalidade B (keeper): proof é `null` — usa `verify_ed25519_instruction` com sysvar
- [x] **Build WSL**: `cargo build-sbf` passa — `target/deploy/crypto_heranca.so` gerado

> ⛔ **Scope out**: Gap 1 (SPL tokens na claim) e Gap 3 (cancel SPL tokens) — decisão de usar apenas SOL nativo para simplificar e evitar complexidade de ATA/CPI com múltiplos tokens. Herança de SPL tokens será feature futura.

### Sprint 2 — Supabase: Segurança e RLS
- [x] **Migration `001_rls_security_fix.sql`**: Criada com RLS policies para todas as 7 tabelas
  - `vaults`: SELECT all, INSERT/UPDATE/DELETE owner-only, service_role INSERT
  - `heirs`: SELECT vault-owners, INSERT/UPDATE/DELETE owner-only
  - `notification_preferences`: SELECT vault-owners, INSERT/UPDATE/DELETE owner-only
  - `notification_logs`: SELECT owner-only
  - `heartbeat_logs`: SELECT owner-only
  - `claim_executions`: SELECT all
  - `audit_logs`: SELECT service_role only
- [x] **Views**: `public_vaults` e `public_vault_heirs` com `SECURITY INVOKER`
- [x] **Functions**: `is_vault_owner()`, `get_vault_owner()`, `get_notification_owner()` com `search_path = pg_temp, public`
- [x] **Migration aplicada** via Supabase CLI

### Sprint 3 — Keeper: Integração Final
- [x] **Heartbeat Modalidade B**: `submitHeartbeat` atualizado para montar transação com `Ed25519Program` + `heartbeat`
- [x] **`buildEd25519Instruction()`**: Helper que cria instruction nativa do Ed25519Program com formato binário correto (offsets, pubkey, signature, message)
- [x] **Transação em 2 instructions**: (1) Ed25519Program (verifica assinatura off-chain, prova on-chain), (2) heartbeat (reseta timer, lê sysvar)
- [x] **Testes**: 10/10 passando — API REST (7 testes) + heartbeat service (3 testes)
- [x] **Type-check**: `npx tsc --noEmit` passa sem erros
- [x] **Config**: `tsconfig.test.json` criado para Jest, `@types/jest` instalado

### Sprint 4 — Frontend: Integrações e UX
- [x] **`lib/explorer.ts`**: Utilitário para gerar URLs do Solana Explorer e Solscan (tx + address)
- [x] **`useEnhancedToast.tsx`**: Hook de toast com link "View on Explorer" para cada transação
- [x] **`useHeirVaults.ts`**: Hook para buscar vaults onde o usuário é herdeiro, calcular alocação, verificar claimable
- [x] **`/heir` page**: Dashboard completo para herdeiros
  - Stats cards (vaults como heir, valor potencial, prontos para claim)
  - Lista de vaults com timer em tempo real (atualiza a cada segundo)
  - Progress bar colorida (verde → âmbar → vermelho)
  - Botão "Execute Claim" aparece apenas quando timer expirou
  - Estados: Claimed, Cancelled, Waiting deposit, Active, Claimable
- [x] **Vault Detail UX**: Toast melhorado com explorer links, link para explorer no header
- [x] **Navbar**: Adicionado link "Heir Dashboard"
- [x] **Create Vault UX**: Detecta quando recovery code é acionado (Devnet lenta) e mostra warning apropriado
- [x] **Build**: `next build` passa com 15 routes incluindo `/heir`

---

## Active Problem / Blocker
Nenhum blocker. Build passando em todos os componentes (Rust, Keeper, Frontend).

---

## What's Pending / Next Steps

### Gap 5 — Ajustar rent-exempt e constantes de mainnet (MÉDIO)
- Verificar `RENT_EXEMPT_BALANCE` e `MAX_HEIRS` para mainnet
- Ajustar `GAS_RESERVE_MIN` se necessário

### Gap 6 — Testes de segurança e edge cases (MÉDIO)
- Testar claim com 0 heirs
- Testar heartbeat com proof inválido
- Testar deposit + cancel sequence

### Sprint 5 — Testes End-to-End e Stress
- Teste completo: create → deposit → heartbeat → wait expiry → claim
- Teste com múltiplos heirs
- Stress test: múltiplos vaults, múltiplos heartbeats

### Sprint 6 — Auditoria e Deploy Mainnet
- Auditoria de segurança do contrato
- Deploy para mainnet-beta
- Atualizar frontend para mainnet
- Documentação final

### Features Futuras (Pós-MVP)
1. **SPL Token Support**: `deposit_token`, `claim_token`, múltiplos assets
2. **Notifications**: Resend/SendGrid email, Twilio SMS — alertas de expiração
3. **Keeper Stability**: Retry com backoff, alerting quando `available_sol < gas_reserve`
4. **Preview de distribuição**: Mostrar quanto cada heir receberá antes do claim
5. **Multi-sig heartbeat**: Permitir múltiplos signers
6. **Paginação/filtros**: Lista de vaults com paginação e filtros por status

---

## Key Decisions & Rationale

### Desta desta sessão (2026-04-30)
- **No SPL tokens**: Escopo reduzido para SOL nativo apenas. SPL tokens serão feature futura para evitar complexidade de ATA/CPI cross-program.
- **Ed25519 sysvar verification**: Usar `Sysvar1nstructions1111111111111111111111111` (instruction sysvar) para verificar assinatura on-chain sem custo extra de compute. O keeper monta uma transação com `Ed25519Program` instruction primeiro, depois `heartbeat` instruction que lê o sysvar.
- **Recovery code no initializeVault**: Se a Devnet demora >30s e dá timeout, o retry falha com "already in use" mas o vault já foi criado. O recovery detecta isso e retorna sucesso, evitando frustração do usuário.
- **Heir Dashboard separado**: Página dedicada `/heir` para herdeiros visualizarem seus vaults e executarem claim. Isso separa claramente as personas (owner vs heir).
- **Type narrowing para enums Anchor**: Em vez de usar union types discriminatórias diretamente no frontend, extrair string status (`"active" | "cancelled" | "claimed"`) do objeto Anchor para evitar erros de TypeScript.

### Decisões anteriores mantidas
- **Lazy Supabase Client**: Evita erro de build SSR quando env vars não estão definidas.
- **Best-Effort Sync**: Sync para Supabase não bloqueia redirect. Se falhar, vault já existe on-chain.
- **Service Role via API Route**: Frontend nunca faz INSERT direto no Supabase. API route `/api/sync-vault` valida on-chain e usa `SUPABASE_SERVICE_ROLE_KEY` server-side.
- **Basis Points (10000)**: Padrão Solana/DeFi. Frontend converte % → bps ao enviar, bps → % ao exibir.
- **Asset Mint Não Editável**: Herdeiros não podem ter asset alterado após criação.

---

## Files Modified / Created (Esta sessão — 2026-04-30)

### Rust Program (WSL)
- `~/crypto-heranca-build/programs/crypto_heranca/src/instructions/heartbeat.rs` — Verificação Ed25519 real com sysvar
- `~/crypto-heranca-build/programs/crypto_heranca/src/lib.rs` — Fix: cancel vault sem SPL (apenas SOL)

### Keeper
- `keeper/src/services/heartbeat.ts` — `buildEd25519Instruction()` + `submitHeartbeat()` Modalidade B
- `keeper/tests/heartbeat.test.ts` — Testes de validação de assinatura
- `keeper/jest.config.js` — Configuração para `tsconfig.test.json`
- `keeper/tsconfig.test.json` — Configuração de testes com types Jest
- `keeper/package.json` — Adicionado `@types/jest`

### Supabase
- `keeper/src/db/migrations/001_rls_security_fix.sql` — RLS policies para todas as tabelas

### Frontend
- `frontend/src/lib/explorer.ts` — **NEW** URLs para Solana Explorer/Solscan
- `frontend/src/hooks/useEnhancedToast.tsx` — **NEW** Toast com link para explorer
- `frontend/src/hooks/useHeirVaults.ts` — **NEW** Hook para vaults de herdeiro
- `frontend/src/app/heir/page.tsx` — **NEW** Dashboard para herdeiros
- `frontend/src/app/vaults/[address]/page.tsx` — Toast enhanced, explorer link
- `frontend/src/app/vaults/create/page.tsx` — Recovery detection, toast enhanced
- `frontend/src/components/layout/Navbar.tsx` — Link "Heir Dashboard"

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
