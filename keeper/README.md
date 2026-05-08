# Crypto-Heranca Keeper

Serviço keeper (bot off-chain) para o Crypto-Heranca — monitora vaults, executa claims e sincroniza com Supabase.

## Funcionalidades

- **Monitoramento contínuo** de todos os vaults ativos no programa Solana
- **Execução automática de claims** quando o timer de inatividade expira
- **API REST** para heartbeat gasless (Modalidade B) e consulta de status
- **Sincronização com Supabase** para indexação rápida e atualizações em tempo real
- **Jobs periódicos** via cron para sync e execução de claims

## Setup

### 1. Instalar dependências

```bash
cd keeper
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Editar .env com suas credenciais
```

### 3. Setup do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor → New Query**
3. Cole e execute o conteúdo de `src/db/schema.sql`
4. Copie a **Project URL** e **Service Role Key** para o `.env`

### 4. Rodar em desenvolvimento

```bash
npm run dev
# ou
npm run watch
```

### 5. Build para produção

```bash
npm run build
npm start
```

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Info do serviço |
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/heartbeat` | Submeter heartbeat gasless |
| GET | `/api/v1/vaults` | Listar vaults ativos (paginado) |
| GET | `/api/v1/vaults/:address/status` | Status de um vault |
| POST | `/api/v1/notifications/register` | Registrar notificação |
| GET | `/api/v1/expired` | Vaults expirados (admin) |

## Exemplo: Heartbeat Gasless

```bash
curl -X POST http://localhost:3000/api/v1/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "vault_address": "8rQW...VyX",
    "timestamp": 1714060800,
    "signature": "base64_signature_here",
    "pubkey": "OwnerPubkeyBase58"
  }'
```

## Arquitetura

```
src/
├── config.ts              # Variáveis de ambiente
├── index.ts               # Entry point + cron jobs
├── server.ts              # Express app
├── routes/
│   └── api.ts             # Endpoints REST
├── services/
│   ├── solana.ts          # Cliente Solana/Anchor
│   ├── vault_monitor.ts   # Monitoramento de vaults
│   ├── heartbeat.ts       # Lógica de heartbeat
│   └── claim.ts           # Execução de claims
└── db/
    ├── supabase.ts        # Cliente Supabase
    └── schema.sql         # Schema do banco
```

## Jobs Cron

| Job | Frequência | Descrição |
|-----|------------|-----------|
| Vault Sync | A cada 5 min | Sincroniza estado on-chain → Supabase |
| Claim Check | A cada 5 min | Verifica vaults expirados e executa claims |

## Segurança

- Rate limiting na API (100 req/min por IP)
- Validação de assinaturas Ed25519 antes de submeter heartbeat
- Row Level Security (RLS) no Supabase
- Helmet.js para headers de segurança HTTP
