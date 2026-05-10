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
- Define inactivity periods
- Keep full ownership while active
- Enable automatic distribution if prolonged inactivity occurs
- Receive email/SMS notifications for critical events

## Architecture

Herita consists of 3 integrated layers:

- **Smart Contract** (Anchor 0.32.1 + Rust) — On-chain vault logic, heir management, and automated distribution
- **Frontend** (Next.js 16 + React 19 + Tailwind CSS v4) — User interface for vault creation, management, and heir dashboard
- **Keeper** (Node.js + Express) — Off-chain service that monitors vaults, processes heartbeats, executes claims, and sends notifications

## Core Features

### Smart Contract
- **Initialize Vault** — Create a PDA vault with heirs, inactivity period, keeper fee, and gas reserve
- **Deposit SOL / SPL Tokens** — Fund the vault with native SOL or supported tokens
- **Heartbeat** — Reset the inactivity timer (Mode A: owner signs directly | Mode B: keeper submits Ed25519 proof)
- **Update Config** — Modify heirs, inactivity period, keeper fee, or gas reserve (owner only)
- **Cancel Vault** — Close vault and reclaim funds before expiration (owner only)
- **Claim** — Automatic distribution to heirs after inactivity period expires (anyone can execute, keeper receives gas reimbursement + fee)

### Frontend
- **Gold Premium Dark Theme** — Unified visual identity with glass effects and semantic tokens
- **Wallet Connection** — Phantom, Solflare via Solana Wallet Adapter
- **Vault Management** — Create, monitor, deposit, heartbeat, and cancel vaults
- **Heir Dashboard** — Dedicated page for beneficiaries with live polling
- **Notification Preferences** — Register email/phone for heartbeat, deposit, expiry, and claim alerts
- **Explorer Integration** — Direct links to Solana Explorer/Solscan for all transactions

### Keeper Service
- **On-Chain Sync** — Automatically sync vaults, heirs, and assets to Supabase
- **Heartbeat Processing** — Validate and submit Mode B heartbeats with Ed25519Program verification
- **Claim Execution** — Monitor expired vaults and execute claims automatically
- **Notifications** — Email (Resend) + SMS (Twilio) with 6 templates and 24h deduplication cooldown
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

## Deployed URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://herita.xyz |
| Keeper (Railway) | https://crypto-heranca-keeper-production.up.railway.app |
| Supabase | https://naotxbbzuexiaiwbmikr.supabase.co |
| Solana Devnet | https://explorer.solana.com/address/8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX?cluster=devnet |

## Security

This project follows the Safe Solana Builder guidelines:

- Signer & ownership checks on all privileged instructions
- PDA validation with canonical bumps and seed isolation
- Checked math on all financial operations
- Ed25519 signature verification via instruction sysvar
- No admin keys or upgrade authority (immutable program)
- Duplicate heir prevention
- Status lifecycle tracking (Active → Claimed/Cancelled)

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
