# Vaultix — Smart Recovery Vault

> Non-custodial digital vault that protects on-chain assets and ensures access continuity through guardians and recovery contacts. Built at Hackathon ITBA 2026.

## Problem

In crypto the biggest risk isn't volatility — it's **losing access**. Today someone can lose their seed phrase, get hacked, or go inactive — and the funds are locked forever.

## Solution

Vaultix lets you create a digital vault linked to your wallet with two human security layers:

- **Guardians (×2)**: Approve every withdrawal. Protect against hacks and unauthorized transfers.
- **Recovery Contacts (×2)**: Claim funds after prolonged owner inactivity. Ensure continuity of access.

```
┌─────────────┐     ┌──────────────────────┐
│   OWNER     │────▶│      STRONGBOX        │
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

## Tech Stack

| Layer | Tech |
|-------|------|
| **Smart Contracts** | Solidity ^0.8.24, Hardhat, Ethers.js |
| **Chain** | BSC Testnet (chainId 97) |
| **Frontend** | Next.js 14 (App Router), Wagmi v2, Viem, TailwindCSS, Reown AppKit |
| **Backend** | Express, TypeScript, Supabase (auth + DB) |
| **Auth** | Wallet signature (MetaMask / WalletConnect) → Supabase session + WebAuthn step-up |

## Project Structure

```
contracts/              # Solidity smart contracts
├── src/                # Factory, StrongBox, Owner, Guardian, Heir
├── test/               # Hardhat tests (Factory, StrongBox, Integration)
└── deploy/             # BSC Testnet deploy script

frontend/               # Next.js 14 App Router
├── app/                # Pages: /, connect, role, safe/configure, safe/owner, guardian, heir
├── components/vault/   # VaultShell, VaultPrimitives (shared UI)
├── context/            # VaultFlowContext (configure form state)
├── hooks/              # useAuth, useSupabase, useStrongBoxChain, useWebAuthn
└── lib/                # Wagmi config, Supabase client, contract ABIs, API client

api/                    # Express + TypeScript backend
├── src/controllers/    # auth, balance, strongbox, deploy, deposit, withdrawal, guardian
├── src/services/       # Business logic + chain provider
├── src/middlewares/     # requireAuth (JWT), errorHandler, asyncHandler
└── supabase/migrations/# SQL schema (users, strongboxes, guardians, recovery_contacts, etc.)

docs/                   # Design docs, API spec, security notes
```

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
1. Owner calls `withdraw(amount, to)` → creates a WithdrawalRequest
2. Guardian 1 calls `approveWithdrawal(id)` → registers approval
3. Guardian 2 calls `approveWithdrawal(id)` → auto-executes the transfer
4. If any guardian calls `rejectWithdrawal(id)` → cancels the request
5. Only 1 active request at a time

### Recovery by Inactivity
1. Owner doesn't interact for `timeLimit` seconds
2. Recovery Contact 1 calls `inherit()` → claims 50% (snapshot of balance)
3. Recovery Contact 2 calls `inherit()` → claims the rest
4. Each contact can only claim once

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
# Fill in your keys (Supabase, WalletConnect project ID, deployer key)

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

## Environment Variables

### `frontend/.env.local`
```
NEXT_PUBLIC_BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/
NEXT_PUBLIC_FACTORY_ADDRESS=          # After deploy
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID= # From cloud.reown.com
NEXT_PUBLIC_SUPABASE_URL=             # Optional: without it app runs in demo mode
NEXT_PUBLIC_SUPABASE_ANON_KEY=        # Optional
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### `api/.env`
```
PORT=3001
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
WEBAUTHN_RP_ID=localhost
FRONTEND_ORIGIN=http://localhost:3000
```

### `contracts/.env`
```
DEPLOYER_PRIVATE_KEY=
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
BSCSCAN_API_KEY=
```

## Frontend Pages

| Route | Role | Description |
|-------|------|-------------|
| `/` | — | Landing page |
| `/connect` | — | Wallet connection (AppKit: MetaMask, WalletConnect, Lemon, etc.) |
| `/role` | — | Role selection after connecting |
| `/safe/configure` | Owner | Set guardians, recovery contacts, and email |
| `/safe/owner` | Owner | Dashboard: balance, deposit, withdraw, deploy, inactivity countdown |
| `/guardian` | Guardian | Review and approve/reject withdrawal requests |
| `/heir` | Recovery | Track inactivity countdown and claim funds |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/auth/me` | JWT | Upsert user, returns `has_strongbox` |
| POST | `/api/strongbox/setup` | JWT | Create vault + guardians + recovery contacts in DB |
| POST | `/api/strongbox/confirm-deploy` | JWT | Confirm on-chain deploy (save contract address) |
| POST | `/api/strongbox/confirm-deposit` | JWT | Record a deposit transaction |
| GET | `/api/strongbox/balance` | JWT | Get vault balance (on-chain RPC or mock) |
| POST | `/api/strongbox/withdraw/request` | JWT | Create withdrawal request |
| GET | `/api/strongbox/withdraw/pending` | JWT | List pending withdrawal requests |
| POST | `/api/strongbox/withdraw/:id/approve` | JWT | Guardian approves |
| POST | `/api/strongbox/withdraw/:id/reject` | JWT | Guardian rejects |
| GET | `/api/guardian/pending` | JWT | Guardian: list pending requests across vaults |
| GET | `/api/guardian/vaults` | JWT | Guardian: list assigned vaults |
| GET | `/api/heir/vaults` | JWT | Recovery: list assigned vaults with countdown |

## Demo Flow

1. **Connect wallet** → MetaMask / WalletConnect via AppKit
2. **Choose role** → Create Safe / Guardian / Recovery
3. **Configure vault** → Set 2 guardians + 2 recovery contacts (with emails + wallets)
4. **Deploy on-chain** → Factory creates StrongBox + Guardian + Heir contracts
5. **Deposit BNB** → Owner deposits into the vault
6. **Request withdrawal** → Owner requests, both guardians approve → funds released
7. **Recovery** → If owner goes inactive past the time limit, recovery contacts can claim

## What This Is NOT

- Not an exchange
- Not custodial (funds live in a smart contract, not with us)
- Not primarily a digital will
- Not a legal succession system

## Team

Hackathon ITBA 2026

## License

MIT
