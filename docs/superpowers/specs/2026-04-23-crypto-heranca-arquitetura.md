# Crypto-Herança — Arquitetura Geral do Sistema

**Data:** 2026-04-23  
**Status:** Rascunho / Em aprovação  
**Escopo:** Smart Contract + dApp + Sistema Off-Chain (Keeper + Notificações)

---

## 1. Visão Geral

O **Crypto-Herança** é um sistema descentralizado na **Solana** que resolve o problema real da herança de ativos digitais. Quando um detentor de criptoativos falece ou perde acesso à sua carteira, seus ativos ficam permanentemente inacessíveis — estima-se que milhões de dólares em BTC, ETH e SOL já foram perdidos assim.

A solução é um **"Dead Man's Switch" (Gatilho de Inatividade)**: o usuário deposita ativos (SOL, USDC, USDT) em um smart contract e configura herdeiros. Ele deve enviar um "sinal de vida" periódico. Se o timer de inatividade expirar, o contrato libera automaticamente os fundos para os herdeiros pré-configurados.

---

## 2. Princípios de Design

| Princípio | Descrição |
|-----------|-----------|
| **Segurança por Isolamento** | Cada usuário tem seu próprio vault (PDA isolado), isolando saldos e configurações. Note: bugs no código do programa ainda podem afetar todos os vaults — por isso auditorias e testes são críticos. |
| **Descentralização** | O contrato funciona sem depender de entidades centralizadas. O keeper é um facilitador, não um ponto único de falha. |
| **UX Acessível** | O usuário comum não precisa entender de blockchain. Clicar "Estou vivo" deve ser trivial. |
| **Transparência** | Toda configuração, saldo e estado do vault é verificável on-chain. |
| **Antifragilidade** | O sistema funciona melhor com o keeper, mas não depende 100% dele. |

---

## 3. Arquitetura de Camadas

O sistema é dividido em **4 camadas independentes** com interfaces bem definidas:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA 4: NOTIFICAÇÕES                       │
│         (Email, Telegram, SMS — Lembretes e Alertas)            │
├─────────────────────────────────────────────────────────────────┤
│                    CAMADA 3: KEEPER / BOT                       │
│  (Monitora timers, executa heartbeats e claims, reembolso gas)  │
├─────────────────────────────────────────────────────────────────┤
│                    CAMADA 2: DAPP FRONTEND                      │
│  (React/Next.js — Conectar carteira, configurar, depositar,     │
│   clicar "Estou vivo", visualizar status)                       │
├─────────────────────────────────────────────────────────────────┤
│                    CAMADA 1: SMART CONTRACT                     │
│  (Solana/Anchor — Factory + Vaults PDAs + Lógica de Herança)    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Camada 1: Smart Contract (Anchor)

### 4.1 Estrutura do Programa

O contrato é dividido em dois conceitos:

#### **A. Contrato Mestre (Factory)**
Função: **Criar novos vaults**. É uma "fábrica" de heranças.
- Recebe a configuração inicial do usuário
- Deriva um PDA único baseado no endereço do usuário + seed
- Inicializa o vault com os parâmetros fornecidos
- Devolve o endereço do vault para o usuário

#### **B. Vault Individual (PDA)**
Cada usuário pode criar **múltiplos vaults** (um por herança). Cada vault é um **Program Derived Address (PDA) isolado**, derivado do `owner pubkey + seed (índice incremental)`. Isso permite que um mesmo usuário tenha várias heranças com configurações diferentes (ex: uma para família, outra para ONG).

