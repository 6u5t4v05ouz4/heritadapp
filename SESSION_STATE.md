# Session State

> Last updated: 2026-04-24T19:00:00Z
> Session started: 2026-04-24

## Current Task
**Erro no claim do vault:** `SendTransactionError: Unknown action 'undefined'`

O usuário vai reiniciar o PC. Na próxima sessão, precisamos resolver este erro.

## What Was Done
- [x] Contrato deployado na devnet com timer de 60 segundos (WSL)
- [x] Frontend com todas as páginas (landing, vaults list, create, detail)
- [x] Timer atualizando em tempo real (a cada 1 segundo)
- [x] Saldo do vault sendo buscado on-chain
- [x] Retry automático em todas as transações
- [x] Claim passando herdeiros corretamente (camelCase heir0...heir9)
- [x] Build do frontend passando sem erros
- [x] Deploy de SOL funcionando (com notificação verde)

## Active Problem / Blocker
**Claim falha com erro:**
```
SendTransactionError: Unknown action 'undefined'
```

### Contexto do erro:
- O vault foi criado com sucesso
- SOL foi depositado com sucesso
- Timer expirou (3 minutos)
- Ao clicar "Executar Claim", dá erro `Unknown action 'undefined'`
- O erro vem do retryRpc → claim → handleClaim
- Não é mais "Account `heir0` not provided" (isso foi resolvido!)

### O que já tentamos para o claim:
1. ❌ Passar heirs via `.remainingAccounts()` → "heir0 not provided"
2. ❌ Passar heirs como `heir_0` (snake_case) → "heir0 not provided"
3. ❌ Passar heirs como `heir0` (camelCase) → "heir2 not provided" (faltavam os outros slots)
4. ❌ Passar TODOS os 10 slots (heir0...heir9) com null → "Unknown action 'undefined'"

### Diagnóstico atual:
O erro `Unknown action 'undefined'` pode ser:
1. **Erro do Anchor 0.32 com `skipPreflight: true`** - O skipPreflight pode estar causando erro de parsing
2. **Transação malformada** - Algum account ou dado está incorreto
3. **Erro da wallet Phantom** - A extensão pode estar rejeitando a transação

## What's Pending / Next Steps
1. **URGENTE: Resolver erro `Unknown action 'undefined'` no claim**
   - Arquivo: `frontend/src/hooks/useVault.ts` (função `claim`)
   - Sugestão: Remover `skipPreflight: true` temporariamente para ver o erro real
   - Ou adicionar `.simulate()` antes de `.rpc()` para debugar
   - Ou tentar com wallet Solflare em vez de Phantom

2. **Testar se o claim funciona após correção**
   - Criar vault com 2 minutos
   - Depositar SOL
   - Esperar expirar
   - Executar claim

3. **Se claim funcionar:**
   - Testar distribuição para múltiplos herdeiros
   - Verificar se keeper fee é pago
   - Verificar se gas reserve é reembolsado

4. **Depois dos testes:**
   - Voltar contrato para 30 dias no WSL
   - Rebuildar e redeployar na devnet
   - Fazer deploy em produção (Vercel)

## Key Decisions & Rationale
- **Timer em minutos:** Para facilitar testes, o frontend aceita minutos (mínimo 1)
- **Contrato com 60s:** Deploy temporário na devnet para testar claim rapidamente
- **skipPreflight:** Adicionado para evitar "transaction already processed", mas pode estar causando outros problemas
- **Retry com backoff:** 3 tentativas com espera crescente (1s, 2s, 3s)

## Files Modified / Created
- `frontend/src/hooks/useVault.ts` - hook principal, função claim com retry
- `frontend/src/app/vaults/[address]/page.tsx` - página de detalhes do vault
- `frontend/src/components/ClientOnly.tsx` - componente para evitar hydration mismatch
- `programs/crypto_heranca/src/state/vault.rs` - MIN_INACTIVITY_PERIOD = 60s (WSL)
- `deploy-devnet.sh` - script de deploy no WSL

## Important Context
- Repositório: https://github.com/6u5t4v05ouz4/heritadapp
- Program ID devnet: `8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX`
- WSL path: `~/crypto-heranca-build`
- O claim PRECISA de herdeiros passados corretamente (heir0...heir9, camelCase, todos os 10 slots)
- O erro `Unknown action 'undefined'` é NOVO - precisa investigar a causa raiz
