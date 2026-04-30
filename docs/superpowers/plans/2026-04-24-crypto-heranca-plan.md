# Plano de Implementação — Crypto-Herança

**Data:** 2026-04-30  
**Status:** Revisão — Foco em Finalização, Segurança e Deploy  
**Baseado no estado real do código:** Contrato buildado no WSL (`~/crypto-heranca-build`), Keeper estruturado, Frontend em Next.js 16, Supabase com schema criado.

---

## 1. Visão Geral do Plano

Este plano foi reescrito para refletir o **estado real do projeto**. O Crypto-Herança não está no estágio de "implementação do zero" — o smart contract Anchor já foi buildado, o IDL foi gerado, o keeper possui estrutura completa e o frontend está em Next.js 16. O foco agora é **corrigir gaps críticos de segurança e funcionalidade**, hardenar a infraestrutura Supabase, e preparar o projeto para deploy na mainnet.

### Estado Atual do Projeto

| Componente | Status | Observações |
|------------|--------|-------------|
| **Smart Contract (Anchor 0.32.1)** | ~75% concluído | Buildado, IDL gerado, deploy devnet realizado. Faltam: distribuição de SPL tokens na claim, fix de assets, verificação Ed25519 real |
| **Keeper (Node.js/Express)** | ~60% concluído | Estrutura completa, APIs REST, monitoramento. Faltam: integração final com Supabase, testes de stress |
| **Frontend (Next.js 16 + React 19)** | ~50% concluído | Projeto criado, wallet adapter configurado. Faltam: páginas de gerenciamento, integração Supabase Realtime, integração keeper |
| **Supabase (PostgreSQL)** | Schema criado | 7 tabelas + views + functions. **Crítico:** sem RLS policies, sem migrações versionadas, views com SECURITY DEFINER |
| **Testes** | Happy path de SOL | Testes TypeScript passam para SOL nativo. Não cobrem: SPL tokens, edge cases de segurança, múltiplos herdeiros |

### Objetivo deste Plano

Corrigir todos os gaps que impedem o deploy seguro em produção, hardenar a infraestrutura, e entregar um produto funcional e auditável em **5-7 semanas**.

### Ordem de Execução

```
Sprint 1: Smart Contract — Correção de Gaps Críticos
    ↓
Sprint 2: Supabase — Segurança, RLS e Migrações
    ↓
Sprint 3: Keeper — Integração Final e Testes
    ↓
Sprint 4: Frontend — Integrações e UX
    ↓
Sprint 5: Testes End-to-End e Stress
    ↓
Sprint 6: Auditoria de Segurança e Deploy Mainnet
```

---

## 2. Stack Tecnológica Consolidada

> **Nota:** O plano anterior mencionava `@solana/kit` e `@solana/react-hooks`. A stack real do projeto usa `@solana/web3.js` e `@solana/wallet-adapter-react`. Esta seção documenta a stack **real** em uso.

### 2.1 Smart Contract
- **Framework:** Anchor 0.32.1
- **Linguagem:** Rust 1.75+
- **Token Program:** SPL Token (classic)
- **Testing:** `anchor test` com `ts-mocha` + `chai` (TypeScript)
- **Deployment:** Solana CLI + Anchor deploy (devnet → mainnet)
- **Program ID (devnet):** `8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX`

### 2.2 Keeper / Bot
- **Runtime:** Node.js 20+ LTS
- **Linguagem:** TypeScript 5.3+
- **Framework:** Express.js 4.18+ (com Helmet, CORS, express-rate-limit)
- **Cliente Solana:** `@solana/web3.js` ^1.91.0
- **Banco de Dados:** Supabase (PostgreSQL + Realtime)
- **Scheduling:** `node-cron`
- **Deploy:** Docker + Docker Compose (local/dev) → Railway/Render (prod)
- **Cliente Supabase:** `@supabase/supabase-js` ^2.39.0
- **Testes:** Jest 29 + Supertest