O PDA do vault armazena:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `owner` | Pubkey | Endereço do usuário criador |
| `last_heartbeat` | i64 | Timestamp UNIX do último sinal de vida |
| `inactivity_period` | i64 | Período máximo de inatividade em segundos (ex: 6 meses = ~15.7M seg) |
| `heirs` | Vec<Heir> | Lista de herdeiros com divisões (máx: 10 herdeiros) |
| `assets` | Vec<Pubkey> | Lista de token mints depositados no vault (SOL = System Program ID). Atualizado a cada `deposit_token`. Máx: 5 assets distintos. |
| `keeper_fee_bps` | u16 | Taxa do keeper em basis points (ex: 10 = 0.1%) paga no claim. Máximo: 100 (1%). |
| `gas_reserve_lamports` | u64 | Quantidade de SOL reservada para reembolsar gas do keeper |
| `status` | enum | `Active`, `Claimed`, `Cancelled` |
| `created_at` | i64 | Timestamp de criação |

**Estrutura de `Heir`:**
```rust
pub struct Heir {
    pub wallet: Pubkey,      // Endereço do herdeiro
    pub asset: Pubkey,       // Mint do token. SOL nativo = System Program ID (11111111111111111111111111111111)
    pub allocation_type: enum { Percentage, FixedAmount },
    pub allocation_value: u64, // Se Percentage: 0-10000 (basis points). Se FixedAmount: quantidade bruta
}
```

> **Nota:** A ordem de inserção no `Vec<Heir>` é funcionalmente significativa — o primeiro herdeiro da lista é o destinatário padrão do saldo restante após arredondamentos.

### 4.2 Instruções Principais

| Instrução | Quem chama | Descrição |
|-----------|-----------|-----------|
| `initialize_vault` | Usuário (via dApp) | Cria um novo vault PDA com configuração inicial. **Validação:** `gas_reserve_lamports` deve ser >= 0.01 SOL (~10M lamports) para garantir viabilidade do keeper. |
| `deposit_sol` | Usuário | Transfere SOL do usuário para o vault PDA |
| `deposit_token` | Usuário | Transfere SPL Tokens (USDC/USDT) do usuário para o vault PDA. Cria ATA do vault sob demanda se necessário. |
| `heartbeat` | Usuário (direto) ou Keeper (via proof) | Atualiza `last_heartbeat` para o timestamp atual. Reseta o timer. Veja seção 4.5 para modelo de autorização. |
| `claim` | Qualquer pessoa (herdeiro, keeper, ou desconhecido) | Verifica se o timer expirou. Se sim, distribui os fundos EXCLUSIVAMENTE para os herdeiros configurados. Quem executa recebe apenas a fee configurada. |
| `update_config` | Usuário (owner) | Altera herdeiros, divisões ou período de inatividade. Requer assinatura do owner. |
| `cancel_vault` | Usuário (owner) | Encerra o vault e devolve todos os fundos para o owner. Só funciona se o timer ainda não expirou. |

### 4.3 Lógica de Distribuição no `claim`

#### **Pré-condições**
1. Verificar se `status == Active`
2. Verificar se `current_timestamp > last_heartbeat + inactivity_period`
3. Verificar se o chamador passou as contas necessárias via `remaining_accounts`:
   - ATA do vault para cada SPL token
   - ATA de cada herdeiro para cada SPL token (ou conta do sistema para criação)
   - Mint de cada token (para validação)

#### **Modelo de Assets no Claim**

O programa **não consegue enumerar automaticamente** quais ATAs existem para um PDA. Por isso, o claim funciona assim:

- O vault mantém um `Vec<Pubkey> assets` com os mints dos tokens depositados (atualizado em cada `deposit_token`)
- O keeper/dApp consulta esse vetor off-chain e monta a transação passando as ATAs corretas via `remaining_accounts`
- O programa itera sobre `vault.assets` e, para cada asset, verifica as contas passadas e executa as transferências
- **Limite:** Máximo 5 assets distintos por vault, máximo 10 herdeiros — isso garante que a transação não exceda o limite de compute units (1.4M) ou tamanho máximo

#### **Regras de Distribuição (Determinísticas)**

