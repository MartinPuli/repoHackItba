# M001 — Setup & Scaffolding

**Objetivo**: Inicializar monorepo, configurar Hardhat para BSC Testnet, scaffoldear Next.js frontend, y estructura del agente.

**Deadline**: Primeras 2-4 horas del hackathon

## Slices

### S01 — Hardhat Setup
- Inicializar proyecto Hardhat con TypeScript
- Configurar redes: BSC Testnet, RSK Testnet, Hardhat local
- Instalar OpenZeppelin contracts
- Configurar .env con private keys y RPC URLs

### S02 — Frontend Setup
- Crear app Next.js 14+ con App Router y TypeScript
- Configurar Wagmi v2 + Viem para BSC Testnet
- Setup TailwindCSS
- Crear layout base con wallet connection

### S03 — Agent Setup
- Crear estructura del módulo del agente
- Definir interfaces para los 3 niveles de autonomía
- Setup de configuración básica

### S04 — CI/Deploy Pipeline
- Scripts de deploy para BSC Testnet
- Verificación de contratos en BscScan

## Criterio de Éxito
- `npx hardhat compile` pasa sin errores
- Frontend corre en localhost con wallet connection a BSC Testnet
- Deploy script funciona en testnet
