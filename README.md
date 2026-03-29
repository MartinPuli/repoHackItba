<p align="center">
  <img src="frontend/public/logo-verde.png" alt="Vaultix" width="80" />
</p>

<h1 align="center">Vaultix — Smart Recovery Vault</h1>

<p align="center">
  Non-custodial digital vault that protects on-chain assets and ensures access continuity through guardians and recovery contacts.<br/>
  <strong>Built at HackITBA 2026.</strong>
</p>

<p align="center">
  <img alt="Solidity" src="https://img.shields.io/badge/Solidity-^0.8.24-363636?logo=solidity" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs" />
  <img alt="BSC Testnet" src="https://img.shields.io/badge/BSC_Testnet-97-F0B90B?logo=binance" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## Problem

In crypto the biggest risk isn't volatility — it's **losing access**. A lost seed phrase, a hacked device, or prolonged inactivity can lock funds forever.

## Solution

Vaultix lets you create a digital vault linked to your wallet with two human security layers:

- **Guardians (×2)** — Approve every withdrawal. Protect against hacks and unauthorized transfers.
- **Recovery Contacts (×2)** — Claim funds after prolonged owner inactivity. Ensure continuity of access.

```
┌─────────────┐     ┌──────────────────────┐
│   OWNER     │────▶│       VAULTIX         │
│  (wallet)   │     │   (vault on-chain)    │
└─────────────┘     └──────────┬────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
         ┌──────▼─────┐ ┌─────▼──────┐ ┌─────▼──────┐
         │ Guardian 1  │ │ Guardian 2  │ │ Recovery 1 │
         │ (approves   │ │ (approves   │ │ (claims    │
         │  withdraws) │ │  withdraws) │ │  funds)    │
         └────────────┘ └────────────┘ └────────────┘
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **Smart Contracts** | Solidity ^0.8.24, Hardhat, Ethers.js |
| **Chain** | BSC Testnet (chainId 97) |
| **Frontend** | Next.js 14 (App Router), Wagmi v2, Viem, TailwindCSS, Reown AppKit |
| **Backend** | Express, TypeScript, Supabase (Auth + DB) |
| **Auth** | Wallet signature (MetaMask / WalletConnect / Lemon) → Supabase session + WebAuthn biometric step-up |
| **Wallets** | MetaMask, WalletConnect, Coinbase, Trust Wallet, Lemon Cash, Binance |

---

## Project Structure

```
contracts/                  # Solidity smart contracts
├── src/                    # Factory, StrongBox, Owner, Guardian, Heir, StrongBoxERC20
├── test/                   # Hardhat tests (Factory, StrongBox, Integration)
├── deploy/                 # BSC Testnet deploy script
└── scripts/                # ABI sync script

frontend/                   # Next.js 14 App Router
├── app/                    # Pages: /, connect, role, safe/configure, safe/owner, guardian, heir
│   ├── error.tsx           # Error boundary (Vaultix design tokens)
│   ├── global-error.tsx    # Root error boundary
│   └── not-found.tsx       # 404 page
├── components/vault/       # VaultShell, VaultPrimitives (shared UI system)
├── context/                # VaultFlowContext (configure form state), LemonContext (Lemon SDK)
├── hooks/                  # useAuth, useSupabase, useStrongBoxChain, useWebAuthn
└── lib/                    # Wagmi config, Supabase client, contract ABIs, API client, Lemon SDK

api/                        # Express + TypeScript backend (port 3001)
├── src/controllers/        # auth, balance, strongbox, deploy, deposit, withdrawal, guardian
├── src/services/           # Business logic, chain provider, WebAuthn
├── src/middlewares/        # requireAuth (JWT), errorHandler, asyncHandler
├── src/types/              # Database types, Express augmentation
└── supabase/migrations/    # SQL schema