### 2.3 dApp Frontend
- **Framework:** Next.js 16.2.4 (App Router)
- **Linguagem:** TypeScript 5.3+
- **Estilização:** Tailwind CSS 4 + CSS nativo
- **Wallet:** `@solana/wallet-adapter-react` ^0.15.39 + Phantom/Solflare adapters
- **Cliente Solana:** `@solana/web3.js` ^1.98.4
- **Estado:** TanStack Query (React Query) ^5.100.1
- **Cliente Supabase:** `@supabase/supabase-js` ^2.104.1
- **Deploy:** Vercel

### 2.4 Notificações
- **Runtime:** Integrado ao keeper (Node.js)
- **Email:** Resend ou SendGrid
- **Telegram:** Bot API via `node-telegram-bot-api`
- **Scheduling:** `node-cron` (jobs diários)

---

## 3. Sprint 1: Smart Contract — Correção de Gaps Críticos

**Objetivo:** Corrigir todos os gaps de funcionalidade e segurança do contrato antes de qualquer deploy adicional.

**Dependências:** Nenhuma (pode começar imediatamente)

**Estimativa:** 1-2 semanas

### 3.1 Gap 1: Distribuição de SPL Tokens na `claim` 🔴 BLOQUEANTE

**Problema:** A instrução `claim` em `lib.rs` só distribui SOL nativo. SPL tokens depositados no vault **nunca são transferidos** para os herdeiros.

**Tarefas:**
- [ ] Modificar `Claim` accounts para incluir ATAs dos herdeiros para cada asset (remaining_accounts dinâmico)
- [ ] Iterar sobre `vault.assets` (máx 5 mints)
- [ ] Para cada asset SPL:
  - Agrupar herdeiros por asset
  - Calcular distribuição (FixedAmount primeiro, depois Percentage)
  - Criar ATAs dos herdeiros se não existirem (pagas pelo vault)
  - Transferir tokens via CPI para `token::transfer`
- [ ] Emitir evento `ClaimExecuted` para cada transferência de token
- [ ] Atualizar testes TypeScript para cobrir claim com SPL tokens

**Segurança:**
- Validar que cada ATA passada corresponde ao herdeiro correto (mint + authority)
- Usar `checked_math` para todos os cálculos de quantidade
- Limitar compute units se necessário

**Critério de Aceitação:**
- Teste e2e: criar vault → depositar USDC → esperar timer → claim → herdeiros recebem USDC corretamente
- Teste com múltiplos assets (SOL + USDC + outro token)

### 3.2 Gap 2: Registro de Assets no Vault 🔴 BLOQUEANTE

**Problema:** `initialize_token_account` cria a ATA do vault, mas **não adiciona o mint** à lista `vault.assets`. `deposit_token` falha com `AssetNotFound`.

**Tarefas:**
- [ ] Modificar `initialize_token_account` para adicionar `mint.key()` a `vault.assets` (se ainda não estiver na lista)
- [ ] Garantir que `vault.assets.len() <= MAX_ASSETS` (5)
- [ ] Modificar `deposit_token` para adicionar o mint a `vault.assets` se ainda não estiver (fallback)
- [ ] Testar: criar vault → initialize_token_account → deposit_token (deve funcionar sem erro)

**Critério de Aceitação:**
- Fluxo completo de depósito de token funciona sem `AssetNotFound`
- `vault.assets` contém todos os mints depositados

### 3.3 Gap 3: Cancel Vault deve devolver SPL Tokens 🔴 BLOQUEANTE

**Problema:** `cancel_vault` fecha a conta Vault (`close = owner`) devolvendo SOL + rent, mas **SPL tokens nas ATAs ficam presos** (a authority do vault PDA some).

**Tarefas:**
- [ ] Modificar `CancelVault` accounts para incluir todas as ATAs do vault (dinâmicas via remaining_accounts)
- [ ] Antes de `close`, iterar sobre `vault.assets` e transferir todos os tokens SPL de volta para `owner_ata`
- [ ] Se `owner_ata` não existir, criar via CPI (`associated_token::create`)
- [ ] Após transferir todos os tokens, fechar as ATAs do vault para recuperar rent
- [ ] Testar: cancelar vault com SOL + USDC → owner recebe ambos de volta

