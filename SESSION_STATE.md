# Session State

> Last updated: 2026-04-24T17:30:00Z
> Session started: 2026-04-24

## Current Task
Infraestrutura base do frontend implementada. Build passando. Pronto para começar a implementar as páginas e componentes específicos do fluxo de vaults.

## What Was Done
- [x] Criado `frontend/src/lib/anchor.ts` — configuração do programa Anchor com Program ID da devnet
- [x] Copiado IDL (`crypto_heranca.json`) para `frontend/src/lib/idl/`
- [x] Criado `frontend/src/app/providers.tsx` — WalletAdapter (Phantom + Solflare), ConnectionProvider, QueryClientProvider
- [x] Atualizado `frontend/src/app/layout.tsx` — integrado AppProviders, metadados em pt-BR
- [x] Criado `frontend/src/hooks/useProgram.ts` — hook para acessar o programa Anchor com provider conectado
- [x] Criado `frontend/src/hooks/useVault.ts` — hook completo para interagir com o programa:
  - `initializeVault`
  - `depositSol`
  - `depositToken`
  - `heartbeat`
  - `cancelVault`
  - `claim`
  - `fetchVault`
  - `fetchVaultsByOwner`
  - `getVaultPDA`
- [x] Atualizado `frontend/src/app/page.tsx` — página inicial com WalletMultiButton, explicação do produto, cards de ação (Criar Vault / Meus Vaults)
- [x] Build do frontend passando sem erros (`npm run build`)

## What's Pending / Next Steps
1. **Criar páginas de navegação**:
   - `/vaults/create` — formulário para criar novo vault (seed, inactivity period, heirs, keeper fee, gas reserve)
   - `/vaults` — listar vaults do usuário conectado
   - `/vaults/[address]` — detalhes do vault, ações de depositar, heartbeat, cancelar
2. **Integrar com Supabase** — configurar cliente Supabase para dados off-chain (perfil, contatos, notificações)
3. **Criar componentes reutilizáveis** — VaultCard, HeirForm, DepositForm, etc.
4. **Adicionar toast/notificações** — para feedback de transações
5. **Configurar prettier/eslint** se necessário

## Key Decisions & Rationale
- **Anchor Program constructor**: Na versão 0.32.1, usamos `new Program(idl, provider)` em vez de `new Program(idl, programId, provider)` porque o IDL já contém o `address` e o TypeScript da nova versão espera provider como segundo arg no overload de 2 parâmetros.
- **Wallet adapters**: Usamos apenas Phantom e Solflare para manter simples. Pode-se adicionar mais depois.
- **Network hardcoded Devnet**: O programa está deployado na devnet (`8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX`). Mudar para mainnet será trivial depois.
- **Hooks separados**: `useProgram` cuida da conexão com Anchor; `useVault` cuida das instruções do programa. Separação de responsabilidades facilita testes.

## Active Problems / Blockers
- Nenhum blocker ativo. Build está verde.

## Architecture Context
- Frontend: Next.js 16 + React 19 + Tailwind CSS v4 + TypeScript
- Estado blockchain: Anchor 0.32.1 + Wallet Adapter + TanStack Query
- Estado off-chain: Supabase (configurado no package.json mas não implementado ainda)
- Programa Solana: crypto_heranca na devnet — vaults com heartbeat, herdeiros, múltiplos assets

## Files Modified / Created
- `frontend/src/lib/anchor.ts` — novo
- `frontend/src/lib/idl/crypto_heranca.json` — copiado do keeper
- `frontend/src/app/providers.tsx` — novo
- `frontend/src/app/layout.tsx` — atualizado com providers e metadados
- `frontend/src/hooks/useProgram.ts` — novo
- `frontend/src/hooks/useVault.ts` — novo
- `frontend/src/app/page.tsx` — totalmente reescrito com UI de wallet

## Important Context
- Usuário perdeu sessão anterior onde estava implementando dependências do frontend. Agora a infraestrutura base está completa.
- Próximo passo sugerido: implementar as rotas de vault (criar/listar/detalhes).
