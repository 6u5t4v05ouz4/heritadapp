# Plano de Implementação — Crypto-Herança

**Data:** 2026-04-24  
**Baseado no spec:** `docs/superpowers/specs/2026-04-23-crypto-heranca-arquitetura.md`  
**Status:** Aprovado para execução

---

## 1. Visão Geral do Plano

Este plano divide a implementação do Crypto-Herança em **5 fases sequenciais**, com dependências claras entre elas. Cada fase possui entregáveis definidos, critérios de aceitação e estimativa de esforço.

### Ordem de Execução

```
Fase 1: Smart Contract Anchor (fundamento)
    ↓
Fase 2: Keeper / Bot Off-Chain (infraestrutura)
    ↓
Fase 3: dApp Frontend (interface do usuário)
    ↓
Fase 4: Serviço de Notificações (lembretes)
    ↓
Fase 5: Integração, Testes e Deploy (consolidação)
```

---

## 2. Stack Tecnológica

### 2.1 Smart Contract
- **Framework:** Anchor 0.31+ (default pela maturidade e IDL)
- **Linguagem:** Rust 1.75+
- **Token Program:** SPL Token (classic) + Token-2022 compatibilidade futura
- **Testing:** LiteSVM (unit tests rápidos), `anchor test` (e2e), Mollusk (fuzzing de instruções)
- **Deployment:** Solana CLI + Anchor deploy (devnet → mainnet)

### 2.2 Keeper / Bot
- **Runtime:** Node.js 20+ LTS
- **Linguagem:** TypeScript 5.3+
- **Framework:** Express.js (API REST) ou Fastify
- **Cliente Solana:** `@solana/kit` (moderno, tree-shakeable)
- **Banco de Dados:** Supabase (PostgreSQL + Realtime + Auth)
  - PostgreSQL para persistência de vaults indexados, herdeiros e notificações
  - Supabase Realtime para websockets (atualizações de timer em tempo real no dApp)
  - Row Level Security (RLS) para proteger dados sensíveis
- **Scheduling:** `node-cron` (jobs periódicos do keeper)
- **Deploy:** Docker + Docker Compose (local/dev) → Railway/Render (prod) ou serverless (Vercel Functions para APIs leves)
- **Cliente Supabase:** `@supabase/supabase-js` (no keeper e no dApp para queries diretas)

### 2.3 dApp Frontend
- **Framework:** Next.js 14+ (App Router)
- **Linguagem:** TypeScript 5.3+
- **Estilização:** Tailwind CSS 3.4+ + shadcn/ui
- **Wallet:** `@solana/react-hooks` + Wallet Standard (framework-kit first)
- **Cliente:** `@solana/kit` + `@solana-program/*` instruction builders
- **Estado:** TanStack Query (React Query) para cache RPC
- **Deploy:** Vercel (recomendado para Next.js)

### 2.4 Notificações
- **Runtime:** Node.js 20+ (pode ser integrado ao keeper ou serviço separado)
- **Email:** Resend ou SendGrid
- **Telegram:** Bot API via `node-telegram-bot-api`
- **SMS:** Twilio (opcional, futuro)
- **Scheduling:** Integrado ao cron do keeper

---

## 3. Fase 1: Smart Contract Anchor

**Objetivo:** Implementar o programa Solana completo com todas as instruções, testes e segurança.

**Dependências:** Nenhuma (primeira fase)

**Estimativa:** 3-4 semanas (1 desenvolvedor senior Rust/Anchor)

### 3.1 Estrutura do Projeto