docs/                       # Design docs, API spec, security notes, rubric
```

---

## Smart Contract Architecture

```
Factory
  └── createStrongBox(guardian1, guardian2, heir1, heir2, timeLimit)
      ├── deploy Guardian(guardian1, guardian2)
      ├── deploy Heir(heir1, heir2)
      └── deploy StrongBox(owner, guardianAddr, heirAddr, timeLimit)

StrongBox (inherits Owner)
  ├── deposit()              → owner deposits, resets inactivity timer
  ├── withdraw(amount, to)   → owner creates withdrawal request
  ├── approveWithdrawal(id)  → guardian approves (auto-executes if both approve)
  ├── rejectWithdrawal(id)   → guardian rejects (cancels request)
  └── inherit()              → recovery contact claims 50% after inactivity
```

### Secure Withdrawal Flow

1. Owner calls `withdraw(amount, to)` → creates a `WithdrawalRequest`
2. Guardian 1 calls `approveWithdrawal(id)` → registers approval
3. Guardian 2 calls `approveWithdrawal(id)` → **auto-executes** the transfer
4. If any guardian calls `rejectWithdrawal(id)` → cancels the request
5. Only 1 active request at a time

### Recovery by Inactivity

1. Owner doesn't interact for `timeLimit` seconds
2. `block.timestamp - lastTimeUsed >= timeLimit` → recovery enabled
3. Recovery Contact 1 calls `inherit()` → claims 50% (snapshot of balance)
4. Recovery Contact 2 calls `inherit()` → claims the remaining 50%
5. Each contact can only claim once

### Inactivity Timer

- Resets automatically on `deposit()` and `withdraw()`
- `timeLimit` is immutable (set at deployment)
- No manual check-in — any vault operation resets the timer

---

## Quick Start

```bash
# 1. Install dependencies
cd contracts && npm install
cd ../api && npm install
cd ../frontend && npm install

# 2. Configure environment variables
cp contracts/.env.example contracts/.env
cp api/.env.example api/.env
cp frontend/.env.example frontend/.env.local
# Fill in your keys (see Environment Variables below)

# 3. Compile contracts & run tests
cd contracts
npx hardhat compile
npx hardhat test

# 4. Deploy to BSC Testnet (optional)
npx hardhat run deploy/deploy.ts --network bscTestnet

# 5. Start the backend (port 3001)
cd ../api && npm run dev

# 6. Start the frontend (port 3000)
cd ../frontend && npm run dev
```

---

## Environment Variables

### `frontend/.env.local`

```env
NEXT_PUBLIC_BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/
NEXT_PUBLIC_FACTORY_ADDRESS=          # After contract deploy
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID= # From cloud.reown.com
NEXT_PUBLIC_SUPABASE_URL=             # Optional: without it app runs in demo mode
NEXT_PUBLIC_SUPABASE_ANON_KEY=        # Optional
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### `api/.env`

```env
PORT=3001
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
WEBAUTHN_RP_ID=localhost
FRONTEND_ORIGIN=http://localhost:3000
```

### `contracts/.env`

```env
DEPLOYER_PRIVATE_KEY=
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
BSCSCAN_API_KEY=
```

---

## Frontend Pages