**Segurança:**
- Validar que cada vault_ata pertence ao vault PDA
- Verificar que owner_ata corresponde ao owner e ao mint correto

**Critério de Aceitação:**
- Cancel devolve 100% dos fundos (SOL + todos os SPL tokens) ao owner
- Teste de segurança: tentativa de cancel por não-owner falha

### 3.4 Gap 4: Verificação Ed25519 Real no Heartbeat 🔴 BLOQUEANTE

**Problema:** `heartbeat.rs` contém um placeholder que sempre retorna `true`:
```rust
fn verify_ed25519_signature(...) -> bool { true }
```

**Tarefas:**
- [ ] Implementar verificação via **instruction sysvar** + `Ed25519Program`
  1. Keeper monta transação com instrução `Ed25519Program` antes do heartbeat
  2. Heartbeat lê `solana_program::sysvar::instructions` e valida dados da assinatura
  3. Verificar que pubkey no proof == `vault.owner`
  4. Verificar que mensagem == `heartbeat:{vault_address}:{timestamp}`
- [ ] Remover placeholder e implementar validação real
- [ ] Atualizar keeper para montar transação correta com Ed25519Program
- [ ] Testar: heartbeat com assinatura válida funciona; heartbeat com assinatura inválida falha

**Segurança:**
- Timestamp deve estar dentro de `±5 minutos` do `Clock::get()`
- Vault address na mensagem deve corresponder ao vault da instrução
- O executor (keeper) não precisa ser confiável — a assinatura prova que o owner está vivo

**Critério de Aceitação:**
- Modalidade A (owner direto) funciona
- Modalidade B (keeper + proof) funciona com assinatura válida
- Modalidade B falha com assinatura inválida (teste de segurança)

### 3.5 Gap 5: Rent-Exempt e Constantes de Mainnet 🟡 ALTA

**Problema:**
- `rent_exempt_min` é um valor fixo chutado (1_000_000 lamports = 0.001 SOL)
- `MIN_INACTIVITY_PERIOD` = 60 segundos (configuração de devnet/teste)

**Tarefas:**
- [ ] Substituir `rent_exempt_min` fixo por cálculo dinâmico via `Rent::get()` quando possível, ou aumentar para valor seguro (~0.01 SOL)
- [ ] Criar feature `mainnet` ou constante de compilação para `MIN_INACTIVITY_PERIOD`
- [ ] Valor de produção: `30 * 24 * 60 * 60` (30 dias)
- [ ] Valor de teste: manter 60 segundos para devnet
- [ ] Documentar claramente no código qual valor é de teste vs. produção

**Critério de Aceitação:**
- Build com feature de mainnet usa 30 dias
- Build padrão (devnet) mantém 60 segundos para testes
- Rent-exempt é suficiente para manter a conta ativa

### 3.6 Gap 6: Testes de Segurança e Edge Cases 🟡 ALTA

**Problema:** Os testes atuais cobrem apenas o happy path. Não há testes para cenários de ataque.

**Tarefas:**
- [ ] Teste: claim com timer ainda não expirado (deve falhar com `TimerNotExpired`)
- [ ] Teste: heartbeat com assinatura inválida (deve falhar com `InvalidHeartbeatSignature`)
- [ ] Teste: deposit de token não-SPL (deve falhar)
- [ ] Teste: claim com percentuais não somando 100% (deve falhar no init)
- [ ] Teste: cancel após timer expirado (deve falhar)
- [ ] Teste: tentativa de reinitialize vault (deve falhar)
- [ ] Teste: update_config por não-owner (deve falhar com `Unauthorized`)
- [ ] Teste: claim com 10 herdeiros e 5 assets (limite máximo)
- [ ] Teste: overflow de math (valores muito grandes)
- [ ] Teste: keeper fee > 0 e distribuição correta

**Critério de Aceitação:**
- >90% cobertura de código do programa
- Todos os testes de segurança passam

---

## 4. Sprint 2: Supabase — Segurança, RLS e Migrações

**Objetivo:** Hardenar completamente o banco de dados antes de expor APIs ao público.

**Dependências:** Nenhuma (pode rodar em paralelo com Sprint 1)

