# Session State

> Last updated: 2026-05-04
> Session started: 2026-04-26 (UI Redesign + Supabase Integration)
> Session continued: 2026-04-30 (Contract Finalization + Security Hardening)
> Session continued: 2026-05-04 (On-Chain Sync + Critical Bug Fix)

## Current Task
**Sincronização On-Chain para Edição/Deleção de Herdeiros**

Corrigir o gap crítico onde alterações de herdeiros no frontend (Supabase) não eram refletidas on-chain, resultando em distribuição incorreta no claim.

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

### Sprint 5 — Sincronização On-Chain (CRÍTICO)
- [x] **Bug identificado**: Edição/deleção de herdeiros no frontend apenas alterava o Supabase, deixando o smart contract on-chain desatualizado. Resultado: claim distribuía para herdeiros antigos/excluídos.
- [x] **`useVault.ts` — `updateConfig()`**: Nova função no hook que chama a instrução `update_config` do programa Anchor on-chain
  - Aceita: `newHeirs`, `newInactivityPeriodSeconds`, `newKeeperFeeBps`, `newGasReserveLamports`
  - Converte herdeiros para formato `HeirInput` (wallet → PublicKey, allocationType enum, allocationValue BN)
- [x] **`vaults/[address]/page.tsx` — `buildHeirsForOnChain()`**: Helper que converte herdeiros do Supabase para formato on-chain
- [x] **`vaults/[address]/page.tsx` — `recalculatePercentages()`**: Helper que recalcula automaticamente percentuais para somarem 10.000 bps (100%) após remoção de um herdeiro
- [x] **`handleDeleteHeir` atualizado**:
  1. Pergunta confirmação informando que atualizará on-chain
  2. Recalcula percentuais dos herdeiros restantes
  3. Valida se soma dá 100%
  4. Chama `updateConfig` on-chain para remover o herdeiro
  5. Depois deleta do Supabase
  6. Refresh do vault para refletir estado atualizado
- [x] **`handleUpdateHeir` atualizado**:
  1. Detecta se mudaram dados on-chain (wallet, allocationType, allocationValue)
  2. Se mudou: chama `updateConfig` on-chain PRIMEIRO
  3. Valida soma de percentuais = 100%
  4. Depois atualiza no Supabase (nome, email, phone sempre atualizam)
  5. Refresh do vault
- [x] **Loading state no botão de deletar**: Spinner animado (`RefreshCw`) enquanto processa transação on-chain, evita cliques duplos
- [x] **Build**: `next build` passa — 17 routes

---

## Active Problem / Blocker
Nenhum blocker. Build passando em todos os componentes (Rust, Keeper, Frontend).

---

## What's Pending / Next Steps

### Sprint 6 — Testes End-to-End e Validação (ALTO)
- [ ] **Teste de deleção**: Criar vault com 2 heirs (75%/25%), deletar um, verificar claim distribui 100% para o restante
- [ ] **Teste de edição de wallet**: Criar vault com 1 heir, editar wallet, verificar claim manda para nova wallet
- [ ] **Teste de edição de percentual**: Criar vault com 2 heirs (50%/50%), editar para (30%/70%), verificar claim respeita nova distribuição
- [ ] **Teste completo E2E**: create → deposit → heartbeat → edit heir → delete heir → wait expiry → claim
- [ ] **Teste de validação**: Tentar deletar herdeiro quando restante não soma 100% — deve bloquear

### Sprint 7 — Testes de Segurança e Edge Cases (MÉDIO)
- [ ] Testar claim com 0 heirs (vault vazio após delete all)
- [ ] Testar heartbeat com proof inválido
- [ ] Testar deposit + cancel sequence
- [ ] Testar update_config por non-owner (deve falhar)
- [ ] Stress test: múltiplos vaults, múltiplos heartbeats

### Sprint 8 — Gaps Finais de Mainnet (MÉDIO)
- [ ] Ajustar `MIN_INACTIVITY_PERIOD` de 60s (teste) para 30 dias antes do mainnet
- [ ] Verificar `RENT_EXEMPT_BALANCE` e `MAX_HEIRS` para mainnet
- [ ] Ajustar `GAS_RESERVE_MIN` se necessário

