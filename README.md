<p align="center">
  <img src="frontend/public/logo-verde.png" alt="Vaultix" width="100" />
</p>

<h1 align="center">Vaultix</h1>

<p align="center">
  <strong>Smart Recovery Vault — Never lose access to your digital assets.</strong>
</p>

<p align="center">
  Non-custodial on-chain vault with guardian-approved withdrawals and automatic recovery after inactivity.<br/>
  Built at <strong>HackITBA 2026</strong>.
</p>

<p align="center">
  <img alt="Solidity" src="https://img.shields.io/badge/Solidity-^0.8.24-363636?logo=solidity" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs" />
  <img alt="BSC Testnet" src="https://img.shields.io/badge/BSC_Testnet-97-F0B90B?logo=binance" />
  <img alt="Express" src="https://img.shields.io/badge/Express-4.x-000000?logo=express" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Auth+DB-3FCF8E?logo=supabase" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## 🔒 What is Vaultix?

**Vaultix** is a programmable smart vault that protects your crypto assets with two human security layers:

- **Guardians (×2)** — Must approve every withdrawal. Protects against hacks and unauthorized transfers.
- **Recovery Contacts (×2)** — Can claim funds after prolonged owner inactivity. Ensures continuity of access.

It is **not** a multisig, **not** an exchange, and **not** custodial. Your funds live in a smart contract on BNB Chain — nobody else controls them.

```
                    ┌─────────────────────────────┐
                    │         VAULTIX VAULT        │
                    │     (Smart Contract on BSC)  │
                    └─────────────┬───────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
  ┌─────▼──────┐           ┌─────▼──────┐           ┌──────▼──────┐
  │   OWNER    │           │ GUARDIAN ×2 │           │ RECOVERY ×2 │
  │ (your key) │           │  (approve   │           │ (claim after│
  │            │           │  withdraws) │           │ inactivity) │
  └────────────┘           └────────────┘           └─────────────┘
```

### The Problem

In crypto, the biggest risk isn't volatility — it's **losing access**:
- Lost seed phrase → funds locked forever
- Hacked device → unauthorized transfers
- Prolonged inactivity → no one can recover the funds
- Single point of failure → no safety net

### The Solution

Vaultix adds a programmable security layer on top of your wallet:
1. **Every withdrawal requires 2-of-2 guardian approval** — even if your key is compromised, attackers can't drain funds without your guardians
2. **Automatic recovery after inactivity** — if you can't access your wallet for an extended period, your recovery contacts can claim the funds
3. **100% non-custodial** — the smart contract holds the funds, not Vaultix

---

## 🏗️ Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Smart Contracts** | Solidity ^0.8.24, Hardhat | Vault logic, guardian approval, recovery |
| **Blockchain** | BSC Testnet (chainId 97) | On-chain deployment |
| **Frontend** | Next.js 14 (App Router), Wagmi v2, Viem, TailwindCSS | User interface for all 3 roles |
| **Backend** | Express + TypeScript | Auth, DB sync, on-chain verification |
| **Database** | Supabase (Auth + PostgreSQL) | User profiles, vault metadata, withdrawal tracking |
| **Wallets** | Reown AppKit (MetaMask, WalletConnect, Coinbase, Trust, Binance, Lemon Cash) | Wallet connection |

### Smart Contract Architecture

```
Factory (deployed once)
  └── createStrongBox(guardian1, guardian2, heir1, heir2, timeLimit)
      ├── deploy → Guardian(guardian1, guardian2)
      ├── deploy → Heir(heir1, heir2)
      └── deploy → StrongBox(owner, guardianAddr, heirAddr, timeLimit)

StrongBox (one per user)
  ├── deposit()              → owner deposits BNB, resets inactivity timer
  ├── withdraw(amount, to)   → owner creates withdrawal request
  ├── approveWithdrawal(id)  → guardian approves (auto-executes if 2/2)
  ├── rejectWithdrawal(id)   → guardian rejects (cancels request)
  ├── inherit()              → recovery contact claims 50% after inactivity
  ├── getBalance()           → query vault balance
  └── getLastTimeUsed()      → last activity timestamp
```

---

## 🚀 Step-by-Step: How to Use Vaultix