**Estimativa:** 3-5 dias

### 4.1 Problemas de Segurança Identificados

| Problema | Severidade | Descrição |
|----------|------------|-----------|
| RLS sem policies | 🔴 Alta | 7 tabelas com RLS habilitado mas sem policies — API client-side inutilizável |
| Views SECURITY DEFINER | 🔴 Alta | `vaults_expiring_soon` e `vaults_expired` bypassam RLS |
| search_path mutable | 🟡 Média | Functions `update_updated_at_column` e `update_vault_expires_at` |
| Zero migrações | 🟡 Média | Schema criado manualmente; não replicável em prod |

### 4.2 Tarefas

#### 4.2.1 Criar Migrações Versionadas
- [ ] Exportar schema atual para arquivo SQL inicial (`001_initial_schema.sql`)
- [ ] Incluir todas as tabelas: `vaults`, `heirs`, `vault_assets`, `notification_preferences`, `notification_logs`, `claim_executions`, `heartbeat_logs`
- [ ] Incluir views: `vaults_expiring_soon`, `vaults_expired`
- [ ] Incluir functions: `update_updated_at_column`, `update_vault_expires_at`
- [ ] Incluir triggers
- [ ] Versionar no repositório Git (`keeper/src/db/migrations/`)

#### 4.2.2 Implementar RLS Policies

Para cada tabela, criar policies que respeitem o modelo de negócio:

**Tabela `vaults`:**
- `SELECT`: público (qualquer um pode ver vaults ativos)
- `INSERT`: service_role only (keeper)
- `UPDATE`: service_role only (keeper)
- `DELETE`: ninguém (soft delete via status)

**Tabela `heirs`:**
- `SELECT`: público (herdeiros precisam ver seus dados)
- `INSERT/UPDATE/DELETE`: service_role only

**Tabela `vault_assets`:**
- `SELECT`: público
- `INSERT/UPDATE/DELETE`: service_role only

**Tabela `notification_preferences`:**
- `SELECT`: owner do vault (via join) ou service_role
- `INSERT/UPDATE/DELETE`: owner do vault ou service_role

**Tabela `notification_logs`:**
- `SELECT`: service_role only
- `INSERT`: service_role only

**Tabela `claim_executions`:**
- `SELECT`: público (transparência)
- `INSERT`: service_role only

**Tabela `heartbeat_logs`:**
- `SELECT`: público
- `INSERT`: service_role only

#### 4.2.3 Corrigir Views
- [ ] Alterar `vaults_expiring_soon` e `vaults_expired` para `SECURITY INVOKER`
- [ ] Adicionar `SET search_path = public` nas views

#### 4.2.4 Corrigir Functions
- [ ] Alterar `update_updated_at_column` para `SET search_path = public`
- [ ] Alterar `update_vault_expires_at` para `SET search_path = public`

**Critério de Aceitação:**
- Supabase Advisor não reporta nenhum erro de segurança
- Keeper conecta e opera corretamente via service_role
- Frontend pode fazer SELECTs via anon key sem erro 403
- Migrações aplicam o schema corretamente em um banco limpo

---

## 5. Sprint 3: Keeper — Integração Final e Testes

**Objetivo:** Finalizar a integração do keeper com o contrato corrigido e o Supabase hardenado.

**Dependências:** Sprint 1 (contrato corrigido) + Sprint 2 (Supabase hardenado)

**Estimativa:** 1 semana

### 5.1 Tarefas

#### 5.1.1 Atualizar Keeper para Contrato Corrigido
- [ ] Atualizar IDL no keeper (`src/services/idl/crypto_heranca.json`)
- [ ] Implementar suporte a Modalidade B de heartbeat (montar transação com Ed25519Program)
- [ ] Implementar submissão de claim com remaining accounts dinâmicos (herdeiros + ATAs)
- [ ] Implementar monitoramento de vaults com SPL tokens (ler saldo de tokens, não só SOL)

