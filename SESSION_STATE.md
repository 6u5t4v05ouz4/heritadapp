# Session State

> Last updated: 2026-04-25T22:36:47-03:00
> Session started: 2026-04-24

## Current Task
**Resolver Erro "This transaction has already been processed" / "already in use" ao Criar Vaults**

O contrato já foi redeployado com `MIN_INACTIVITY_PERIOD = 60s` (o log da segunda tentativa mostra `Instruction: InitializeVault` executando com sucesso). O problema atual é que a criação do vault está sendo submetida duas vezes (ou retentada indevidamente), causando:
1. Primeira tentativa: `This transaction has already been processed` (tx já foi enviada)
2. Segunda tentativa: `already in use` (o PDA do vault já foi criado pela primeira tentativa)

Foi implementada lógica de recovery no frontend para detectar quando o vault foi criado apesar do erro.

## What Was Done
- [x] Contrato deployado na devnet com timer de 60 segundos (WSL) — **código corrigido agora**
- [x] Frontend com todas as páginas (landing, vaults list, create, detail)
- [x] Anchor 0.32: Ajustado hook de `claim` para passar slots ausentes de herdeiros usando o `programId` como sentinel, e as accounts com nomes em camelCase.
- [x] Timer de Inatividade atualizado (Rust & Frontend): Agora só inicia a contagem quando o primeiro depósito é feito (`last_heartbeat = 0` na criação).
- [x] Tratamento de erros no `retryRpc` melhorado: Não retenta para "Unknown action" e "already in use", além de adicionar logs melhores.
- [x] UX de Criação de Vault: Seed padrão do formulário alterada de `Date.now()` para `Math.random()` de alta entropia para prevenir colisões de PDA caso a página não seja recarregada.
- [x] UX de Vault Detail: Quando o timer não iniciou (`last_heartbeat == 0`), mostra o status "Aguardando Depósito" com barra de carregamento pulsante amarela ao invés de vermelho "Expirado".
- [x] Pre-flight Check na Criação: `initializeVault` agora checa preventivamente se a conta PDA do vault já existe on-chain antes de enviar a transação, dando um erro legível ao usuário.
- [x] **Diagnóstico aprimorado no `useVault.ts`**: Adicionada função `verifyProgramDeployed` que checa se o programa existe e é executável antes de enviar transações. Erro "Unknown action" da Phantom agora é traduzido em mensagem instruindo a verificar a rede.
- [x] **Correção de `MIN_INACTIVITY_PERIOD`**: Ajustado de 30 dias para 60 segundos no código-fonte (`vault.rs`) para permitir testes na devnet.
- [x] **Fix de double-submission no `retryRpc`**: "already been processed" adicionado à lista de erros não-retentáveis.
- [x] **Recovery de vault criado**: Após erro na criação, o hook verifica se o PDA do vault existe on-chain. Se existir, considera sucesso e redireciona.

## Active Problem / Blocker
**Double-submission / Retry indevido na Criação de Vaults**
- O contrato já está com `MIN_INACTIVITY_PERIOD = 60s` na devnet (confirmado pelos logs de simulação).
- O erro atual é `This transaction has already been processed` seguido de `already in use`.
- Causa: `retryRpc` retentava em "already processed", e na segunda tentativa o PDA já existia.
- **Fix aplicado**: "already been processed" agora é não-retentável, e existe recovery check que verifica se o vault foi criado após o erro.
- **Próximo passo**: testar a criação novamente para validar o fix.

## What's Pending / Next Steps
1. **Validar a Criação de Vaults após o Fix de Retry**
   - Tentar criar vault com período curto (ex: 1 minuto = 60 segundos).
   - Confirmar que não aparece mais `already been processed` / `already in use`.
   - Se aparecer "already processed", o recovery check deve detectar o vault criado e redirecionar normalmente.

2. **Testar se o Claim funciona com Anchor 0.32**
   - Depositar SOL no vault criado.
   - Esperar o timer de inatividade expirar (60s).
   - Clicar em "Executar Claim".
   - Confirmar se o erro original `Unknown action 'undefined'` da hora do *claim* não reaparece.

3. **Verificar Regras de Negócio Pós-Claim**
   - Testar distribuição para múltiplos herdeiros.
   - Verificar se o keeper fee é pago.
   - Verificar se o gas reserve é reembolsado ao executor.

4. **Depois dos testes finais:**
   - Reverter o contrato para prazos reais (30 dias) no ambiente de WSL.
   - Rebuildar e fazer o deploy definitivo na devnet/mainnet.
   - Fazer o deploy do frontend em produção (ex: Vercel).

## Key Decisions & Rationale
- **Timer de Inatividade no 1º Depósito:** Alterado no Rust para que o `last_heartbeat` comece como 0 e só vire o `timestamp` atual após a execução com sucesso da instrução de depósito (SOL ou token). Isso evita que vaults vazios se tornem inativos/expirados, o que não faz sentido lógico.
- **Seed Randômica (`Math.random`):** O uso de `Date.now()` causava a reutilização da mesma seed se o formulário não fosse completamente desmontado entre criações, causando tentativa de sobrepor PDAs.
- **Pre-flight Check (`connection.getAccountInfo`):** Ao invés de deixar a Wallet falhar opacamente na assinatura do blockhash ao tentar o init, o hook agora checa antes de enviar o RPC.

## Files Modified / Created
- `programs/crypto_heranca/src/state/vault.rs` - `is_expired` e `is_timer_active` tratam `last_heartbeat == 0`.
- `programs/crypto_heranca/src/instructions/initialize_vault.rs` - set de `last_heartbeat = 0`.
- `programs/crypto_heranca/src/instructions/deposit_sol.rs` - Start timer.
- `programs/crypto_heranca/src/instructions/deposit_token.rs` - Start timer.
- `frontend/src/hooks/useVault.ts` - `initializeVault` com check de PDA, `verifyProgramDeployed`, recovery após "already processed", e ajustes nos erros em `retryRpc`.
- `frontend/src/app/vaults/create/page.tsx` - Seed inicial usando `Math.random()`.
- `frontend/src/app/vaults/[address]/page.tsx` - Interface atualizada para status "Aguardando Depósito".
- `frontend/src/app/vaults/page.tsx` - Status do timer listado como "Aguardando Depósito".

## Important Context
- Repositório: https://github.com/6u5t4v05ouz4/heritadapp
- Program ID devnet: `8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX`
- As alterações no contrato em Rust ainda requerem o build (`anchor build`) para fazerem efeito no lado da blockchain.
