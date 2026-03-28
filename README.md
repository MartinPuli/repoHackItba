# Smart Wallet Agent-First 🤖💰

> Billetera fintech "Agent-First" para el mercado argentino. Gestor patrimonial autónomo con Account Abstraction (ERC-4337), DeFi cross-chain, y Agente AI con 3 niveles de autonomía.

## 🏗️ Arquitectura

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│   OWNER     │────▶│    WALLET       │────▶│    CAJA FUERTE       │
│  (Metamask) │     │ (liquidez diaria)│     │  (ahorros + DeFi)    │
└─────────────┘     └─────────────────┘     └──────────┬───────────┘
                                                        │
                    ┌─────────────────┐     ┌──────────▼───────────┐
                    │   PAYMASTER     │     │  Guardianes/herederos│
                    │  (gas sponsor)  │     │  Dead Man's Switch   │
                    └─────────────────┘     └──────────────────────┘
```

## 💡 Modelo de Negocio

| Pilar | Descripción | Revenue |
|-------|-------------|---------|
| **Yield Spread** | Colateral Venus (BSC) → Préstamo → Invertir Rootstock → rBTC | Performance fee |
| **Paymaster** | Subsidia gas, cobra en stablecoins/ARS | Markup de gas |
| **Off-Ramp** | Crypto → ARS para pagos QR | Spread cambiario |

## 🎛️ Niveles de Autonomía del Agente

| Nivel | Nombre | Permisos |
|-------|--------|----------|
| 🟢 Nulo | Asistente | Solo análisis. Humano firma todo. |
| 🟡 Medio | Co-Piloto | Notificaciones + compliance UIF/CNV |
| 🔴 Alto | Autónomo | Rebalanceo + Agentic Commerce |

## 🛠️ Tech Stack

- **Contracts**: Solidity, Hardhat, Ethers.js, OpenZeppelin
- **Chain**: BSC Testnet + Rootstock Testnet
- **Frontend**: Next.js 14 (App Router), Wagmi v2, Viem, TailwindCSS
- **Agente**: TypeScript, APIs de mercado, compliance engine

## 📁 Estructura

```
├── contracts/          # Smart contracts Solidity
│   ├── src/            # Contratos principales
│   ├── test/           # Tests unitarios e integración
│   ├── deploy/         # Scripts de deploy
│   └── interfaces/     # Interfaces y ABIs
├── frontend/           # Next.js App Router
│   ├── app/            # Rutas y páginas
│   ├── components/     # Componentes React
│   ├── hooks/          # Custom hooks (Wagmi, contratos)
│   └── lib/            # Utilidades y config
├── agent/              # Agente AI
│   ├── core/           # Motor principal
│   ├── modes/          # Asistente, Co-Piloto, Autónomo
│   └── integrations/   # Venus, Rootstock, IOL, compliance
└── docs/               # Documentación
```

## 🚀 Quick Start

```bash
# 1. Instalar dependencias
cd contracts && npm install
cd ../frontend && npm install

# 2. Configurar variables de entorno
cp contracts/.env.example contracts/.env
cp frontend/.env.example frontend/.env.local
# Editar con tus keys (BSC Testnet RPC, private key, etc.)

# 3. Compilar contratos
cd contracts && npx hardhat compile

# 4. Correr tests
npx hardhat test

# 5. Deploy a BSC Testnet
npx hardhat run deploy/deploy.ts --network bscTestnet

# 6. Correr frontend
cd ../frontend && npm run dev
```

## 📋 Requisitos Regulatorios

- **UIF**: Resolución 49/2024 — Límites de transacciones, reporte de operaciones sospechosas
- **CNV**: Resolución 1058/2025 — Regulación de activos digitales
- El agente en modo Co-Piloto monitorea compliance automáticamente

## 👥 Equipo

Hackathon ITBA 2026 — 4-6 personas

## 📄 Licencia

MIT