**Validação inicial:**
- Se existir alocação `Percentage`, a soma de todos os percentuais para aquele asset deve ser **exatamente 10000** (100%). Isso é validado no `initialize_vault` e `update_config`.
- Se existir alocação `FixedAmount`, o vault não precisa ter saldo suficiente no momento da configuração (o usuário pode depositar depois), mas no claim o valor transferido será o mínimo entre `allocation_value` e `saldo_disponível`.

**Ordem de cálculo por asset:**
1. Calcular e transferir todas as alocações `FixedAmount` primeiro (mínimo entre valor configurado e saldo disponível)
2. Calcular e transferir todas as alocações `Percentage` sobre o **saldo remanescente** após os fixed amounts
3. Se sobrar saldo por arredondamento (resto da divisão), transferir para o primeiro herdeiro da lista que possui alocação para esse asset
4. Se não houver herdeiros alocados para aquele asset, transferir o saldo inteiro para o **primeiro herdeiro** da lista (fallback geral)

**Fee do keeper:**
- Calculada sobre o **valor total distribuído** de cada asset (soma de todas as transferências para herdeiros)
- `keeper_fee = (total_distribuido * keeper_fee_bps) / 10000`
- Transferida para a carteira do executor do claim

**Reembolso de gas:**
- Valor **fixo e previsível** por operação, configurado no vault: `gas_reserve_lamports`
- No `claim`, o programa transfere `min(gas_reserve_lamports, saldo_SOL_do_vault)` para o executor
- Não tenta calcular "gas real gasto" — usa o valor reservado configurado
- Se `gas_reserve_lamports` for insuficiente para cobrir todas as operações, o executor absorve a diferença (incentivo para manter a reserva adequada)

**Atualização final:**
- Atualizar `status = Claimed`
- Emitir eventos on-chain para cada transferência

### 4.4 Segurança do Contrato

- **Signer check**: Apenas o `owner` pode chamar `update_config`, `cancel_vault`. O `heartbeat` aceita tanto o owner quanto um keeper com proof válido (veja 4.5).
- **PDA derivation**: O vault PDA é derivado deterministicamente do programa ID + owner pubkey + seed, evitando colisões
- **Reentrancy guard**: Instruções de transferência usam `invoke_signed` de forma atômica
- **Overflow/underflow checks**: Usar `checked_add`, `checked_sub`, `checked_mul` do Rust
- **SPL Token safety**: Verificar `token::transfer` com `CpiContext` adequado

### 4.5 Autorização do Heartbeat (Duas Modalidades)

A instrução `heartbeat` aceita **duas formas** de autorização, garantindo tanto UX quanto segurança:

#### **Modalidade A: Owner assina diretamente on-chain**
- O próprio owner da carteira chama `heartbeat` como signer da transação
- O contrato verifica que `tx.signer == vault.owner`
- Custo: o owner paga o gas
- Uso: Fallback caso o keeper esteja offline; ou usuários avançados

#### **Modalidade B: Keeper submete com proof assinado off-chain (padrão)**
1. Usuário gera mensagem off-chain: `heartbeat:<vault_address>:<current_timestamp>`
2. Usuário assina a mensagem com sua chave privada (ed25519)
3. dApp envia para a API do keeper: `{ vault, timestamp, signature, pubkey }`
4. Keeper monta uma transação que inclui:
   - Uma instrução do `Ed25519Program` da Solana contendo a assinatura, a mensagem e a pubkey do owner
   - A instrução `heartbeat` do nosso programa
5. O contrato, na instrução `heartbeat`, lê o `instruction sysvar` para verificar os dados da instrução do `Ed25519Program` e validar que a assinatura pertence ao `vault.owner` e que a mensagem corresponde ao vault e timestamp corretos
6. Se válido, atualiza `last_heartbeat`

**Por que usar o Ed25519Program?**
- É o **padrão da Solana** para verificação de assinaturas ed25519 em programas on-chain
- O programa não precisa implementar criptografia manual — delega para o programa nativo da rede
- Mais seguro e auditável