```
programs/crypto_heranca/
├── src/
│   ├── lib.rs              # Entrypoint + declare_id
│   ├── instructions/
│   │   ├── initialize_vault.rs
│   │   ├── deposit_sol.rs
│   │   ├── deposit_token.rs
│   │   ├── heartbeat.rs
│   │   ├── claim.rs
│   │   ├── update_config.rs
│   │   └── cancel_vault.rs
│   ├── state/
│   │   ├── vault.rs        # Struct Vault + Heir
│   │   └── mod.rs
│   ├── errors.rs           # Custom error codes
│   ├── events.rs           # Anchor events
│   └── utils.rs            # Helpers (math, validation)
├── tests/
│   ├── test_initialize.rs
│   ├── test_deposit.rs
│   ├── test_heartbeat.rs
│   ├── test_claim.rs
│   ├── test_security.rs    # Tentativas de ataque
│   └── test_edge_cases.rs
├── Cargo.toml
└── Xargo.toml
```

### 3.2 Tarefas Detalhadas

#### **Tarefa 1.1: Setup do Projeto Anchor**
- [ ] Instalar Anchor CLI 0.31+ e AVM
- [ ] Configurar workspace (`Anchor.toml`, `Cargo.toml` raiz)
- [ ] Configurar Rust toolchain (`rustfmt`, `clippy`)
- [ ] Criar estrutura de diretórios
- [ ] Configurar CI básico (GitHub Actions: build + test)

**Critério de Aceitação:** `anchor build` executa sem erros.

#### **Tarefa 1.2: Definição de State (Structs)**
- [ ] Implementar `Vault` struct com todos os campos (owner, last_heartbeat, inactivity_period, heirs Vec, assets Vec, keeper_fee_bps, gas_reserve_lamports, status, created_at)
- [ ] Implementar `Heir` struct (wallet, asset, allocation_type, allocation_value)
- [ ] Definir enums: `VaultStatus`, `AllocationType`
- [ ] Calcular `INIT_SPACE` corretamente (8 discriminador + campos)

**Segurança:**
- Validar que `Vec<Heir>` tem limite máximo (10 elementos)
- Validar que `Vec<Pubkey> assets` tem limite máximo (5 elementos)
- Validar que `keeper_fee_bps <= 100` (1% máximo)

**Critério de Aceitação:** Account serialization/deserialization funciona; espaço calculado correto.

#### **Tarefa 1.3: Instrução `initialize_vault`**
- [ ] Implementar contexto com PDA derivation (`seeds = [b"vault", owner.key().as_ref(), &seed.to_le_bytes()]`)
- [ ] Validar `gas_reserve_lamports >= MIN_GAS_RESERVE` (0.01 SOL)
- [ ] Inicializar Vault com dados fornecidos
- [ ] Emitir evento `VaultCreated`

**Segurança:**
- `init` constraint (previne reinitialization)
- Validar que `inactivity_period >= MIN_PERIOD` (ex: 30 dias) e `<= MAX_PERIOD` (ex: 2 anos)
- Validar que todos os `Heir.wallet` são endereços válidos (não zero)
- Se `AllocationType::Percentage`, validar que soma = 10000 por asset

**Critério de Aceitação:** Vault criado com sucesso; PDA endereço derivado corretamente; evento emitido.

#### **Tarefa 1.4: Instruções `deposit_sol` e `deposit_token`**
- [ ] `deposit_sol`: Transferir SOL via `system_program::transfer` para o vault PDA
- [ ] `deposit_token`: Verificar/criar ATA do vault para o mint; transferir SPL tokens
- [ ] Atualizar `vault.assets` se o mint ainda não estiver na lista
- [ ] Emitir evento `Deposit`

**Segurança:**
- Validar que o token mint é um SPL Token válido
- Para `deposit_token`, usar `associated_token::create_if_needed` (cuidado: não é `init_if_needed` do Anchor, que tem riscos)
- Verificar que o depositante possui saldo suficiente

**Critério de Aceitação:** Saldos atualizados corretamente; ATAs criadas sob demanda.

#### **Tarefa 1.5: Instrução `heartbeat` (Modalidade A + B)**
- [ ] **Modalidade A:** Verificar `tx.signer == vault.owner`; atualizar `last_heartbeat`
- [ ] **Modalidade B:** Ler `instruction sysvar`; verificar instrução do `Ed25519Program`; validar assinatura, mensagem e pubkey
- [ ] Transferir `gas_reserve_lamports` (ou valor fixo menor) para o executor como reembolso
- [ ] Emitir evento `HeartbeatReset`

