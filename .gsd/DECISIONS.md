# Decisiones de Arquitectura

## D001 — Blockchain principal
- **Decisión**: Blockchain para deploy de Smart Contracts
- **Elección**: BSC Testnet (BNB Smart Chain)
- **Razón**: Venus Protocol es nativo de BSC. Alineado con yield spread model. Cross-chain con Rootstock para rBTC yields.
- **Scope**: architecture
- **Revisable**: Sí

## D002 — Framework de Smart Contracts
- **Decisión**: Framework para desarrollo y testing de contratos
- **Elección**: Hardhat + Ethers.js
- **Razón**: Mayor documentación, plugins maduros para ERC-4337, compatibilidad con OpenZeppelin.
- **Scope**: architecture
- **Revisable**: No

## D003 — Framework de Frontend
- **Decisión**: Stack de frontend para la dApp
- **Elección**: Next.js App Router + Wagmi v2 + Viem + TailwindCSS
- **Razón**: SSR/RSC para performance, Wagmi para wallet connection con BSC, ideal para demo rápida.
- **Scope**: architecture
- **Revisable**: No

## D004 — Account Abstraction
- **Decisión**: Estándar de abstracción de cuentas
- **Elección**: ERC-4337 con Paymaster custom
- **Razón**: Elimina custodia centralizada. Paymaster subsidia gas y cobra en stablecoins/ARS con markup. Contratos Factory→Wallet→CajaFuerte.
- **Scope**: architecture
- **Revisable**: No

## D005 — Modelo de Autonomía del Agente
- **Decisión**: Niveles de control del agente AI
- **Elección**: Toggle 3 niveles: Asistente → Co-Piloto → Autónomo
- **Razón**: Core UX del producto. Cada nivel incrementa permisos on-chain/off-chain. Compliance UIF/CNV en nivel medio. Agentic Commerce en nivel alto.
- **Scope**: architecture
- **Revisable**: Sí

## D006 — Protocolo DeFi para Yield
- **Decisión**: Protocolos para estrategia de yield spread
- **Elección**: Venus Protocol (BSC) para colateral/préstamo + Sovryn/Tropykus (Rootstock) para rendimiento
- **Razón**: Venus es el Aave de BSC con tasas competitivas. Rootstock ofrece yields en rBTC que superan tasas de préstamo.
- **Scope**: architecture
- **Revisable**: Sí