#### 5.1.2 Implementar Sincronização On-Chain ↔ Supabase
- [ ] Backfill: sincronizar todos os vaults existentes do on-chain para o Supabase
- [ ] Sync contínuo: listener de eventos do programa → insert/update no Supabase
  - Evento `VaultCreated` → insert em `vaults` + `heirs`
  - Evento `Deposit` → update em `vault_assets`
  - Evento `HeartbeatReset` → update `last_heartbeat` em `vaults`
  - Evento `ClaimExecuted` → insert em `claim_executions`, update `vaults.status`
  - Evento `VaultCancelled` → update `vaults.status`

#### 5.1.3 Implementar Jobs de Monitoramento
- [ ] Job a cada 5 minutos: verificar vaults ativos, calcular `expires_at`
- [ ] Job a cada 5 minutos: para vaults expirados, montar e submeter transação `claim`
- [ ] Job diário: verificar vaults expirando em 30/7/1 dias → disparar notificações
- [ ] Job pós-claim: notificar herdeiros via email/telegram
- [ ] Tratar race conditions (vault já claimed por outro keeper)

#### 5.1.4 Implementar API REST Completa
- [ ] `POST /api/v1/heartbeat` — receber proof, validar, submeter on-chain
- [ ] `GET /api/v1/vaults/:vault_address/status` — estado indexado do Supabase
- [ ] `POST /api/v1/notifications/register` — registrar email/telegram
- [ ] Rate limiting: 10 req/min por IP
- [ ] Validação de inputs com Zod
- [ ] Middleware de autenticação (API key para keeper ops)

#### 5.1.5 Testes do Keeper
- [ ] Testes unitários dos serviços (mocks de RPC)
- [ ] Testes de integração da API (supertest)
- [ ] Teste e2e: submeter heartbeat via API e verificar on-chain
- [ ] Teste e2e: simular vault expirado e verificar claim automático

**Critério de Aceitação:**
- >80% cobertura de testes no keeper
- Claims expirados são executados automaticamente dentro de 5 minutos
- API responde corretamente; rate limit funciona
- Supabase reflete estado on-chain em tempo real

---

## 6. Sprint 4: Frontend — Integrações e UX

**Objetivo:** Completar as integrações do frontend com o contrato, keeper e Supabase.

**Dependências:** Sprint 1 (IDL atualizado) + Sprint 2 (Supabase com RLS) + Sprint 3 (keeper com APIs completas)

**Estimativa:** 1-2 semanas

### 6.1 Tarefas

#### 6.1.1 Setup e Configuração
- [ ] Atualizar IDL no frontend (tipos gerados do Anchor)
- [ ] Configurar cliente Supabase (`@supabase/supabase-js`)
- [ ] Configurar cliente Solana (`@solana/web3.js`)
- [ ] Setup TanStack Query para cache de dados

#### 6.1.2 Páginas Principais
- [ ] **Landing Page:** Hero, explicação do produto, CTA conectar carteira
- [ ] **Dashboard:**
  - Lista de vaults do usuário (fetch do Supabase — mais rápido que RPC)
  - Saldos (SOL + tokens)
  - Timer de inatividade com contagem regressiva visual
  - Indicador de status (Ativo / Expirado / Claimed)
- [ ] **Criar Herança:**
  - Wizard multi-step (período → herdeiros → revisar → confirmar)
  - Validação em tempo real (percentuais somando 100%, endereços válidos)
  - Preview da transação antes de assinar
- [ ] **Gerenciar Vault:**
  - Visualizar timer, depositar SOL/tokens, heartbeat, editar config, cancelar
  - Listar herdeiros e alocações
- [ ] **Claim (Herdeiro):**
  - Interface para herdeiros verem e resgatarem heranças
  - Mostrar saldo disponível por asset

#### 6.1.3 Integração com Smart Contract
- [ ] Implementar hooks para cada instrução:
  - `useInitializeVault`, `useDepositSol`, `useDepositToken`, `useHeartbeat`, `useClaim`, `useCancelVault`, `useUpdateConfig`
- [ ] Implementar leitura de vaults (`useVault`, `useVaultsByOwner`)
- [ ] Lidar com confirmação de transações (loading, sucesso, erro)
- [ ] Simular transações antes de assinar (mostrar preview ao usuário)