**Segurança:**
- Para Modalidade B, reconstruir mensagem on-chain: `heartbeat:vault_address:timestamp`
- Validar que timestamp não está muito no futuro (ex: <= current_time + 60s) nem no passado (ex: >= current_time - 300s)
- Verificar que `Ed25519Program` é o programa nativo correto (`solana_program::ed25519_program::ID`)

**Critério de Aceitação:** Ambas modalidades funcionam; assinatura inválida é rejeitada; evento emitido.

#### **Tarefa 1.6: Instrução `claim`**
- [ ] Verificar `status == Active` e timer expirado
- [ ] Iterar sobre `vault.assets` (máx 5)
- [ ] Para cada asset, agrupar herdeiros e calcular distribuição:
  - FixedAmount primeiro (mínimo entre valor e saldo)
  - Percentage sobre remanescente
  - Sobra por arredondamento → primeiro herdeiro do asset
  - Asset sem herdeiros → primeiro herdeiro geral
- [ ] Criar ATAs dos herdeiros se necessário (pagas pelo vault)
- [ ] Transferir fee do keeper (`keeper_fee_bps`)
- [ ] Transferir reembolso de gas (`gas_reserve_lamports`)
- [ ] Atualizar `status = Claimed`
- [ ] Emitir eventos `ClaimExecuted` por transferência

**Segurança:**
- Verificar que `remaining_accounts` contém as ATAs necessárias
- Validar que ATAs passadas correspondem ao vault/herdeiros corretos
- Usar `checked_math` para todos os cálculos
- Limitar compute units se necessário

**Critério de Aceitação:** Distribuição correta para todos os herdeiros; fee e reembolso transferidos; status atualizado.

#### **Tarefa 1.7: Instruções `update_config` e `cancel_vault`**
- [ ] `update_config`: Owner assina; validar novos herdeiros/percentuais; atualizar vault
- [ ] `cancel_vault`: Owner assina; verificar timer não expirou; devolver todos os fundos para owner; fechar vault (close constraint)
- [ ] Emitir eventos apropriados

**Segurança:**
- `has_one = owner` constraint
- Em `cancel_vault`, validar `current_timestamp <= last_heartbeat + inactivity_period`
- Transferir todos os SPL tokens e SOL de volta

**Critério de Aceitação:** Configuração atualizada; cancelamento libera todos os fundos.

#### **Tarefa 1.8: Testes Unitários (LiteSVM)**
- [ ] Setup de testes com LiteSVM (rápido, in-process)
- [ ] Testes de happy path para cada instrução
- [ ] Testes de edge cases:
  - Claim com timer ainda não expirado (deve falhar)
  - Heartbeat com assinatura inválida (deve falhar)
  - Deposit com token não-SPL (deve falhar)
  - Claim com percentuais não somando 100% (deve falhar no init)
  - Cancel após timer expirado (deve falhar)
- [ ] Testes de segurança:
  - Tentativa de reinitialize vault (deve falhar)
  - Tentativa de claim por conta não-herdeira (deve funcionar, mas fundos vão para herdeiros)
  - Tentativa de update_config por não-owner (deve falhar)

**Critério de Aceitação:** >90% cobertura de código; todos os testes passam.

#### **Tarefa 1.9: Testes de Integração (anchor test)**
- [ ] Teste e2e: criar vault → depositar → heartbeat → esperar timer → claim
- [ ] Teste com múltiplos herdeiros e múltiplos assets
- [ ] Teste de Modalidade B (heartbeat via keeper proof)
- [ ] Teste de limites: 10 herdeiros, 5 assets

**Critério de Aceitação:** Todos os cenários principais passam no local validator.