**Por que essa dualidade?**
- A Modalidade B permite UX gratuita para o usuário (zero gas)
- A Modalidade A garante que o sistema funcione mesmo que toda a infraestrutura off-chain falhe
- O contrato não confia cegamente no keeper — ele verifica criptograficamente a assinatura do owner via programa nativo

### 4.6 Gerenciamento de SPL Token Accounts (ATAs)

Para receber SPL Tokens (USDC/USDT), o vault PDA precisa de **Associated Token Accounts (ATAs)** — uma ATA por token mint.

**Quem cria as ATAs?**
- As ATAs são criadas **lazy** (sob demanda) dentro da instrução `deposit_token`
- Se a ATA do vault para aquele mint não existir, o contrato a cria automaticamente usando `associated_token::create` (CPI para o Associated Token Program)
- **Quem paga o rent?** O usuário que está depositando (o `funding_account` da transação). Isso é justo porque quem quer usar aquele token deve pagar pelo espaço de conta.

**Por que não criar todas as ATAs no `initialize_vault`?**
- Não sabemos antecipadamente quais tokens o usuário vai depositar
- Criar ATAs para todos os tokens possíveis seria inviável (milhares de mints na Solana)
- Lazy creation é o padrão mais eficiente e econômico na Solana

**No `claim`:**
- Para cada herdeiro que recebe SPL Tokens, o contrato verifica se a ATA do herdeiro existe. Se não existir, cria automaticamente (o vault PDA paga o rent da ATA do herdeiro via `invoke_signed`).
- Para SOL, a transferência é direta via `system_program::transfer`.
- **Limite de herdeiros:** Máximo 10 herdeiros por vault. Isso limita o número de ATAs a criar no claim e garante que a transação caiba no limite de compute units (1.4M).
- **Limite de assets:** Máximo 5 tokens distintos por vault (incluindo SOL). Isso limita o tamanho da transação e o número de contas necessárias no `remaining_accounts`.

**Cálculo de custo máximo no claim:**
- Exemplo pior caso: 10 herdeiros × 5 assets = até 50 transferências + criação de ATAs
- Compute units estimados: ~800K (dentro do limite de 1.4M)
- Custo de rent de ATAs: deduzido do `gas_reserve_lamports` junto com o reembolso de gas

### 4.7 Eventos On-Chain

Cada instrução emite eventos Anchor para facilitar indexação pelo keeper e dApp:

| Evento | Instrução de Origem | Dados |
|--------|---------------------|-------|
| `VaultCreated` | `initialize_vault` | `vault_address`, `owner`, `inactivity_period` |
| `Deposit` | `deposit_sol`, `deposit_token` | `vault_address`, `asset`, `amount`, `depositor` |
| `HeartbeatReset` | `heartbeat` | `vault_address`, `new_timestamp`, `caller` |
| `ClaimExecuted` | `claim` | `vault_address`, `asset`, `amount`, `heir`, `keeper` |
| `VaultCancelled` | `cancel_vault` | `vault_address`, `owner`, `refund_amount` |

### 4.8 Segurança do Claim — Quem Pode Executar?

> **⚠️ IMPORTANTE:** Esta seção esclarece uma dúvida comum de segurança.

**Pergunta:** "Se qualquer pessoa pode executar o `claim`, qualquer um pode roubar meus fundos?"

**Resposta:** NÃO. Aqui está o porquê:

#### **Quem executa ≠ Quem recebe**

A pessoa que chama a função `claim` (o "executor") **NUNCA** recebe os fundos do vault. Os fundos são transferidos **exclusivamente** para os herdeiros configurados pelo dono do vault. O executor apenas:

1. **Paga o gas** da transação (reembolsado pelo `gas_reserve_lamports`)
2. **Recebe a fee** configurada (`keeper_fee_bps`, ex: 0.1%) como incentivo econômico
3. **NÃO pode alterar** os destinatários, porcentagens ou qualquer configuração do vault

#### **Duas Barreiras de Proteção**

O contrato verifica rigorosamente antes de liberar qualquer fundo:

1. **`status == Active`** — Se o vault já foi claimed ou cancelado, a transação é rejeitada
2. **`current_timestamp > last_heartbeat + inactivity_period`** — Se o timer ainda não expirou, a transação é rejeitada

Se qualquer uma dessas condições falhar, o executor perde o gas e não recebe nada.

#### **Exemplo Prático**

- **Configuração do vault:** 6 meses de inatividade, herdeiros: irmão (50%), mãe (50%), fee do keeper: 0.1%
- **Após 6 meses sem heartbeat:** Um keeper detecta a expiração e executa o claim
- **Distribuição:**
  - Irmão recebe: 49.95% dos USDC
  - Mãe recebe: 49.95% dos USDC  
  - Keeper recebe: 0.1% de fee + reembolso de gas
  - **O keeper NÃO pode desviar os fundos para si próprio**

#### **Por que permitir que qualquer pessoa execute?**

Se restringíssemos o claim apenas aos herdeiros:
- **Risco de perda de chave:** Se um herdeiro perde acesso à carteira, os fundos ficam presos para sempre
- **Barreira técnica:** Herdeiros podem não saber usar Solana/dApps
- **Disponibilidade:** Herdeiros podem estar offline no momento da expiração

Permitir execução aberta cria um **mercado de incentivos** — qualquer pessoa pode ganhar uma fee pequena por executar claims, garantindo que nenhum vault fique esquecido.

#### **Proteção Adicional: Fee Limitada**

- A fee (`keeper_fee_bps`) é configurada pelo **dono do vault** no momento da criação
- O valor máximo deve ser limitado pelo programa (ex: máximo 1% = 100 bps)
- Isso impede que um executor malicioso configure uma fee absurda

---

## 5. Camada 2: dApp Frontend

### 5.1 Stack Tecnológica

- **Framework**: Next.js 14+ (App Router)
- **Wallet Adapter**: `@solana/wallet-adapter-react` (suporte a Phantom, Solflare, Backpack)
- **Cliente Solana**: `@solana/web3.js` para interações RPC
- **Anchor Client**: `@coral-xyz/anchor` para chamadas ao programa
- **UI**: Tailwind CSS + shadcn/ui ou equivalente
- **Estado**: React Query (TanStack Query) para cache de dados on-chain

### 5.2 Telas Principais

1. **Landing Page**: Explicação do produto, CTA para conectar carteira
2. **Dashboard**: Lista de vaults do usuário, status do timer, saldos
3. **Criar Herança (Wizard)**:
   - Passo 1: Escolher período de inatividade (3, 6, 12 meses)
   - Passo 2: Adicionar herdeiros (endereço + tipo de divisão)
   - Passo 3: Revisar e confirmar (transação `initialize_vault`)
4. **Gerenciar Vault**:
   - Visualizar timer (contagem regressiva)
   - Botão "Estou vivo" (envia assinatura off-chain para o keeper)
   - Depositar mais fundos
   - Editar configuração
   - Cancelar vault
5. **Herdeiro — Claim**: Interface para herdeiros verem heranças pendentes e resgatarem (com fallback caso o keeper não execute)

### 5.3 Fluxo de "Estou vivo" (Heartbeat)

1. Usuário clica "Estou vivo" no dApp
2. dApp gera uma mensagem off-chain: `"heartbeat:<vault_address>:<current_timestamp>"`
3. Usuário assina a mensagem com sua carteira (sem pagar gas!)
4. dApp envia `{ vault_address, timestamp, signature, owner_pubkey }` para a API do keeper
5. Keeper valida a assinatura ed25519 localmente
6. Keeper submete a transação `heartbeat` on-chain, passando o proof como parâmetro
7. Contrato valida a assinatura on-chain (Modalidade B) e atualiza `last_heartbeat`
8. Keeper recebe reembolso de gas do `gas_reserve_lamports` do vault

---

## 6. Camada 3: Keeper / Bot Off-Chain