#### 6.1.4 Integração com Keeper (Heartbeat Gasless)
- [ ] Implementar `useGaslessHeartbeat` hook
- [ ] Gerar mensagem off-chain, assinar com wallet do owner
- [ ] Enviar para API do keeper (`POST /api/v1/heartbeat`)
- [ ] Polling de status até confirmação on-chain
- [ ] Fallback: se keeper falhar, oferecer heartbeat on-chain (Modalidade A)

#### 6.1.5 Supabase Realtime
- [ ] Inscrever em canal `vault_updates` do Supabase Realtime
- [ ] Atualizar timer do dashboard em tempo real (sem polling)
- [ ] Notificar usuário quando heartbeat é confirmado
- [ ] Notificar herdeiros quando claim é executado

#### 6.1.6 UI/UX Polida
- [ ] Design responsivo (mobile-first)
- [ ] Timer visual (contagem regressiva animada)
- [ ] Formulários com validação em tempo real (Zod no cliente)
- [ ] Toasts/notificações para ações (sucesso/erro)
- [ ] Empty states e loading skeletons
- [ ] Tratamento de erros da blockchain com mensagens amigáveis

**Critério de Aceitação:**
- Todas as páginas navegáveis com dados reais on-chain
- Transações submetidas com sucesso
- UX de loading/erro clara
- Timer atualiza em tempo real

---

## 7. Sprint 5: Testes End-to-End e Stress

**Objetivo:** Validar todo o fluxo do sistema em condições realistas.

**Dependências:** Sprint 1, 2, 3, 4

**Estimativa:** 1 semana

### 7.1 Tarefas

#### 7.1.1 Cenários de Teste E2E
- [ ] **Cenário 1 (Happy Path SOL):**
  Criar vault → depositar 1 SOL → heartbeat → esperar timer → claim → herdeiros recebem SOL
- [ ] **Cenário 2 (Happy Path SPL):**
  Criar vault → depositar 500 USDC → heartbeat → esperar timer → claim → herdeiros recebem USDC
- [ ] **Cenário 3 (Múltiplos Assets):**
  Criar vault → depositar SOL + USDC + outro token → claim → distribuição correta por asset
- [ ] **Cenário 4 (Múltiplos Herdeiros):**
  Criar vault com 10 herdeiros → depositar → claim → todos recebem corretamente
- [ ] **Cenário 5 (Mix Fixed + Percentage):**
  Herdeiro 1: FixedAmount 100 USDC, Herdeiro 2: Percentage 50%, Herdeiro 3: Percentage 50%
- [ ] **Cenário 6 (Cancel):**
  Criar vault → depositar SOL + USDC → cancel → owner recebe tudo de volta
- [ ] **Cenário 7 (Keeper offline):**
  Timer expira, keeper não executa → owner faz heartbeat on-chain (Modalidade A)
- [ ] **Cenário 8 (Heartbeat gasless):**
  Owner assina proof off-chain → keeper submite → timer reseta

#### 7.1.2 Testes de Stress
- [ ] Criar 100 vaults simultâneos
- [ ] Monitorar keeper: consumo de CPU, memória, latência de RPC
- [ ] Testar com rede congestionada (usar priority fees)
- [ ] Verificar que o Supabase aguenta a carga de sync

#### 7.1.3 Testes de Segurança
- [ ] Tentativa de claim antes do timer expirar
- [ ] Tentativa de heartbeat com assinatura inválida
- [ ] Tentativa de cancel por não-owner
- [ ] Tentativa de update_config por não-owner
- [ ] Tentativa de reinitialize vault
- [ ] Tentativa de deposit com token inválido
- [ ] Tentativa de claim duplicado (race condition)

**Critério de Aceitação:**
- Todos os cenários principais passam
- Sistema funciona com 100 vaults simultâneos
- Nenhuma vulnerabilidade crítica nos testes de segurança

---

## 8. Sprint 6: Auditoria de Segurança e Deploy Mainnet

**Objetivo:** Submeter o código a auditoria externa e fazer deploy seguro na mainnet.

**Dependências:** Sprint 5 (todos os testes passam)