### As an Owner (create & manage your vault)

1. **Connect your wallet** — Go to the app, click "Connect Wallet", and select MetaMask, WalletConnect, or any supported wallet
2. **Choose "My Safe"** — Select the Owner role from the role selection screen
3. **Configure your vault** — Enter the wallet addresses and emails of:
   - 2 Guardians (people you trust to approve withdrawals)
   - 2 Recovery Contacts (people who can recover funds if you're inactive)
4. **Deploy on-chain** — The Factory contract deploys your personal StrongBox + Guardian + Heir contracts on BSC Testnet
5. **Deposit BNB** — Send BNB to your vault. Every deposit resets the inactivity timer
6. **Request a withdrawal** — When you need funds, create a withdrawal request specifying the amount and destination address
7. **Wait for guardian approval** — Both guardians must approve for the withdrawal to execute

### As a Guardian (protect a vault)

1. **Connect your wallet** — Use the same wallet address the owner assigned as guardian
2. **Choose "Guardian Dashboard"** — You'll see pending withdrawal requests from vaults you protect
3. **Review the request** — Check the amount, destination, and decide:
   - ✅ **Approve** — Register your approval (if both guardians approve, funds are released automatically)
   - ❌ **Reject** — Cancel the withdrawal request entirely

### As a Recovery Contact (claim after inactivity)

1. **Connect your wallet** — Use the wallet address assigned as recovery contact
2. **Choose "Recovery Dashboard"** — See vaults where you're a recovery contact
3. **Monitor the countdown** — The inactivity timer shows how long since the owner's last action
4. **Execute Recovery** — Once the timer expires, call `inherit()` to claim your 50% share

---

## 📁 Project Structure

```
contracts/                  # Solidity smart contracts
├── src/                    # Factory, StrongBox, Owner, Guardian, Heir, StrongBoxERC20
├── test/                   # Hardhat tests (Factory, StrongBox, Integration)
├── deploy/                 # BSC Testnet deploy script
└── scripts/                # ABI sync script

frontend/                   # Next.js 14 — Full production app (Wagmi + Supabase + on-chain)
├── app/                    # Pages: /, connect, role, safe/configure, safe/owner, guardian, recoverer
├── components/             # VaultShell, VaultPrimitives, ChainGuard
├── hooks/                  # useAuth, useSupabase, useStrongBoxChain, useWebAuthn, useUnifiedWallet
├── context/                # VaultFlowContext, LemonContext
└── lib/                    # Wagmi config, Supabase client, contract ABIs, API client, Lemon SDK

frontend-demo/              # Next.js 14 — Demo mode (no wallet/Supabase required, mock data)
├── app/                    # Same pages with demo mock context
├── hooks/                  # useStrongBoxChain (mocked)
├── context/                # DemoMockContext (simulates wallet connection)
└── lib/                    # Same API client + ABIs

api/                        # Express + TypeScript backend (port 3001)
├── src/controllers/        # auth, balance, strongbox, deploy, deposit, withdrawal, guardian
├── src/services/           # Business logic, chain provider, WebAuthn, withdrawal, guardian
├── src/middlewares/        # requireAuth (JWT), errorHandler, asyncHandler
└── src/types/              # Database types, Express augmentation

docs/                       # Design docs, API spec, security model, hackathon rubric
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **npm** (included with Node.js)
- A wallet with BSC Testnet BNB ([faucet](https://www.bnbchain.org/en/testnet-faucet))

### 1. Clone the repository

```bash
git clone https://github.com/MartinPuli/repoHackItba.git
cd repoHackItba
```

### 2. Install dependencies

```bash
cd contracts && npm install && cd ..
cd api && npm install && cd ..
cd frontend && npm install && cd ..
cd frontend-demo && npm install && cd ..
```

### 3. Configure environment variables

```bash
cp api/.env.example api/.env
cp frontend/.env.example frontend/.env.local
cp frontend-demo/.env.example frontend-demo/.env.local
```

Fill in the values (see [Environment Variables](#-environment-variables) below).

### 4. Compile & test contracts

```bash
cd contracts
npx hardhat compile
npx hardhat test
```

### 5. Deploy to BSC Testnet (optional)

```bash
npx hardhat run deploy/deploy.ts --network bscTestnet
```

### 6. Start the backend

```bash
cd api
npm run dev
# → API listening on http://0.0.0.0:3001
```

### 7. Start the frontend

**Full app** (requires Supabase + wallet):
```bash
cd frontend
npm run dev
# → http://localhost:3000
```

**Demo mode** (no external dependencies, mock data):
```bash
cd frontend-demo
npm run dev
# → http://localhost:3000
```

---

## 🔑 Environment Variables

### `api/.env`

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: `3001`) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (⚠️ backend only, never expose) |
| `RPC_URL` | BSC Testnet RPC endpoint |
| `WEBAUTHN_RP_ID` | WebAuthn relying party ID (e.g. `localhost`) |
| `FRONTEND_ORIGIN` | Frontend URL for CORS (e.g. `http://localhost:3000`) |

### `frontend/.env.local`

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BSC_TESTNET_RPC` | BSC Testnet RPC URL |
| `NEXT_PUBLIC_FACTORY_ADDRESS` | Deployed Factory contract address |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | From [cloud.reown.com](https://cloud.reown.com) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (optional — without it, app runs in demo mode) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (optional) |
| `NEXT_PUBLIC_API_URL` | Backend URL (default: `http://localhost:3001`) |

---

## 🖥️ Frontend Pages

| Route | Role | Description |
|-------|------|-------------|
| `/` | — | Landing page with product overview and "How it works" |
| `/connect` | — | Wallet connection via Reown AppKit |
| `/role` | — | Role selection: Owner / Guardian / Recovery |
| `/safe/configure` | Owner | Set guardians, recovery contacts, email, and biometric step-up |
| `/safe/owner` | Owner | Dashboard: balance, deposit, withdraw, deploy, inactivity countdown |
| `/guardian` | Guardian | Review and approve/reject withdrawal requests |
| `/recoverer` | Recovery | Track inactivity countdown and claim funds |

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | — | Health check |
| `GET` | `/api/auth/me` | JWT | Upsert user, returns roles |
| `POST` | `/api/auth/wallet-reset` | — | Reset wallet association |
| `POST` | `/api/strongbox/setup` | JWT | Create vault + guardians + recovery contacts |
| `POST` | `/api/strongbox/confirm-deploy` | JWT | Confirm on-chain deploy (validates bytecode) |
| `POST` | `/api/strongbox/confirm-deposit` | JWT | Record and verify deposit on-chain |
| `GET` | `/api/strongbox/balance` | JWT | Vault balance (on-chain RPC) |
| `POST` | `/api/strongbox/withdraw/request` | JWT | Create withdrawal request |
| `GET` | `/api/strongbox/withdraw/pending` | JWT | List withdrawal requests |
| `POST` | `/api/strongbox/withdraw/:id/approve` | JWT | Guardian approves |
| `POST` | `/api/strongbox/withdraw/:id/reject` | JWT | Guardian rejects |
| `POST` | `/api/strongbox/withdraw/:id/executed` | JWT | Mark as executed (after on-chain tx) |
| `GET` | `/api/guardian/vaults` | JWT | Guardian: list assigned vaults |
| `GET` | `/api/guardian/pending` | JWT | Guardian: list pending requests |
| `GET` | `/api/heir/vaults` | JWT | Recovery: list assigned vaults |
| `GET` | `/api/webauthn/status` | JWT | WebAuthn credential status |
| `POST` | `/api/webauthn/register/*` | JWT | WebAuthn registration flow |
| `POST` | `/api/webauthn/authenticate/*` | JWT | WebAuthn authentication flow |

---

## 🛡️ Security Model

| Feature | Implementation |
|---------|---------------|
| **2-of-2 guardian approval** | Every withdrawal requires both guardians to approve |
| **Inactivity timer** | Resets on deposit/withdraw — no manual check-in needed |
| **One active request** | Only 1 pending withdrawal at a time — prevents approval confusion |
| **WebAuthn biometric step-up** | Optional biometric verification before vault creation |
| **On-chain verification** | Backend verifies deploy bytecode + deposit tx receipt against RPC |
| **Checks-Effects-Interactions** | Solidity pattern in all transfers to prevent reentrancy |
| **Custom Solidity errors** | Descriptive errors with parameters for better debugging |
| **Non-custodial** | Funds live in the smart contract — never in a backend or database |

See [`docs/SEGURIDAD-HERENCIA.md`](docs/SEGURIDAD-HERENCIA.md) for the full security model.

---

## 🗃️ Database Schema (Supabase)

| Table | Purpose |
|-------|---------|
| `users` | Wallet address, email, timestamps |
| `strongboxes` | Vault: contract_address, balance, time_limit, recovery_state, is_deployed |
| `guardians` | 2 per vault (slot 1, 2): address + email |
| `recovery_contacts` | 2 per vault (slot 1, 2): address + email + share % |
| `withdrawal_requests` | Requests: amount, to, status, per-guardian approvals |
| `transactions` | History: deposit, withdraw, recovery |
| `alerts` | Notifications: pending withdrawal, recovery, inactivity |
| `user_authenticators` | WebAuthn credentials for biometric step-up |

See [`docs/SUPABASE-SCHEMA.md`](docs/SUPABASE-SCHEMA.md) for the full SQL schema.

---

## 🎯 Demo Flow

1. **Connect wallet** → MetaMask / WalletConnect / Lemon Cash via Reown AppKit
2. **Choose role** → Create Safe / Guardian / Recovery
3. **Configure vault** → Set 2 guardians + 2 recovery contacts (wallet + email) + biometric registration
4. **Deploy on-chain** → Factory creates StrongBox + Guardian + Heir contracts on BSC Testnet
5. **Deposit BNB** → Owner deposits into the vault (resets inactivity timer)
6. **Request withdrawal** → Owner requests, both guardians approve → funds released
7. **Recovery** → If owner goes inactive past the time limit, recovery contacts claim their 50% share

> 💡 **Try the demo without a wallet:** Run `frontend-demo` for a fully interactive demo with mock data — no MetaMask, no Supabase, no testnet BNB required.

---

## 💰 Business Model

| Revenue Stream | Description |
|---------------|-------------|
| **Deploy fee** | One-time fee when creating a vault on-chain |
| **Withdrawal fee** | Small % on executed withdrawals |
| **Premium tier** | More guardians, custom time limits, multi-channel notifications |

---

## 🚫 What Vaultix is NOT

- **Not an exchange** — You deposit and withdraw your own funds
- **Not custodial** — Funds live in a smart contract, not with us
- **Not a digital will** — It's a programmable recovery vault, not a legal succession tool
- **Not a multisig** — It's role-based (owner + guardians + recovery contacts)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [`docs/API.md`](docs/API.md) | Full API specification |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Design decisions and architecture |
| [`docs/SUPABASE-SCHEMA.md`](docs/SUPABASE-SCHEMA.md) | Complete SQL schema |
| [`docs/SEGURIDAD-HERENCIA.md`](docs/SEGURIDAD-HERENCIA.md) | Security model and threat analysis |
| [`docs/LEMON-INTEGRATION.md`](docs/LEMON-INTEGRATION.md) | Lemon Cash Mini App integration |
| [`docs/INTEGRACION-CONTRATOS.md`](docs/INTEGRACION-CONTRATOS.md) | Contract integration guide |
| [`docs/RUBRICA-HACKITBA.md`](docs/RUBRICA-HACKITBA.md) | Hackathon rubric mapping |

---

## 🧑‍💻 Tech Stack Summary

```
┌──────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│  Next.js 14 · Wagmi v2 · Viem · TailwindCSS · AppKit    │
├──────────────────────────────────────────────────────────┤
│                       BACKEND                            │
│  Express · TypeScript · Supabase JS · Ethers.js 6        │
├──────────────────────────────────────────────────────────┤
│                      DATABASE                            │
│  Supabase (PostgreSQL + Auth + RLS)                      │
├──────────────────────────────────────────────────────────┤
│                    SMART CONTRACTS                        │
│  Solidity 0.8.24 · Hardhat · BSC Testnet                 │
└──────────────────────────────────────────────────────────┘
```

---

## 👥 Team

**HackITBA 2026**

---

## 📄 License

MIT