### 6.1 Responsabilidades

O keeper é um serviço Node.js/TypeScript que roda continuamente:

1. **Monitoramento de Heartbeats**:
   - Recebe requisições HTTP do dApp com assinaturas off-chain (Modalidade B)
   - Valida a assinatura ed25519 localmente antes de submeter
   - Submete a transação `heartbeat` on-chain via RPC, passando o proof como parâmetro
   - O contrato valida a assinatura on-chain antes de aceitar o heartbeat
   - Reembolsa seu próprio gas do vault usando `gas_reserve_lamports` (se configurado)

2. **Monitoramento de Claims**:
   - Escuta todos os vaults ativos do programa
   - Calcula `last_heartbeat + inactivity_period` para cada um
   - Quando detecta um timer expirado, automaticamente chama `claim`
   - Recebe recompensa/gas refund do contrato (incentivo econômico)

3. **Indexação**:
   - Mantém um banco de dados local (SQLite/PostgreSQL) com o estado de todos os vaults para consulta rápida
   - Atualiza o estado a cada nova transação (heartbeat, deposit, claim)

### 6.2 Incentivo Econômico

O keeper precisa ser economicamente viável. Os parâmetros são configurados no vault no momento da criação:
- **`gas_reserve_lamports`**: Reserva de SOL no vault para reembolsar o keeper. É um **valor fixo e previsível** por operação, não uma estimativa de "gas real gasto". O programa transfere esse valor para o executor em cada heartbeat e no claim.
- **`keeper_fee_bps`**: Taxa de serviço em basis points (ex: 10 = 0.1%) cobrada sobre o valor total distribuído no `claim`. Máximo: 100 (1%). Paga ao keeper que executar o claim.
- **Heartbeat gratuito para o usuário**: O usuário não paga gas. O keeper é reembolsado via `gas_reserve_lamports`.

**Exemplo de incentivo:**
- Vault com 1000 USDC e `keeper_fee_bps = 10` (0.1%)
- Keeper executa claim → recebe 1 USDC de fee + reembolso do gas em SOL
- Isso cria um incentivo econômico para que múltiplos keepers compitam para executar claims expirados

**Race condition entre keepers:**
- Se múltiplos keepers tentarem executar o mesmo `claim` simultaneamente, apenas a primeira transação confirmada terá sucesso
- As demais falharão com `status != Active` (já foi claimed)
- Keepers devem tratar essa falha como "já processado" e não como erro crítico
- A concorrência é saudável — garante que claims não fiquem pendentes

**Valor mínimo de `gas_reserve_lamports`:**
- Validado na instrução `initialize_vault` (veja 4.2). O valor mínimo obrigatório (ex: 0.01 SOL = ~10M lamports) garante fundos suficientes para heartbeats e o claim final.
- Se `gas_reserve_lamports` for muito baixo, o keeper pode deixar de monitorar o vault por não ser economicamente viável.

### 6.3 Fallback Descentralizado

Mesmo que o keeper falhe:
- Qualquer pessoa (incluindo herdeiros) pode chamar `claim` diretamente on-chain
- O contrato não depende do keeper para funcionar — ele apenas facilita

### 6.4 API do Keeper (Interface entre dApp e Serviço Off-Chain)

O keeper expõe uma API HTTP REST para comunicação com o dApp:

**Endpoint: `POST /api/v1/heartbeat`**
- **Request Body:**
  ```json
  {
    "vault_address": "string (base58)",
    "timestamp": "number (unix seconds)",
    "signature": "string (base58 da assinatura ed25519)",
    "pubkey": "string (base58 da pubkey do owner)"
  }
  ```
- **Response 200:** `{ "success": true, "tx_signature": "string" }`
- **Response 400:** `{ "success": false, "error": "invalid_signature | invalid_vault | expired_timestamp" }`
- **Response 503:** `{ "success": false, "error": "keeper_temporarily_unavailable" }`
- **Retry logic do dApp:** Em caso de falha do keeper, o dApp deve alertar o usuário e oferecer a opção de assinar on-chain diretamente (Modalidade A)