**Estimativa:** 1-2 semanas

### 8.1 Tarefas

#### 8.1.1 Pré-Auditoria Interna
- [ ] Revisar código com checklist de segurança (ver Seção 9)
- [ ] Rodar `cargo audit` para dependências Rust
- [ ] Rodar `npm audit` para dependências Node.js
- [ ] Revisar manualmente: aritmética, validações de conta, PDA seeds, close constraints
- [ ] Documentar todas as decisões de segurança no código (comentários)

#### 8.1.2 Auditoria Externa (Recomendado)
- [ ] Contratar auditoria com **OtterSec**, **Neodyme** ou **CertiK**
- [ ] Escopo: smart contract Rust (foco em claim, heartbeat, cancel)
- [ ] Prazo: 1-2 semanas
- [ ] Corrigir todas as vulnerabilidades críticas e altas antes do deploy

#### 8.1.3 Deploy Devnet Final
- [ ] Deploy do programa corrigido na devnet
- [ ] Deploy do keeper (Railway/Render)
- [ ] Deploy do frontend (Vercel preview)
- [ ] Testar integração completa com dados reais na devnet
- [ ] Convidar beta testers

#### 8.1.4 Deploy Mainnet
- [ ] Deploy do programa na mainnet (**imutável** — verificar Program ID)
- [ ] Transferir autoridade do programa para uma multisig (Squads) ou burn
- [ ] Atualizar frontend com Program ID mainnet
- [ ] Deploy do keeper em produção (infra redundante)
- [ ] Configurar monitoramento:
  - Logs estruturados (Winston/Pino)
  - Alertas (PagerDuty/Telegram) para keeper offline
  - Métricas de performance (Prometheus/Grafana)
  - Health checks da API

#### 8.1.5 Documentação e Handoff
- [ ] README do projeto (instalação, desenvolvimento, deploy)
- [ ] Documentação da API do keeper (OpenAPI/Swagger)
- [ ] Guia do usuário (como usar o dApp)
- [ ] Runbook de operações (monitoramento, troubleshooting, rollback)
- [ ] Documento de arquitetura de segurança

**Critério de Aceitação:**
- Programa deployado e imutável na mainnet
- Auditoria externa aprovada (sem vulnerabilidades críticas)
- Sistema monitorado 24/7
- Documentação completa

---

## 9. Checklist de Segurança Pré-Mainnet

> **Este checklist deve ser completado e assinado antes de qualquer deploy na mainnet.**

### Smart Contract
- [ ] `claim` distribui SOL + todos os SPL tokens corretamente
- [ ] `initialize_token_account` adiciona mint a `vault.assets`
- [ ] `deposit_token` funciona sem `AssetNotFound`
- [ ] `cancel_vault` devolve SOL + todos os SPL tokens ao owner
- [ ] Heartbeat Modalidade B verifica assinatura Ed25519 real (instruction sysvar)
- [ ] Não há placeholder `true` em nenhuma validação de segurança
- [ ] `MIN_INACTIVITY_PERIOD` = 30 dias (não 60 segundos)
- [ ] Rent-exempt é calculado corretamente ou valor é conservador
- [ ] Todos os cálculos usam `checked_math`
- [ ] PDA seeds são únicos e imprevisíveis
- [ ] `close = owner` não deixa fundos presos
- [ ] Eventos são emitidos para todas as operações críticas
- [ ] `has_one = owner` em todas as instruções sensíveis
- [ ] `constraint = vault.is_active()` em todas as instruções mutáveis
- [ ] Limites máximos são respeitados (10 herdeiros, 5 assets, 1% keeper fee)

### Supabase
- [ ] RLS policies criadas para todas as 7 tabelas
- [ ] Views usam `SECURITY INVOKER`
- [ ] Functions têm `SET search_path = public`
- [ ] Schema está versionado em migrações SQL
- [ ] Não há chaves de API expostas no código
- [ ] `service_role` key não está no frontend
- [ ] Dados sensíveis (emails, telefones) não são retornados em queries públicas

