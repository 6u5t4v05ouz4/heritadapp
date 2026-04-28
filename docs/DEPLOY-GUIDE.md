# Crypto-Heranca — Manual Deploy Guide

> Guia rápido para deploy manual do backend (Railway) e frontend (Vercel) via CMD/PowerShell.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de que:

1. **Railway CLI** está instalado e logado:
   ```powershell
   npx railway whoami
   # Deve retornar: Logged in as ...
   ```

2. **Vercel CLI** está instalado e logado:
   ```powershell
   npx vercel whoami
   # Deve retornar: Seu username
   ```

3. Você está na pasta raiz do projeto:
   ```powershell
   cd D:\Users\n4r1g4\Desktop\CRYPTO-HERANCA
   ```

---

## 🚀 Deploy do Backend (Keeper — Railway)

### 1. Navegar até a pasta do keeper
```powershell
cd D:\Users\n4r1g4\Desktop\CRYPTO-HERANCA\keeper
```

### 2. Fazer o deploy
```powershell
npx railway up
```

> Isso sobe o código atual para o Railway e inicia um novo build. A URL continua a mesma: `https://crypto-heranca-keeper-production.up.railway.app`

### 3. Verificar status do deploy
```powershell
npx railway service status
```

### 4. Ver logs em tempo real (útil para debug)
```powershell
npx railway logs
```

### 5. Testar se está online
```powershell
Invoke-RestMethod -Uri "https://crypto-heranca-keeper-production.up.railway.app/api/v1/health" -UseBasicParsing
```

---

## 🎨 Deploy do Frontend (Next.js — Vercel)

### 1. Navegar até a pasta do frontend
```powershell
cd D:\Users\n4r1g4\Desktop\CRYPTO-HERANCA\frontend
```

### 2. Fazer o deploy para produção
```powershell
npx vercel --prod --yes
```

> O `--prod` força o deploy para produção (ao invés de preview).
> O `--yes` pula confirmações interativas.

### 3. Após o deploy, verificar a URL
```powershell
npx vercel list
```

---

## 🔄 Fluxo Completo de Atualização (Backend + Frontend)

Quando você fizer alterações no código e quiser atualizar tudo:

### Passo 1 — Commitar no GitHub (sempre primeiro!)
```powershell
cd D:\Users\n4r1g4\Desktop\CRYPTO-HERANCA
git add -A
git commit -m "feat: descrição da mudança"
git push origin main
```

### Passo 2 — Deploy do Backend
```powershell
cd D:\Users\n4r1g4\Desktop\CRYPTO-HERANCA\keeper
npx railway up
```

### Passo 3 — Deploy do Frontend
```powershell
cd D:\Users\n4r1g4\Desktop\CRYPTO-HERANCA\frontend
npx vercel --prod --yes
```

---

## 🛠️ Comandos Úteis

### Railway (Keeper)

| Comando | O que faz |
|---------|-----------|
| `npx railway up` | Deploy o código atual |
| `npx railway service status` | Ver status do serviço |
| `npx railway logs` | Ver logs em tempo real |
| `npx railway logs --tail` | Ver apenas novos logs |
| `npx railway variables` | Listar variáveis de ambiente |
| `npx railway variables set NOME=valor` | Adicionar/alterar env var |
| `npx railway open` | Abrir dashboard no navegador |

### Vercel (Frontend)

| Comando | O que faz |
|---------|-----------|
| `npx vercel --prod --yes` | Deploy para produção |
| `npx vercel list` | Listar deploys recentes |
| `npx vercel logs` | Ver logs |
| `npx vercel env ls` | Listar variáveis de ambiente |
| `npx vercel env add NOME valor production` | Adicionar env var |
| `npx vercel open` | Abrir site no navegador |

---

## 🔧 Variáveis de Ambiente

### Railway (Keeper)
Se precisar alterar alguma configuração do keeper (ex: intervalo de cron, RPC, etc.):

```powershell
cd D:\Users\n4r1g4\Desktop\CRYPTO-HERANCA\keeper

# Alterar intervalo de sync para 10 minutos
npx railway variables set MONITOR_INTERVAL_MINUTES=10

# Alterar RPC para Helius (exemplo)
npx railway variables set SOLANA_RPC_URL="https://devnet.helius-rpc.com/?api-key=SUA_KEY"

# Redeploy para aplicar
npx railway up
```

### Vercel (Frontend)
Se precisar alterar alguma configuração do frontend:

```powershell
cd D:\Users\n4r1g4\Desktop\CRYPTO-HERANCA\frontend

# Alterar network para mainnet (futuro)
Write-Output "mainnet" | npx vercel env add NEXT_PUBLIC_SOLANA_NETWORK production

# Redeploy para aplicar
npx vercel --prod --yes
```

---

## 🌐 Domínios

| Serviço | URL Atual |
|---------|-----------|
| Frontend (Vercel) | https://frontend-f41l78ous-6u5t4v0s-projects.vercel.app |
| Frontend (Custom) | https://herita.xyz |
| Keeper API | https://crypto-heranca-keeper-production.up.railway.app |

> **Nota:** O domínio `herita.xyz` está registrado na Vercel. Se precisar apontar para outro projeto ou reconfigurar, acesse o [Vercel Dashboard](https://vercel.com/dashboard).

---

## ⚡ Dica: Alias/Renomear Projeto

Os nomes gerados automaticamente (`frontend-f41l78ous...`) são feios. Para ter uma URL mais limpa no Vercel:

1. Acesse: https://vercel.com/6u5t4v0s-projects/frontend/settings
2. Em **Project Name**, mude de `frontend` para `herita`
3. A URL de preview será: `herita-xxx.vercel.app`

Ou via CLI:
```powershell
cd D:\Users\n4r1g4\Desktop\CRYPTO-HERANCA\frontend
npx vercel project rename herita
```

---

## 📝 Checklist Antes de Cada Deploy

- [ ] Código commitado no GitHub (`git push origin main`)
- [ ] Build local passando (`npm run build` na pasta `frontend` e `keeper`)
- [ ] Variáveis de ambiente atualizadas (se necessário)
- [ ] Testado localmente (`npm run dev`)

---

> **Última atualização:** 2026-04-28
> **Versão:** v1.0