**Endpoint: `GET /api/v1/vaults/:vault_address/status`**
- **Response:** Estado indexado do vault (último heartbeat, timer restante, saldos)

**Endpoint: `POST /api/v1/notifications/register`**
- **Request Body:**
  ```json
  {
    "vault_address": "string",
    "channel": "email | telegram | sms",
    "address": "string (email, chat_id ou telefone)",
    "recipient_type": "owner | heir"
  }
  ```

---

## 7. Camada 4: Serviço de Notificações

### 7.1 Lembretes para o Usuário

- **30 dias antes da expiração**: Email/Telegram avisando que o timer está próximo de expirar
- **7 dias antes**: Último lembrete urgente
- **1 dia antes**: Alerta crítico

### 7.2 Notificações para Herdeiros

- **Quando um claim é executado**: Notificar todos os herdeiros com os detalhes da transferência
- **Quando um vault é cancelado**: Notificar que a herança foi revogada

### 7.3 Implementação

- **Backend**: Node.js/Express ou serverless (Vercel Functions, Cloudflare Workers)
- **Banco de dados**: PostgreSQL para armazenar emails/telegram IDs vinculados a vaults
- **Serviços**: SendGrid/Resend (email), Telegram Bot API (Telegram), Twilio (SMS opcional)
- **Scheduling**: Cron job ou agendador interno para verificar timers e enviar lembretes

---

## 8. Fluxos de Dados (Data Flow)

### 8.1 Criação de Vault

```
Usuário → dApp → Wallet Sign → initialize_vault → Programa Solana
                                            ↓
                                      Cria PDA Vault
                                            ↓
                              Emite evento "VaultCreated"
                                            ↓
                              Keeper indexa o novo vault
```

### 8.2 Depósito de Fundos

```
Usuário → dApp → Wallet Sign → deposit_sol/deposit_token → Programa Solana
                                                      ↓
                                            Transfere SOL/SPL para PDA
                                                      ↓
                              Emite evento "Deposit"
```

### 8.3 Heartbeat

```
Usuário → Clica "Estou vivo" → dApp gera mensagem → Usuário assina (off-chain)
                                                            ↓
                                            dApp envia assinatura para Keeper API
                                                            ↓
                                            Keeper valida → submete heartbeat on-chain
                                                            ↓
                                            Programa atualiza last_heartbeat
```

### 8.4 Claim (Timer Expirado)

```
Keeper monitora → Detecta timer expirado → Submete claim on-chain
                                                    ↓
                              Programa verifica inatividade → Distribui fundos
                                                    ↓
                              Emite eventos "ClaimExecuted" para cada herdeiro
                                                    ↓
                              Notificador envia alertas para herdeiros
```

---

## 9. Modelo de Dados Off-Chain (Keeper/Notificador)

### Tabela: `vaults`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID interno |
| `vault_address` | String | Endereço do PDA na Solana |
| `owner_address` | String | Endereço do usuário dono |
| `inactivity_period` | Integer | Segundos |
| `last_heartbeat` | Timestamp | Último sinal de vida |
| `status` | Enum | `active`, `claimed`, `cancelled` |
| `created_at` | Timestamp | Data de criação |
| `updated_at` | Timestamp | Última atualização |

### Tabela: `heirs`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID interno |
| `vault_id` | UUID | FK para vaults |
| `wallet_address` | String | Endereço do herdeiro |
| `asset_mint` | String | Mint do token |
| `allocation_type` | Enum | `percentage`, `fixed_amount` |
| `allocation_value` | BigInt | Valor da alocação |

### Tabela: `notifications`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID interno |
| `vault_id` | UUID | FK para vaults |
| `recipient_type` | Enum | `owner`, `heir` |
| `channel` | Enum | `email`, `telegram`, `sms` |
| `address` | String | Email, chat_id ou telefone |
| `last_sent_at` | Timestamp | Último envio |

