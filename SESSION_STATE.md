# Session State

> Last updated: 2026-04-26
> Session started: 2026-04-24

## Current Task
**Integração e Teste do Keeper (Automated Claim) Concluídos**

O Keeper foi testado com sucesso localmente. Ele detectou um vault expirado na devnet e executou a transação de claim enviando os fundos para os herdeiros de forma totalmente autônoma. Tivemos que ajustar a tipagem do Anchor 0.32 no keeper e criar as tabelas no Supabase.

## What Was Done
- [x] Contrato deployado na devnet com timer ajustado.
- [x] Frontend com todas as páginas e fallback manual de claim operacionais.
- [x] **Setup do banco de dados (Supabase)**: Corrigido o `schema.sql` (substituição de `GENERATED ALWAYS AS` por `TRIGGER` para `expires_at` afim de evitar erros de imutabilidade) e executado o DDL no painel do Supabase.
- [x] **Configuração do Keeper**: Gerada nova Keypair (`.env`) financiada com faucet da devnet.
- [x] **Fix de TypeScript no Keeper (`solana.ts` & `api.ts`)**: Bypassed tipagem restrita do Anchor ao chamar `program.account.vault` e corrigido retorno do Supabase.
- [x] **Fix de Claim Automático (`claim.ts`)**: Adaptada a instrução `claim` para Anchor 0.32, passando explícitamente `heir0` até `heir9` e usando `programId` como valor sentinela para slots opcionais não preenchidos.
- [x] **Teste End-to-End**: Criado um vault com prazo de 60s, depositado SOL. O Keeper escaneou via Cron, detectou o vencimento e processou o `claim` on-chain sem erros.

## Active Problem / Blocker
Nenhum blocker no momento. O core técnico (Smart Contract, Frontend, Keeper Off-chain, Indexador Supabase) está rodando lisinho e validado on-chain.

## What's Pending / Next Steps (Baseado no Superpowers Spec)
1. **Fase 4: Notificações**
   - Integrar o envio de emails/telegram/sms de fato, consumindo a fila/endpoint de notificações.
   - Atualmente a estrutura no Supabase está pronta (`notification_preferences`, `notification_logs`), falta só o despachante (ex: Resend, Sendgrid, Telegram Bot API).
   
2. **Fase 5: Deploy / Produção**
   - Reverter o contrato de `MIN_INACTIVITY_PERIOD` para um prazo realista (se formos para Mainnet).
   - Fazer o deploy do Keeper em ambiente cloud (Render, Railway, Heroku) para rodar os cron jobs 24/7.
   - Deploy do Frontend (Vercel/Netlify).

## Key Decisions & Rationale
- **Arquitetura Keeper**: O Claim manual no Frontend se manteve apenas como *fallback*. A arquitetura prioriza o Keeper para garantir autonomia total aos usuários.
- **Anchor 0.32 Optional Accounts**: Abandonada a abordagem de `remainingAccounts` na hora de passar herdeiros, padronizando a montagem das 10 contas de herdeiros explicitamente para evitar erros silênciosos de "Missing Account" na IDL.
- **Imutabilidade de Timestamps no Postgres**: Em vez de depender de generated columns do Supabase para datas dependentes do locale (que quebram no start), usamos uma Trigger clássica `BEFORE INSERT/UPDATE`.

## Files Modified / Created (Nesta sessão)
- `keeper/.env` - Configurado (RPC, Supabase, PK do bot).
- `keeper/src/routes/api.ts` - Fix try/catch PromiseLike.
- `keeper/src/services/solana.ts` - TS fixes em accounts.
- `keeper/src/db/schema.sql` - Substituição de Generated Column por Trigger `update_vault_expires_at`.
- `keeper/src/services/claim.ts` - Refactor do Anchor `claim` com sentinelas.

## Important Context
- Repositório: https://github.com/6u5t4v05ouz4/heritadapp
- Program ID devnet: `8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX`
