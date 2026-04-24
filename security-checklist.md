# Crypto-Herança — Security Checklist

**Program:** crypto_heranca  
**Framework:** Anchor 0.31.1  
**Risk Level:** 🔴 Critical  
**Date:** 2026-04-24  

---

## High-Risk Decisions

| Decision | Risk | Mitigation |
|----------|------|------------|
| **Immutável (no upgrade authority)** | Bugs não podem ser corrigidos após deploy | Auditoria externa obrigatória antes do mainnet; testes extensivos |
| **Keeper com reembolso de gas** | Keeper pode ser gamed se gas_reserve for manipulável | Valor fixo pré-configurado; mínimo obrigatório de 0.01 SOL |
| **Claim aberto (qualquer pessoa)** | Executor malicioso pode causar griefing | Fee limitada a 1%; fundos vão SÓ para herdeiros; executor só recebe fee + gas |
| **Heartbeat off-chain (Modalidade B)** | Complexidade de verificação Ed25519 | Usar Ed25519Program nativo; fallback on-chain (Modalidade A) |

---

## Account & Identity Validation

- [x] **Signer Checks:** Todas as instruções privilegiadas verificam signer
  - `initialize_vault`: owner é Signer
  - `deposit_sol`: owner é Signer + has_one
  - `deposit_token`: owner é Signer + has_one
  - `heartbeat`: owner é Signer (Modalidade A) ou proof válido (Modalidade B)
  - `update_config`: owner é Signer + has_one
  - `cancel_vault`: owner é Signer + has_one
- [x] **Ownership Checks:** Vault PDA verificado via seeds + bump
- [x] **Account Data Matching:** `has_one = owner` em todas as instruções que precisam
- [x] **Type Cosplay Prevention:** Anchor Account<T> com discriminator automático
- [x] **Reinitialization Prevention:** `init` constraint (não init_if_needed para vault)
- [x] **Writable Checks:** Accounts mutáveis marcados com `mut`

## PDA Security

- [x] **Canonical Bumps:** Bump armazenado no vault e reutilizado
- [x] **PDA Sharing Prevention:** Seeds incluem owner pubkey + seed único
- [x] **Seed Collision Prevention:** Prefixo fixo `b"vault"` + owner + seed (fixed-length)
- [x] **PDA Purpose Isolation:** Apenas vaults usam seeds `b"vault"`

## Arithmetic & Logic Safety

- [x] **Checked Math:** Todas as operações financeiras usam checked_add/sub/mul/div
- [x] **Multiply Before Divide:** Percentuais calculados como `(amount * bps) / 10000`
- [x] **Lamport Balance Invariant:** Transferências de SOL preservam total
- [x] **Overflow Prevention:** `overflow-checks = true` no Cargo.toml release profile

## Duplicate Mutable Account Attacks

- [x] **Duplicate Check:** Heirs validados para wallets duplicadas no init e update

## CPI Safety

- [x] **Program ID Validation:** Token program verificado via `Program<'info, Token>`
- [x] **No Arbitrary CPI:** Apenas programas conhecidos (System, Token, Associated Token)
- [x] **invoke_signed:** Usado com seeds canônicas do vault PDA

## State Lifecycle

- [x] **Secure Closure:** `close = owner` no cancel_vault
- [x] **Status Tracking:** VaultStatus enum (Active, Claimed, Cancelled)
- [x] **No Zombie Accounts:** Close constraint zera dados e devolve rent

## Token-2022 Considerations

- [ ] **Token-2022 Validation:** Atualmente usando SPL Token classic
  - **TODO:** Adicionar validação de extensions se suportar Token-2022 no futuro
  - **TODO:** Verificar PermanentDelegate, FreezeAuthority, TransferHook

## Admin Key Security

- [x] **No Admin Key:** Programa não tem admin key ou funções privilegiadas
- [x] **Immutável:** Sem upgrade authority (configurado no Anchor.toml)

## BPF Runtime Limits

- [ ] **Stack Frame Check:** Verificar warnings após `anchor build`
  - **TODO:** Se houver warnings de stack frame, aplicar Box<> a campos grandes
- [x] **Compute Units:** Limites de herdeiros (10) e assets (5) garantem CU dentro do limite

## Client-Side Checklist

- [ ] **Simulação:** dApp deve simular transações antes de assinar
- [ ] **Input Validation:** Validar endereços, valores e percentuais no frontend
- [ ] **Error Handling:** Mensagens amigáveis para erros comuns
- [ ] **Blockhash Expiry:** Tr retry com fresh blockhash

---

## Known Limitations

1. **Heartbeat Modalidade B:** Implementação simplificada de verificação Ed25519. Em produção, usar Ed25519Program via instruction sysvar.
2. **Claim SPL Tokens:** Requer remaining_accounts com ATAs dos herdeiros. O keeper deve montar a transação corretamente.
3. **Cancel Vault SPL:** Tokens SPL não são transferidos automaticamente no cancel. Owner deve retirar manualmente ou via instrução adicional.
4. **Gas Reimbursement:** Valor fixo pode não cobrir gas em períodos de alta congestão.

---

## Pre-Mainnet Checklist

- [ ] Auditoria externa (OtterSec, Neodyme, ou similar)
- [ ] Bug bounty program
- [ ] Testes em devnet por pelo menos 2 semanas
- [ ] Monitoramento de métricas (TVL, número de vaults, claims executados)
- [ ] Documentação completa para usuários
- [ ] Runbook de incidentes

---

*Checklist gerado seguindo o padrão Safe Solana Builder (Frank Castle).*
