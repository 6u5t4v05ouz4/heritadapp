# Compilar no WSL — Crypto-Herança

## Pré-requisitos no WSL

```bash
# Verificar se Anchor está instalado
anchor --version
# Deve retornar: anchor-cli 0.31.x

# Verificar Solana CLI
solana --version

# Verificar Rust
cargo --version
rustc --version
```

---

## Passo 1: Copiar o projeto para o WSL

No **PowerShell/CMD do Windows**, execute:

```powershell
# Copiar todo o projeto para o WSL (ajuste o caminho conforme seu usuário)
$source = "D:\Users\n4r1g4\Desktop\CRYPTO-HERANCA"
$dest = "\\wsl$\Ubuntu\home\$env:USERNAME\crypto-heranca"

# Criar diretório no WSL se não existir
wsl mkdir -p ~/crypto-heranca

# Copiar arquivos
Copy-Item -Path "$source\*" -Destination $dest -Recurse -Force
```

Ou, no **terminal do WSL**:

```bash
# Criar diretório e copiar via mount do Windows
mkdir -p ~/crypto-heranca
cp -r /mnt/d/Users/n4r1g4/Desktop/CRYPTO-HERANCA/* ~/crypto-heranca/
```

---

## Passo 2: Entrar no diretório do programa

```bash
cd ~/crypto-heranca
```

---

## Passo 3: Compilar o programa

```bash
# Compilar com Anchor
anchor build
```

Se der erro de dependências:

```bash
# Atualizar dependências
cargo update

# Tentar novamente
anchor build
```

---

## Passo 4: Resolver erros comuns

### Erro: `solana-program` version conflict

```bash
# Atualizar para versões compatíveis
cargo update base64ct --precise 1.6.0
cargo update constant_time_eq --precise 0.4.1
cargo update blake3 --precise 1.5.5
```

### Erro: Stack frame muito grande

Adicione no `Cargo.toml` do programa:

```toml
[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
```

---

## Passo 5: Testar

```bash
# Rodar testes do Anchor
anchor test

# Ou testes Rust diretos
cargo test
```

---

## Passo 6: Deploy na devnet (após compilar com sucesso)

```bash
# Configurar Solana CLI para devnet
solana config set --url devnet

# Criar/verificar wallet
solana-keygen new --outfile ~/.config/solana/id.json

# Solicitar airdrop de SOL
solana airdrop 2

# Deploy
anchor deploy

# Salvar o Program ID gerado
anchor keys list
```

---

## Estrutura do projeto no WSL

```
~/crypto-heranca/
├── Anchor.toml
├── Cargo.toml
├── security-checklist.md
├── docs/
│   └── superpowers/
│       ├── specs/
│       │   └── 2026-04-23-crypto-heranca-arquitetura.md
│       └── plans/
│           └── 2026-04-24-crypto-heranca-plan.md
├── programs/
│   └── crypto_heranca/
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs
│           ├── errors.rs
│           ├── events.rs
│           ├── state/
│           │   ├── mod.rs
│           │   └── vault.rs
│           └── instructions/
│               ├── mod.rs
│               ├── initialize_vault.rs
│               ├── initialize_token_account.rs
│               ├── deposit_sol.rs
│               ├── deposit_token.rs
│               ├── heartbeat.rs
│               ├── claim.rs
│               ├── update_config.rs
│               └── cancel_vault.rs
└── tests/
    └── crypto_heranca_tests.rs
```

---

## Comandos úteis

```bash
# Build apenas
anchor build

# Build + test
anchor test

# Ver IDL gerado
cat target/idl/crypto_heranca.json

# Verificar types TypeScript gerados
ls target/types/

# Limpar build
anchor clean

# Ver logs do programa na devnet
solana logs --url devnet
```

---

## ⚠️ Atenção aos TODOs no código

Antes do mainnet, implementar:

1. **Heartbeat Ed25519 real** (`instructions/heartbeat.rs`)
   - Implementar verificação via Ed25519Program instruction sysvar

2. **Claim de SPL Tokens** (`instructions/claim.rs`)
   - Implementar distribuição de SPL tokens (atualmente só distribui SOL)

3. **Testes completos** (`tests/`)
   - Implementar todos os testes LiteSVM

4. **Auditoria de segurança**
   - Contratar auditoria externa (OtterSec/Neodyme)

---

**Pronto para compilar! 🚀**