### Keeper
- [ ] Rate limiting configurado
- [ ] API key para operações sensíveis
- [ ] Chave privada do keeper não logada
- [ ] Retry com backoff para falhas de RPC
- [ ] Health check endpoint funcional
- [ ] Monitoramento de keeper offline

### Frontend
- [ ] Simulação de transações antes de assinar
- [ ] Validação de inputs no cliente (endereços, valores, percentuais)
- [ ] Tratamento de erros da blockchain com mensagens amigáveis
- [ ] Não expõe chaves de API do Supabase (usa `NEXT_PUBLIC_` apenas para anon key)
- [ ] HTTPS obrigatório em produção

---

## 10. Cronograma Resumido

| Sprint | Duração | Semana | Dependências | Foco |
|--------|---------|--------|--------------|------|
| **Sprint 1: Smart Contract** | 1-2 semanas | 1-2 | — | Correção de gaps críticos (SPL tokens, Ed25519, cancel) |
| **Sprint 2: Supabase** | 3-5 dias | 1-2 | — | RLS policies, migrações, views seguras |
| **Sprint 3: Keeper** | 1 semana | 2-3 | Sprint 1 + 2 | Integração final, sync, jobs, testes |
| **Sprint 4: Frontend** | 1-2 semanas | 3-4 | Sprint 1 + 2 + 3 | Integrações, UX, Realtime |
| **Sprint 5: Testes E2E** | 1 semana | 4-5 | Todas | Cenários completos, stress, segurança |
| **Sprint 6: Auditoria + Deploy** | 1-2 semanas | 5-7 | Sprint 5 | Auditoria externa, deploy mainnet |

**Total estimado:** 5-7 semanas (~1.5-2 meses)

**Paralelização sugerida:**
- Semanas 1-2: Smart Contract (gaps) + Supabase (RLS) em paralelo
- Semana 2-3: Keeper (integração) + Frontend (páginas) em paralelo
- Semana 4: Testes E2E (todos os cenários)
- Semanas 5-6: Auditoria externa + correções
- Semana 6-7: Deploy mainnet + monitoramento

---

## 11. Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Bug no smart contract (perda de tokens) | **Crítico** | Média | Auditoria externa obrigatória; testes extensivos; programa imutável só após auditoria; contrato upgradeável (discutir) |
| Heartbeat Modalidade B inseguro (placeholder) | **Crítico** | Alta | Implementar Ed25519Program antes de qualquer deploy; testes de assinatura inválida |
| Keeper fica offline | Alto | Média | Fallback: herdeiros podem chamar claim diretamente; múltiplos keepers podem competir; monitoramento 24/7 |
| SPL tokens presos no vault | **Crítico** | Alta | Garantir que claim e cancel devolvem 100% dos tokens; testar com múltiplos assets |
| RLS mal configurado (vazamento de dados) | Alto | Média | Revisar todas as policies; usar Supabase Advisor; testar com anon key |
| Gas muito alto na Solana | Médio | Baixa | Otimizar compute units; usar priority fees; manter limits de herdeiros/assets |
| Usuário perde acesso antes de configurar | Alto | Média | Landing page educativa; incentivar configuração no onboarding; notificações lembrete |
| Depende de infra off-chain (keeper, notificações) | Médio | Média | Arquitetura antifragil: sistema funciona (mais lento) sem keeper; notificações são opcionais |
| Rent-exempt insuficiente | Médio | Baixa | Calcular dinamicamente ou usar valor conservador; testar em mainnet antes de produção |

---

## 12. Próximos Passos Imediatos (Hoje)

1. **Implementar distribuição de SPL tokens na `claim`** (Gap 1)
2. **Fix `initialize_token_account` para registrar mint em `vault.assets`** (Gap 2)
3. **Criar RLS policies no Supabase** (mínimo viável para frontend funcionar)
4. **Implementar verificação Ed25519 real no heartbeat** (remover placeholder)
5. **Criar primeira migração SQL versionada** do schema existente

---

*Plano reescrito em 2026-04-30 após análise do estado real do código no WSL (`~/crypto-heranca-build`) e do schema do Supabase. Este plano substitui completamente o plano anterior (`2026-04-24-crypto-heranca-plan.md`).*
