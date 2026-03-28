# StrongBox — Smart Recovery Vault

> Caja fuerte cripto con seguridad humana y recuperacion inteligente. No custodial, programable y auditable.

## Problema

En cripto, el mayor riesgo no es la volatilidad, sino la **perdida de acceso**. Hoy una persona puede perder su seed phrase, ser hackeada, o quedar inactiva — y los fondos quedan bloqueados para siempre.

## Solucion

StrongBox permite crear una caja fuerte digital asociada a tu wallet con dos capas humanas de seguridad:

- **Guardianes**: Validan retiros. Protegen contra hackeos y retiros no autorizados.
- **Recovery Contacts**: Recuperan fondos cuando el owner pierde acceso o queda inactivo.

## Arquitectura

```
┌─────────────┐     ┌──────────────────────┐
│   OWNER     │────▶│     STRONGBOX         │
│  (MetaMask) │     │  (vault on-chain)     │
└─────────────┘     └──────────┬────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
         ┌──────▼─────┐ ┌─────▼──────┐ ┌─────▼──────┐
         │ Guardian 1  │ │ Guardian 2  │ │ Recovery 1 │
         │ (aprueba    │ │ (aprueba    │ │ (recupera  │
         │  retiros)   │ │  retiros)   │ │  fondos)   │
         └────────────┘ └────────────┘ └────────────┘
```

## Tech Stack

- **Contracts**: Solidity, Hardhat, Ethers.js, OpenZeppelin
- **Chain**: BSC Testnet
- **Frontend**: Next.js 14, Wagmi v2, Viem, TailwindCSS
- **Backend**: Express, Supabase (auth + DB)
- **Auth**: MetaMask + Supabase Web3 login

## Estructura

```
├── contracts/          # Smart contracts Solidity
│   ├── src/            # Factory, StrongBox, Owner, Guardian
│   ├── test/           # Tests
│   └── deploy/         # Scripts de deploy
├── frontend/           # Next.js App Router
│   ├── app/            # Rutas y paginas
│   ├── components/     # Componentes por rol
│   └── lib/            # Config Wagmi, ABIs
├── api/                # Backend Express + Supabase
│   ├── src/            # Rutas, middleware
│   └── supabase/       # Migraciones SQL
└── docs/               # Documentacion
```

## Quick Start

```bash
# 1. Instalar dependencias
cd contracts && npm install
cd ../frontend && npm install
cd ../api && npm install

# 2. Configurar variables de entorno
cp contracts/.env.example contracts/.env
cp frontend/.env.example frontend/.env.local
cp api/.env.example api/.env

# 3. Compilar contratos
cd contracts && npx hardhat compile

# 4. Correr tests
npx hardhat test

# 5. Deploy a BSC Testnet
npx hardhat run deploy/deploy.ts --network bscTestnet

# 6. Correr frontend
cd ../frontend && npm run dev

# 7. Correr backend
cd ../api && npm run dev
```

## Flujos principales

### Retiro seguro
1. Owner solicita retiro
2. Guardian 1 aprueba
3. Guardian 2 aprueba
4. Owner ejecuta

### Recuperacion por inactividad
1. Owner no interactua por el tiempo limite
2. Recovery contacts pueden reclamar fondos

### Recuperacion por perdida de acceso
1. Owner pierde wallet
2. Recovery contacts intervienen

## Equipo

Hackathon ITBA 2026

## Licencia

MIT