---

## 10. Considerações de Segurança

### 10.1 Smart Contract

- **Auditoria obrigatória**: O contrato deve ser auditado por uma firma reconhecida (OtterSec, Neodyme) antes do mainnet
- **Testes extensivos**: Unit tests, integration tests, fuzzing de inputs
- **Bug bounty**: Programa de recompensa para vulnerabilidades
- **Upgradeability**: O programa será **imutável** após deployment (sem upgrade authority). Para um sistema de herança que guarda fundos de usuários, a imutabilidade gera máxima confiança — ninguém (nem os desenvolvedores) pode alterar a lógica posteriormente. Bugs devem ser mitigados por auditorias extensivas e testes antes do mainnet.

### 10.2 Keeper

- **Chaves privadas**: O keeper precisa de uma chave privada para submeter transações. Deve ser armazenada em um HSM ou pelo menos em variáveis de ambiente criptografadas
- **Rate limiting**: Proteger a API do keeper contra spam/DDoS
- **Monitoramento**: Alertas se o keeper parar de funcionar (Datadog, PagerDuty)

### 10.3 dApp

- **Sanitização de inputs**: Validar todos os endereços de carteira, valores, etc.
- **HTTPS obrigatório**: Todas as comunicações devem ser criptografadas
- **CSP headers**: Content Security Policy para prevenir XSS

---

## 11. Decisões Arquiteturais (ADRs)

### ADR-001: Vaults isolados por PDA ao invés de conta única global
**Status:** Aceito  
**Contexto:** Precisamos isolar os fundos de cada usuário para minimizar risco.  
**Decisão:** Cada usuário recebe um PDA único derivado do programa.  
**Consequências:** Custo de rent por vault (~0.002 SOL), mas segurança e transparência maximizadas.

### ADR-002: Keeper off-chain com heartbeat assinado off-chain
**Status:** Aceito  
**Contexto:** O usuário não deve pagar gas toda vez que der um sinal de vida.  
**Decisão:** O usuário assina uma mensagem off-chain; o keeper submete on-chain.  
**Consequências:** Melhor UX, mas requer infraestrutura off-chain confiável. Fallback para chamada on-chain direta se o keeper falhar.

### ADR-003: SPL Tokens (USDC/USDT) + SOL nativo
**Status:** Aceito  
**Contexto:** Precisamos suportar os ativos mais comuns.  
**Decisão:** Suportar SOL via `system_program::transfer` e SPL Tokens via `token::transfer`.  
**Consequências:** Usuário pode depositar SOL diretamente ou USDC/USDT. O contrato mantém saldos separados.

---

## 12. Glossário

| Termo | Definição |
|-------|-----------|
| **PDA** | Program Derived Address — endereço na Solana derivado de um programa, não de uma chave privada |
| **Heartbeat** | Sinal de vida enviado pelo usuário para resetar o timer de inatividade |
| **Keeper** | Bot/serviço off-chain que monitora e executa transações on-chain |
| **Vault** | Conta isolada (PDA) que guarda os fundos de um usuário |
| **Claim** | Ação de resgatar/liberar os fundos da herança |
| **SPL Token** | Padrão de token na Solana (equivalente ao ERC-20) |
| **Rent** | Taxa de aluguel paga para manter uma conta ativa na Solana |

---

## 13. Próximos Passos

1. **Revisão desta arquitetura** — Aprovação do usuário
2. **Escrever especificação detalhada do Smart Contract** — Estruturas de dados, instruções, testes
3. **Escrever especificação do dApp** — Wireframes, fluxos de usuário, integração com wallet
4. **Escrever especificação do Keeper** — API, lógica de monitoramento, deployment
5. **Criar plano de implementação** — Ordem de desenvolvimento, milestones, dependências

---

*Documento gerado durante sessão de brainstorming. Sujeito a revisões e ajustes.*