#### **Tarefa 1.10: IDL e Client Generation**
- [ ] Gerar IDL com `anchor build`
- [ ] Gerar client TypeScript com Codama (Kit-native)
- [ ] Criar scripts de deploy (devnet + mainnet)

**Critério de Aceitação:** Client TypeScript funciona; tipos gerados corretamente.

---

## 4. Fase 2: Keeper / Bot Off-Chain

**Objetivo:** Implementar o serviço keeper que monitora vaults, executa heartbeats e claims.

**Dependências:** Fase 1 (contrato deployado na devnet)

**Estimativa:** 2-3 semanas

### 4.1 Estrutura do Projeto

```
keeper/
├── src/
│   ├── index.ts              # Entrypoint
│   ├── server.ts             # Express/Fastify app
│   ├── services/
│   │   ├── solana.ts         # Cliente @solana/kit
│   │   ├── vault_monitor.ts  # Monitoramento de timers
│   │   ├── heartbeat.ts      # Lógica de heartbeat
│   │   └── claim.ts          # Lógica de claim
│   ├── routes/
│   │   └── api.ts            # Endpoints REST
│   ├── db/
│   │   ├── supabase.ts       # Supabase client
│   │   ├── schema.sql        # DDL
│   │   └── models.ts         # Tipos/ORM
│   └── config.ts             # Env vars + validação
├── tests/
│   ├── api.test.ts
│   └── monitor.test.ts
├── Dockerfile
├── docker-compose.yml
└── package.json
```

### 4.2 Tarefas Detalhadas

#### **Tarefa 2.1: Setup e Infraestrutura**
- [ ] Inicializar projeto Node.js/TypeScript
- [ ] Configurar ESLint, Prettier, tsconfig
- [ ] Setup Docker + docker-compose (app) ou usar projeto Supabase local (`supabase start`)
- [ ] Configurar variáveis de ambiente (RPC URL, keeper wallet, db credentials)

**Critério de Aceitação:** Keeper conecta ao Supabase (local ou remoto).

#### **Tarefa 2.2: Cliente Solana (`@solana/kit`)**
- [ ] Conectar ao RPC (devnet → mainnet)
- [ ] Implementar leitura de vaults (fetch all accounts do programa)
- [ ] Implementar parser de dados on-chain (decode account data)
- [ ] Implementar submissão de transações (heartbeat, claim)
- [ ] Implementar listener de eventos (webhook ou polling)

**Critério de Aceitação:** Consegue ler todos os vaults ativos do programa.

#### **Tarefa 2.3: API REST**
- [ ] `POST /api/v1/heartbeat` — receber proof, validar, submeter on-chain
- [ ] `GET /api/v1/vaults/:vault_address/status` — estado indexado
- [ ] `POST /api/v1/notifications/register` — registrar email/telegram
- [ ] Middleware de rate limiting (ex: 10 req/min por IP)
- [ ] Validação de inputs (zod ou joi)

**Segurança:**
- Rate limiting na API
- Validar que a assinatura ed25519 é válida antes de submeter
- Não expor chave privada do keeper em logs

**Critério de Aceitação:** API responde corretamente; rate limit funciona.

#### **Tarefa 2.4: Monitoramento e Execução de Claims**
- [ ] Job periódico (a cada 5 minutos) que verifica todos os vaults ativos
- [ ] Calcular `last_heartbeat + inactivity_period` para cada vault
- [ ] Para timers expirados: montar transação `claim` com remaining accounts
- [ ] Submeter transação e aguardar confirmação
- [ ] Tratar race conditions (vault já claimed por outro keeper)
- [ ] Atualizar banco de dados com status

**Critério de Aceitação:** Claims expirados são executados automaticamente dentro de 5 minutos.