### Sprint 9 — Auditoria e Deploy Mainnet
- [ ] Auditoria de segurança do contrato (Trail of Bits / OtterSec)
- [ ] Deploy para mainnet-beta
- [ ] Atualizar frontend para mainnet (RPC, Program ID, explorer URLs)
- [ ] Documentação final do protocolo

### Features Futuras (Pós-MVP)
1. **SPL Token Support**: `deposit_token`, `claim_token`, múltiplos assets
2. **Notifications**: Resend/SendGrid email, Twilio SMS — alertas de expiração
3. **Keeper Stability**: Retry com backoff, alerting quando `available_sol < gas_reserve`
4. **Preview de distribuição**: Mostrar quanto cada heir receberá antes do claim
5. **Multi-sig heartbeat**: Permitir múltiplos signers
6. **Paginação/filtros**: Lista de vaults com paginação e filtros por status
7. **Sincronização automática**: Detectar quando Supabase está out of sync com on-chain e sugerir sync

---

## Key Decisions & Rationale

### Desta sessão (2026-05-04)
- **On-chain é a fonte da verdade**: O smart contract on-chain SEMPRE tem prioridade sobre o Supabase. Qualquer mudança em herdeiros (wallet, allocationType, allocationValue) DEVE passar por `update_config` on-chain primeiro. O Supabase é apenas uma camada de conveniência/cache para UI e notificações.
- **Validação dupla**: Ao editar/deletar, primeiro validamos a soma das porcentagens no frontend (antes de enviar tx), depois o smart contract valida novamente. Isso evita transações que falham por `InvalidPercentageSum`.
- **Recálculo automático de percentuais**: Ao deletar um herdeiro com allocation "percentage", redistribuímos proporcionalmente entre os restantes para somar 100%. Se o usuário quer percentuais específicos, deve editar manualmente antes de deletar.
- **Separação de concerns**: Dados on-chain (wallet, asset, allocation) vs dados off-chain (nome, email, phone). Edição de nome/email/phone não requer tx on-chain. Edição de wallet/allocation requer tx on-chain.

### Decisões anteriores mantidas
- **No SPL tokens**: Escopo reduzido para SOL nativo apenas. SPL tokens serão feature futura para evitar complexidade de ATA/CPI cross-program.
- **Ed25519 sysvar verification**: Usar `Sysvar1nstructions1111111111111111111111111` (instruction sysvar) para verificar assinatura on-chain sem custo extra de compute. O keeper monta uma transação com `Ed25519Program` instruction primeiro, depois `heartbeat` instruction que lê o sysvar.
- **Recovery code no initializeVault**: Se a Devnet demora >30s e dá timeout, o retry falha com "already in use" mas o vault já foi criado. O recovery detecta isso e retorna sucesso, evitando frustração do usuário.
- **Heir Dashboard separado**: Página dedicada `/heir` para herdeiros visualizarem seus vaults e executarem claim. Isso separa claramente as personas (owner vs heir).
- **Lazy Supabase Client**: Evita erro de build SSR quando env vars não estão definidas.
- **Best-Effort Sync**: Sync para Supabase não bloqueia redirect. Se falhar, vault já existe on-chain.
- **Service Role via API Route**: Frontend nunca faz INSERT direto no Supabase. API route `/api/sync-vault` valida on-chain e usa `SUPABASE_SERVICE_ROLE_KEY` server-side.
- **Basis Points (10000)**: Padrão Solana/DeFi. Frontend converte % → bps ao enviar, bps → % ao exibir.
- **Asset Mint Não Editável**: Herdeiros não podem ter asset alterado após criação.

---

## Files Modified / Created (Esta sessão — 2026-05-04)

### Frontend
- `frontend/src/hooks/useVault.ts` — Adicionado `updateConfig()` para chamar instrução on-chain
- `frontend/src/app/vaults/[address]/page.tsx` — Integração completa do on-chain sync:
  - `buildHeirsForOnChain()`: Conversão Supabase → on-chain format
  - `recalculatePercentages()`: Recálculo automático após deleção
  - `handleDeleteHeir()`: Agora chama `updateConfig` on-chain PRIMEIRO, depois deleta do Supabase
  - `handleUpdateHeir()`: Agora detecta mudanças on-chain e chama `updateConfig` antes de atualizar Supabase
  - Loading state no botão de deletar com spinner

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