| Route | Role | Description |
|-------|------|-------------|
| `/` | — | Landing page with product overview |
| `/connect` | — | Wallet connection (AppKit: MetaMask, WalletConnect, Lemon, etc.) |
| `/role` | — | Role selection after connecting + auto sign-in |
| `/safe/configure` | Owner | Set guardians, recovery contacts, and owner email + biometric step-up |
| `/safe/owner` | Owner | Dashboard: balance, deposit, withdraw, deploy, inactivity countdown |
| `/guardian` | Guardian | Review and approve/reject withdrawal requests |
| `/heir` | Recovery | Track inactivity countdown and claim funds |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | — | Health check |
| `GET` | `/api/auth/me` | JWT | Upsert user, returns roles (`has_strongbox`, `is_guardian`, `is_heir`) |
| `POST` | `/api/strongbox/setup` | JWT | Create vault + guardians + recovery contacts in DB |
| `POST` | `/api/strongbox/confirm-deploy` | JWT | Confirm on-chain deploy (saves contract address + tx hash) |
| `POST` | `/api/strongbox/confirm-deposit` | JWT | Record and verify a deposit transaction on-chain |
| `GET` | `/api/strongbox/balance` | JWT | Get vault balance (on-chain RPC or mock fallback) |
| `POST` | `/api/strongbox/withdraw/request` | JWT | Create withdrawal request |
| `GET` | `/api/strongbox/withdraw/pending` | JWT | List pending withdrawal requests |
| `POST` | `/api/strongbox/withdraw/:id/approve` | JWT | Guardian approves withdrawal |
| `POST` | `/api/strongbox/withdraw/:id/reject` | JWT | Guardian rejects withdrawal |
| `POST` | `/api/strongbox/withdraw/:id/executed` | JWT | Mark withdrawal as executed |
| `GET` | `/api/guardian/pending` | JWT | Guardian: list pending requests across all vaults |
| `GET` | `/api/guardian/vaults` | JWT | Guardian: list assigned vaults |
| `GET` | `/api/heir/vaults` | JWT | Recovery: list assigned vaults with countdown info |
| `GET` | `/api/webauthn/status` | JWT | Check if user has registered biometric credential |
| `GET` | `/api/webauthn/register/options` | JWT | WebAuthn registration challenge |
| `POST` | `/api/webauthn/register/verify` | JWT | Verify WebAuthn registration |
| `GET` | `/api/webauthn/authenticate/options` | JWT | WebAuthn authentication challenge |
| `POST` | `/api/webauthn/authenticate/verify` | JWT | Verify WebAuthn authentication |

---

## Database Schema (Supabase)

| Table | Purpose |
|-------|---------|
| `users` | Wallet address, email, timestamps |
| `strongboxes` | Vault: contract_address, balance, time_limit, recovery_state, is_deployed |
| `guardians` | 2 per vault (slot 1, 2): address + email |
| `recovery_contacts` | 2 per vault (slot 1, 2): address + email + share % |
| `withdrawal_requests` | Requests: amount, to, status, per-guardian approvals |
| `transactions` | History: deposit, withdraw, recovery |
| `alerts` | Notifications: pending withdrawal, recovery initiated, inactivity |
| `user_authenticators` | WebAuthn credentials for biometric step-up |

---

## Demo Flow

1. **Connect wallet** → MetaMask / WalletConnect / Lemon Cash via Reown AppKit
2. **Choose role** → Create Safe / Guardian / Recovery
3. **Configure vault** → Set 2 guardians + 2 recovery contacts (with emails + wallets) + biometric registration
4. **Deploy on-chain** → Factory creates StrongBox + Guardian + Heir contracts on BSC Testnet
5. **Deposit BNB** → Owner deposits into the vault (resets inactivity timer)
6. **Request withdrawal** → Owner requests, both guardians approve → funds released
7. **Recovery** → If owner goes inactive past the time limit, recovery contacts claim their 50% share

---

## Security

- **2-of-2 guardian approval** for every withdrawal
- **Inactivity timer** resets on deposit/withdraw — no manual check-in
- **One active request** at a time — prevents approval confusion
- **WebAuthn biometric step-up** before vault creation
- **Checks-Effects-Interactions** pattern in all Solidity transfers
- **Custom Solidity errors** with descriptive parameters
- **Replay protection** via nonces + chainId
- **Non-custodial** — funds live in the smart contract, never in a backend

See [`docs/SEGURIDAD-HERENCIA.md`](docs/SEGURIDAD-HERENCIA.md) for the full security model.

---

## What This Is NOT

- Not an exchange
- Not custodial (funds live in a smart contract, not with us)
- Not primarily a digital will or legal succession system
- Not a multi-sig — it's a programmable recovery vault

---

## Team

Hackathon ITBA 2026

## License

MIT