#### **Tarefa 2.5: Banco de Dados (Supabase)**
- [ ] Criar projeto Supabase (local com CLI ou remoto em supabase.com)
- [ ] Criar schema (`vaults`, `heirs`, `notifications`) via migrations SQL
- [ ] Configurar Row Level Security (RLS) — apenas o keeper pode inserir/atualizar; leitura pública para vaults ativos
- [ ] Implementar sincronização inicial (backfill de vaults existentes do on-chain)
- [ ] Implementar sync contínuo (listener de eventos on-chain → insert/update no Supabase)
- [ ] Criar views otimizadas para listar vaults próximos de expirar
- [ ] Configurar Supabase Realtime para canal `vault_updates` (dApp escuta mudanças de timer em tempo real)

**Vantagens do Supabase:**
- **PostgreSQL nativo:** Todas as vantagens de um banco relacional maduro
- **Realtime:** Atualizações push para o frontend sem polling (websockets)
- **RLS:** Segurança em nível de linha — dados sensíveis protegidos por políticas SQL
- **Auth:** Pronto para autenticação de usuários no dApp (opcional, futuro)
- **Storage:** Pode armazenar documentos/comprovantes de herança (futuro)
- **Edge Functions:** Serverless para webhooks do keeper (alternativa ao Express completo)

**Critério de Aceitação:** DB reflete estado on-chain; queries performáticas; Realtime funcionando.

#### **Tarefa 2.6: Testes do Keeper**
- [ ] Testes unitários dos serviços (com mocks de RPC)
- [ ] Testes de integração da API (supertest)
- [ ] Teste e2e: submeter heartbeat via API e verificar on-chain

**Critério de Aceitação:** >80% cobertura; testes passam no CI.

---

## 5. Fase 3: dApp Frontend

**Objetivo:** Interface web para usuários criarem, gerenciarem e monitorarem heranças.

**Dependências:** Fase 1 (IDL gerado) + Fase 2 (API do keeper rodando)

**Estimativa:** 3-4 semanas

### 5.1 Estrutura do Projeto

```
frontend/
├── app/
│   ├── page.tsx              # Landing
│   ├── dashboard/
│   │   └── page.tsx          # Lista de vaults
│   ├── vault/
│   │   └── [id]/
│   │       └── page.tsx      # Gerenciar vault
│   ├── create/
│   │   └── page.tsx          # Wizard criação
│   └── claim/
│       └── page.tsx          # Interface herdeiros
├── components/
│   ├── wallet/
│   │   └── connect.tsx       # Wallet connector
│   ├── vault/
│   │   ├── create-form.tsx
│   │   ├── deposit-form.tsx
│   │   └── heartbeat-btn.tsx
│   └── ui/                   # shadcn components
├── hooks/
│   ├── use-vault.ts          # TanStack Query hooks (Supabase + on-chain)
│   ├── use-anchor.ts         # Program client
│   ├── use-keeper.ts         # API keeper
│   └── use-realtime.ts       # Supabase Realtime subscriptions
├── lib/
│   ├── anchor.ts             # Program setup
│   ├── solana.ts             # @solana/kit utils
│   ├── supabase.ts           # Supabase client
│   └── constants.ts          # Program IDs
├── types/
│   └── index.ts              # Tipos gerados do IDL
├── public/
└── package.json
```

### 5.2 Tarefas Detalhadas

#### **Tarefa 3.1: Setup Next.js + Wallet**
- [ ] Criar projeto Next.js 14+ com App Router
- [ ] Configurar Tailwind + shadcn/ui
- [ ] Instalar `@solana/react-hooks` e wallet adapters
- [ ] Configurar `@solana/kit` para RPC
- [ ] Setup TanStack Query
- [ ] Configurar `@supabase/supabase-js` para queries e Realtime

**Critério de Aceitação:** App roda localmente; wallet connect funciona.

#### **Tarefa 3.2: Páginas Principais**
- [ ] **Landing Page:** Hero, explicação do produto, CTA conectar carteira
- [ ] **Dashboard:** Lista de vaults do usuário (fetch do Supabase — mais rápido que RPC on-chain), saldos, timers. Usa Supabase Realtime para atualizações ao vivo.
- [ ] **Criar Herança:** Wizard multi-step (período → herdeiros → revisar → confirmar)
- [ ] **Gerenciar Vault:** Visualizar timer, depositar, heartbeat, editar, cancelar
- [ ] **Claim (Herdeiro):** Interface para herdeiros verem e resgatarem heranças

