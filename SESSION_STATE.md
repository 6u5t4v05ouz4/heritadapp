# Session State

> Last updated: 2026-04-24T18:00:00Z
> Session started: 2026-04-24

## Current Task
Frontend do Crypto-Heranca com todas as páginas principais implementadas. Próximo passo: componentes reutilizáveis, toasts/notificações, e integração com Supabase no frontend.

## What Was Done
- [x] Criado `frontend/src/lib/anchor.ts` — configuração do programa Anchor com Program ID da devnet
- [x] Copiado IDL (`crypto_heranca.json`) para `frontend/src/lib/idl/`
- [x] Criado `frontend/src/app/providers.tsx` — WalletAdapter (Phantom + Solflare), ConnectionProvider, QueryClientProvider
- [x] Atualizado `frontend/src/app/layout.tsx` — integrado AppProviders, metadados em pt-BR, fonte DM Sans via link
- [x] Criado `frontend/src/hooks/useProgram.ts` — hook para acessar o programa Anchor com provider conectado
- [x] Criado `frontend/src/hooks/useVault.ts` — hook completo para interagir com o programa
- [x] Atualizado `frontend/src/app/page.tsx` — landing page com WalletMultiButton e links para /vaults e /vaults/create
- [x] **NOVO:** Criado `frontend/src/app/vaults/page.tsx` — lista de vaults do usuário com cards, status, timer, skeletons
- [x] **NOVO:** Criado `frontend/src/app/vaults/create/page.tsx` — wizard de 3 passos (config → herdeiros → revisão) para criar vault
- [x] **NOVO:** Criado `frontend/src/app/vaults/[address]/page.tsx` — detalhes do vault com: timer visual, barra de progresso, ações (depositar SOL, heartbeat, cancelar, claim), lista de herdeiros
- [x] **NOVO:** Criado `frontend/src/app/wallet-adapter.css` — CSS do wallet adapter sem @import problemático
- [x] Build do frontend passando sem erros (`npm run build`)
- [x] Projeto commitado e pushado para GitHub (https://github.com/6u5t4v05ouz4/heritadapp)

## What's Pending / Next Steps
1. **Criar componentes reutilizáveis:**
   - `components/VaultCard.tsx` — extrair card da lista de vaults
   - `components/HeirForm.tsx` — extrair formulário de herdeiros
   - `components/DepositForm.tsx` — extrair formulário de depósito
2. **Adicionar toasts/notificações:**
   - Instalar `sonner` ou `react-hot-toast`
   - Substituir os estados inline de error/success nas páginas
3. **Integrar Supabase no frontend:**
   - Criar `lib/supabase.ts` com cliente Supabase
   - Adicionar queries para dados off-chain (perfil, notificações)
4. **Melhorar UX:**
   - Loading skeletons mais elaborados
   - Empty states
   - Modal de confirmação para ações críticas (cancel, claim)
5. **Validações no cliente:**
   - Validar endereços Solana antes de submeter
   - Validar soma de percentuais = 100%
   - Preview de transação antes de assinar

## Key Decisions & Rationale
- **Anchor Program constructor**: Na versão 0.32.1, usamos `new Program(idl, provider)` em vez de `new Program(idl, programId, provider)` porque o IDL já contém o `address` e o TypeScript da nova versão espera provider como segundo arg no overload de 2 parâmetros.
- **Wallet adapter CSS**: Copiamos o CSS do pacote para um arquivo local (`wallet-adapter.css`) sem o `@import` de fonte problemático, e carregamos a fonte via `<link>` no `<head>` do layout. Isso resolve o erro de parsing do Turbopack.
- **Hooks separados**: `useProgram` cuida da conexão com Anchor; `useVault` cuida das instruções do programa. Separação de responsabilidades facilita testes.
- **Wizard em 3 passos**: A criação de vault é dividida em configuração básica → herdeiros → revisão. Isso torna o formulário menos intimidador e permite validação progressiva.

## Active Problems / Blockers
- Nenhum blocker ativo. Build está verde.

## Architecture Context
- Frontend: Next.js 16 + React 19 + Tailwind CSS v4 + TypeScript
- Estado blockchain: Anchor 0.32.1 + Wallet Adapter + TanStack Query
- Estado off-chain: Supabase (configurado no package.json mas não implementado ainda no frontend)
- Programa Solana: crypto_heranca na devnet — vaults com heartbeat, herdeiros, múltiplos assets

## Files Modified / Created
- `frontend/src/lib/anchor.ts` — novo
- `frontend/src/lib/idl/crypto_heranca.json` — copiado do keeper
- `frontend/src/app/providers.tsx` — novo
- `frontend/src/app/layout.tsx` — atualizado com providers, metadados, fonte DM Sans
- `frontend/src/app/globals.css` — importa wallet-adapter.css local
- `frontend/src/app/wallet-adapter.css` — novo (CSS do wallet adapter sem @import problemático)
- `frontend/src/hooks/useProgram.ts` — novo
- `frontend/src/hooks/useVault.ts` — novo
- `frontend/src/app/page.tsx` — landing page com links para vaults
- `frontend/src/app/vaults/page.tsx` — lista de vaults
- `frontend/src/app/vaults/create/page.tsx` — wizard de criação
- `frontend/src/app/vaults/[address]/page.tsx` — detalhes e ações do vault
- `.gitignore` — criado na raiz do projeto
- `SESSION_STATE.md` — este arquivo

## Important Context
- Usuário perdeu sessão anterior. Agora a infraestrutura base e as páginas principais do frontend estão completas.
- Próximo passo sugerido: implementar componentes reutilizáveis e toasts para melhorar a UX.
- Repositório GitHub: https://github.com/6u5t4v05ouz4/heritadapp
