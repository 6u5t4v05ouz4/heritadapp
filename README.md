# HERITA

### Protecting Generations with Solana

Herita is an on-chain inheritance protocol built on Solana that ensures digital assets are passed on to the right people if something unexpected happens.

**Live Demo:** [https://herita.xyz](https://herita.xyz)  
**Devnet Program:** `8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX`

---

## What is Herita?

Millions of people own crypto today, but most have no succession plan. If access is lost, wallets can remain inactive and funds may never reach the right people.

Herita allows users to create a secure inheritance vault where they can:

- Deposit SOL or supported tokens
- Choose one or multiple beneficiaries (up to 10)
- Define inactivity periods (test: 60s | mainnet: 30 days)
- Keep full ownership while active
- Enable automatic distribution if prolonged inactivity occurs
- Receive email/SMS notifications for critical events

## Architecture

Herita consists of 3 integrated layers:

```
┌─────────────────────────────────────────┐
│           FRONTEND (Next.js)            │
│   React 19 • Tailwind CSS v4 • Wallet   │
│   https://herita.xyz                    │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           KEEPER (Node.js)              │
│   Express • Cron • Ed25519 Heartbeat    │
│   Resend Email • Twilio SMS • Claims    │
│   https://crypto-heranca-keeper...      │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│     SMART CONTRACT (Anchor 0.32.1)      │
│   Rust • Solana Devnet • Program ID     │
│   8rQWCAFD9GhyTmQ73Y4LkSt7VzxFh...     │
└─────────────────────────────────────────┘
```

## Core Features

### Smart Contract
- **Initialize Vault** — Create a PDA vault with heirs, inactivity period, keeper fee, and gas reserve
- **Deposit SOL / SPL Tokens** — Fund the vault with native SOL or supported tokens
- **Heartbeat** — Reset the inactivity timer (Mode A: owner signs directly | Mode B: keeper submits Ed25519 proof)
- **Update Config** — Modify heirs, inactivity period, keeper fee, or gas reserve (owner only)
- **Cancel Vault** — Close vault and reclaim funds before expiration (owner only)
- **Claim** — Automatic distribution to heirs after inactivity period expires (anyone can execute, keeper receives gas reimbursement + fee)

### Frontend
- **Gold Premium Dark Theme** — Unified visual identity with glass effects, semantic tokens, and dourado accents
- **Wallet Connection** — Phantom, Solflare via Solana Wallet Adapter
- **Vault Management** — Create, monitor, deposit, heartbeat, and cancel vaults
- **Heir Dashboard** — Dedicated `/heir` page for beneficiaries with live polling (15s auto-refresh)
- **Notification Preferences** — Register email/phone for heartbeat, deposit, expiry, and claim alerts
- **Explorer Integration** — Direct links to Solana Explorer/Solscan for all transactions

### Keeper Service
- **On-Chain Sync** — Automatically sync vaults, heirs, and assets to Supabase
- **Heartbeat Processing** — Validate and submit Mode B heartbeats with Ed25519Program verification
- **Claim Execution** — Monitor expired vaults and execute claims automatically
- **Notifications** — Email (Resend) + SMS (Twilio) with 6 templates:
  - `heartbeat_received` — Owner alerted on heartbeat
  - `deposit_received` — Owner + heirs alerted on deposits > 0.001 SOL
  - `expiry_warning` — Heirs alerted when timer < 25%
  - `claim_executed` — Owner notified after claim
  - `heir_alert` — Custom alerts for heirs
  - `cancel` — Cancellation confirmation
- **Deduplication** — 24-hour cooldown per template to prevent spam
- **API Endpoints** — RESTful API with rate limiting, CORS, and health checks

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Solana Devnet |
| Smart Contract | Anchor 0.32.1, Rust |
| Frontend | Next.js 16, React 19, Tailwind CSS v4, TypeScript |
| Wallets | Phantom, Solflare (@solana/wallet-adapter) |
| Backend | Node.js, Express, TypeScript |
| Database | Supabase (PostgreSQL) |
| Notifications | Resend (Email), Twilio (SMS) |
| Testing | Anchor TS, LiteSVM (Rust), Jest (Keeper) |

## Project Structure

```
crypto-heranca/
├── programs/crypto_heranca/     # Anchor smart contract
│   ├── src/
│   │   ├── lib.rs               # Program entrypoint + claim logic
│   │   ├── state/vault.rs       # Vault, Heir, VaultStatus, AllocationType
│   │   ├── errors.rs            # 18 custom error codes
│   │   ├── events.rs            # VaultCreated, Deposit, HeartbeatReset, etc.
│   │   └── instructions/        # All 8 instruction handlers
│   └── tests/                   # LiteSVM Rust tests
├── frontend/                     # Next.js frontend
│   ├── src/app/                 # Pages (/, /vaults, /heir, /terms, /privacy)
│   ├── src/components/          # UI components, layout, vault-specific
│   ├── src/hooks/               # useVault, useEnhancedToast
│   └── src/lib/                 # Anchor, Supabase, Explorer, Keeper helpers
├── keeper/                       # Node.js keeper service
│   ├── src/services/            # Heartbeat, Claim, Vault Monitor, Notifications
│   ├── src/routes/api.ts        # REST API routes
│   └── tests/                   # Jest tests
├── tests/crypto_heranca.ts      # Anchor TypeScript tests (10 tests)
├── Anchor.toml                   # Anchor config (devnet)
├── security-checklist.md         # Pre-mainnet security checklist
└── WSL_BUILD_GUIDE.md           # Build instructions for WSL
```

## Deployed URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://herita.xyz |
| Keeper (Railway) | https://crypto-heranca-keeper-production.up.railway.app |
| Supabase | https://naotxbbzuexiaiwbmikr.supabase.co |
| Solana Devnet | https://explorer.solana.com/address/8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX?cluster=devnet |

## Local Development

### Prerequisites
- Node.js >= 20
- Rust + Cargo
- Solana CLI
- Anchor CLI 0.32.1

### 1. Clone and Install

```bash
git clone https://github.com/6u5t4v05ouz4/heritadapp.git
cd heritadapp

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install keeper dependencies
cd ../keeper && npm install
```

### 2. Smart Contract (WSL recommended for Windows)

```bash
# Copy to WSL (Windows)
wsl mkdir -p ~/crypto-heranca
cp -r /mnt/d/Users/n4r1g4/Desktop/CRYPTO-HERANCA/* ~/crypto-heranca/
cd ~/crypto-heranca

# Build
anchor build

# Test
anchor test

# Deploy to devnet
solana config set --url devnet
solana airdrop 2
anchor deploy
```

### 3. Frontend

```bash
cd frontend

# Copy IDL from Anchor build
cp ../target/idl/crypto_heranca.json src/lib/idl/

# Create .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key" >> .env.local
echo "NEXT_PUBLIC_KEEPER_URL=http://localhost:3001" >> .env.local

# Run dev server
npm run dev
```

### 4. Keeper

```bash
cd keeper

# Create .env
cp .env.example .env
# Edit .env with your keys (Solana, Supabase service role, Resend, Twilio)

# Build and run
npm run build
npm start

# Or dev mode with hot reload
npm run watch
```

## Testing

```bash
# Anchor TypeScript tests (all 10 pass)
anchor test

# Keeper tests
npm run test --workspace=keeper

# Frontend build check
cd frontend && npm run build
```

## Security

This project follows the [Safe Solana Builder](https://github.com/6u5t4v05ouz4/heritadapp/security-checklist.md) guidelines by Frank Castle:

- ✅ Signer & ownership checks on all privileged instructions
- ✅ PDA validation with canonical bumps and seed isolation
- ✅ Checked math on all financial operations
- ✅ Ed25519 signature verification via instruction sysvar
- ✅ No admin keys or upgrade authority (immutable program)
- ✅ Duplicate heir prevention
- ✅ Status lifecycle tracking (Active → Claimed/Cancelled)

See `security-checklist.md` for the full pre-mainnet checklist.

## Known Limitations

1. **Inactivity Period:** Currently 60 seconds for devnet testing. Will be 30 days before mainnet.
2. **SPL Token Claims:** Claim instruction currently distributes SOL only. SPL token distribution requires remaining accounts with heir ATAs.
3. **Token-2022:** Not yet validated for Token-2022 extensions.

## Roadmap

- [x] Core smart contract (8 instructions)
- [x] Frontend with wallet connection
- [x] Keeper service with sync + claims
- [x] Ed25519 heartbeat verification
- [x] Supabase integration with RLS
- [x] Email + SMS notifications
- [x] Gold premium UI theme
- [x] Heir dashboard with live polling
- [ ] End-to-end testing with real notifications
- [ ] SPL token claim distribution
- [ ] Mainnet audit (OtterSec/Trail of Bits)
- [ ] Mainnet deployment

## Contributing

This project is under active development. For questions or contributions, please open an issue or reach out via the deployed frontend.

## License

MIT

---

*Herita — Every wallet deserves a succession plan.*