**Critério de Aceitação:** Todas as páginas navegáveis; dados reais on-chain.

#### **Tarefa 3.3: Integração com Smart Contract**
- [ ] Gerar cliente TypeScript do IDL (Codama)
- [ ] Implementar hooks para cada instrução:
  - `useInitializeVault`, `useDeposit`, `useHeartbeat`, `useClaim`, `useCancel`
- [ ] Implementar leitura de vaults (`useVault`, `useVaultsByOwner`)
- [ ] Lidar com confirmação de transações e estados de loading/erro

**Segurança:**
- Simular transações antes de assinar (mostrar preview ao usuário)
- Validar inputs no cliente (endereços, valores, percentuais)
- Tratar erros da blockchain com mensagens amigáveis

**Critério de Aceitação:** Transações submetidas com sucesso; UX de loading/erro clara.

#### **Tarefa 3.4: Integração com Keeper (Heartbeat Gasless)**
- [ ] Implementar `useGaslessHeartbeat` hook
- [ ] Gerar mensagem off-chain, assinar com wallet
- [ ] Enviar para API do keeper
- [ ] Polling de status até confirmação on-chain
- [ ] Fallback: se keeper falhar, oferecer heartbeat on-chain (Modalidade A)

**Critério de Aceitação:** Heartbeat gasless funciona; fallback disponível.

#### **Tarefa 3.5: Supabase Realtime (Atualizações ao Vivo)**
- [ ] Inscrever em canal `vault_updates` do Supabase Realtime
- [ ] Atualizar timer do dashboard em tempo real (sem polling)
- [ ] Notificar usuário quando um heartbeat é confirmado
- [ ] Notificar herdeiros quando um claim é executado

**Critério de Aceitação:** Timer atualiza em tempo real; notificações push funcionam.

#### **Tarefa 3.6: UI/UX Polida**
- [ ] Design responsivo (mobile-first)
- [ ] Timer visual (contagem regressiva)
- [ ] Formulários com validação em tempo real
- [ ] Toasts/notificações para ações (sucesso/erro)
- [ ] Empty states e loading skeletons

**Critério de Aceitação:** UI profissional; feedback claro para todas as ações.

---

## 6. Fase 4: Serviço de Notificações

**Objetivo:** Enviar lembretes e alertas para usuários e herdeiros.

**Dependências:** Fase 2 (keeper rodando com banco de dados)

**Estimativa:** 1 semana

### 6.1 Tarefas

#### **Tarefa 4.1: Setup de Canais**
- [ ] Configurar conta Resend (email)
- [ ] Configurar bot Telegram (BotFather)
- [ ] Criar templates de mensagens:
  - Lembretes de timer (30d, 7d, 1d)
  - Confirmação de claim
  - Alerta de cancelamento

#### **Tarefa 4.2: Jobs de Notificação (no Keeper)**
- [ ] Job diário: consultar Supabase por vaults com timer expirando em 30/7/1 dias
- [ ] Enviar notificações para owners registrados (lendo emails/telegram IDs do Supabase)
- [ ] Job pós-claim: notificar herdeiros (usando dados do Supabase)
- [ ] Registrar histórico de envios no Supabase (tabela `notification_logs` para evitar spam)

#### **Tarefa 4.3: Integração no dApp**
- [ ] Tela de configuração de notificações (email/telegram)
- [ ] Salvar preferências no Supabase (tabela `notifications`)

**Critério de Aceitação:** Notificações enviadas nos prazos corretos; sem spam.

---

## 7. Fase 5: Integração, Testes e Deploy

**Objetivo:** Juntar tudo, testar end-to-end e subir para produção.

**Dependências:** Todas as fases anteriores

**Estimativa:** 2 semanas

### 7.1 Tarefas

#### **Tarefa 5.1: Testes End-to-End**
- [ ] Cenário completo: criar vault → depositar → heartbeat → esperar → claim
- [ ] Teste com múltiplos herdeiros e tokens
- [ ] Teste de stress: 100 vaults, monitoramento do keeper
- [ ] Teste de falha: keeper offline, usuário faz heartbeat on-chain

#### **Tarefa 5.2: Deploy Devnet**
- [ ] Deploy do programa na devnet
- [ ] Deploy do keeper ( Railway / Render / VPS)
- [ ] Deploy do frontend (Vercel preview)
- [ ] Testar integração completa na devnet

#### **Tarefa 5.3: Auditoria de Segurança (Pré-Mainnet)**
- [ ] Revisar código com checklist de segurança (Seção 2 do spec)
- [ ] Rodar `cargo audit` para dependências
- [ ] Considerar contratar auditoria externa (OtterSec/Neodyme) — **recomendado antes de mainnet**

#### **Tarefa 5.4: Deploy Mainnet**
- [ ] Deploy do programa na mainnet (imutável)
- [ ] Atualizar frontend com Program ID mainnet
- [ ] Deploy do keeper em produção
- [ ] Configurar monitoramento (logs, alerts, métricas)

#### **Tarefa 5.5: Documentação e Handoff**
- [ ] README do projeto (instalação, desenvolvimento, deploy)
- [ ] Documentação da API do keeper (OpenAPI/Swagger)
- [ ] Guia do usuário (como usar o dApp)
- [ ] Runbook de operações (monitoramento, troubleshooting)

---

## 8. Cronograma Resumido

| Fase | Duração | Semana | Dependências |
|------|---------|--------|--------------|
| **Fase 1: Smart Contract** | 3-4 semanas | 1-4 | — |
| **Fase 2: Keeper** | 2-3 semanas | 4-6 | Fase 1 |
| **Fase 3: dApp Frontend** | 3-4 semanas | 5-8 | Fase 1, 2 |
| **Fase 4: Notificações** | 1 semana | 7-8 | Fase 2 |
| **Fase 5: Integração + Deploy** | 2 semanas | 9-10 | Todas |

**Total estimado:** 10-12 semanas (2.5-3 meses) com 1 desenvolvedor full-stack senior + possibilidade de paralelização (contrato e frontend podem avançar em paralelo após o IDL estar pronto).

**Paralelização sugerida:**
- Semanas 1-3: Foco 100% no contrato (é o fundamento)
- Semana 4: Contrato (testes finais) + Keeper (setup inicial)
- Semanas 5-6: Keeper (completo) + Frontend (setup + páginas)
- Semanas 7-8: Frontend (integrações) + Notificações
- Semanas 9-10: Testes e2e, deploy devnet, auditoria, deploy mainnet

---

## 9. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Bug no smart contract | **Crítico** — perda de fundos | Auditoria externa obrigatória; testes extensivos; programa imutável só após auditoria |
| Keeper fica offline | Alto — claims não executam | Fallback: herdeiros podem chamar claim diretamente; múltiplos keepers podem competir |
| Gas muito alto na Solana | Médio — operações caras | Otimizar compute units; usar priority fees quando necessário; manter limits de herdeiros/assets |
| Usuário perde acesso antes de configurar | Alto — não adianta ter o produto | Landing page educativa; incentivar configuração logo após onboarding |
| Depende de infra off-chain | Médio — keeper e notificações | Arquitetura antifragil: sistema funciona (mais lento) sem keeper; notificações são opcionais |

---

## 10. Próximos Passos Imediatos

1. **Aprovar este plano de implementação**
2. **Configurar ambiente de desenvolvimento** (Rust, Anchor, Node.js, Docker)
3. **Criar repositório Git** com estrutura inicial
4. **Começar Fase 1** — desenvolvimento do smart contract Anchor

---

*Plano gerado após aprovação do spec de arquitetura. Sujeito a ajustes durante a execução.*
