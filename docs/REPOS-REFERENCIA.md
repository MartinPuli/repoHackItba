# Repositorios de Referencia y Codigo Abierto

## Repositorios para Clonar e Integrar

### 1. TradingAgents — Framework Multi-Agente de Trading

- **Repo**: `TauricResearch/TradingAgents`
- **Que es**: Framework multi-agente open-source que simula firmas de trading reales
- **Agentes incluidos**: Analistas fundamentales, gestores de riesgo, traders LLM
- **Uso en nuestro proyecto**:
  - Adaptar agentes para analizar la API del broker InvertirOnline (IOL)
  - Reutilizar la arquitectura de debate multi-agente para nuestro framework COPPER
  - Extraer patrones de gestion de riesgo para el Risk Agent

### 2. Multi-Agent-AI-Finance-Assistant

- **Repo**: `Multi-Agent-AI-Finance-Assistant`
- **Que es**: Plataforma open-source para analisis financiero inteligente con LLMs
- **Uso en nuestro proyecto**:
  - Algoritmos financieros integrados (Sharpe ratio, drawdown analysis, etc.)
  - Pipeline de toma de decisiones financieras como referencia
  - Integracion con modelos de lenguaje para analisis de mercado

### 3. GOAT SDK — Great Open Agent Tools

- **Repo**: `goat-sdk/goat`
- **Que es**: SDK con plugins listos para que agentes AI interactuen con DeFi
- **Plugins relevantes**:
  - Interaccion nativa con wallets on-chain
  - Swaps y operaciones DeFi
  - Analisis de mercado crypto
- **Uso en nuestro proyecto**:
  - Plugin de wallet para que el agente interactue con nuestros contratos
  - Integracion con frameworks como Langchain o CrewAI
  - Operaciones DeFi pre-construidas (swaps, liquidity provision)

### 4. Coinbase Smart Wallet

- **Repo**: `coinbase/smart-wallet`
- **Que es**: Implementacion de referencia de smart wallet con Account Abstraction
- **Uso en nuestro proyecto**:
  - Patron de referencia para nuestro contrato Wallet
  - Manejo de Session Keys para el agente autonomo
  - Integracion con ERC-4337 EntryPoint

### 5. eth-infinitism/account-abstraction

- **Repo**: `eth-infinitism/account-abstraction`
- **Que es**: Implementacion oficial de referencia del estandar ERC-4337
- **Uso en nuestro proyecto**:
  - Interfaces de contratos EntryPoint y Paymaster
  - UserOperation struct y validacion
  - Patron de Bundler para meta-transacciones

## Mapa de Integracion

```
┌─────────────────────────────────────────────────────┐
│                   Nuestro Proyecto                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  agent/                                             │
│  ├── TradingAgents (debate multi-agente)            │
│  ├── Finance-Assistant (algoritmos financieros)     │
│  └── GOAT SDK (interaccion DeFi)                    │
│                                                     │
│  contracts/                                         │
│  ├── Coinbase Smart Wallet (patron Wallet)          │
│  ├── eth-infinitism (ERC-4337 interfaces)           │
│  └── Nuestros contratos custom                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Prioridad de Integracion para Hackathon

| Prioridad | Repo | Razon |
|-----------|------|-------|
| Alta | eth-infinitism/account-abstraction | Base para contratos ERC-4337 |
| Alta | GOAT SDK | Interaccion agente ↔ contratos |
| Media | TradingAgents | Arquitectura multi-agente |
| Media | Coinbase Smart Wallet | Patrones de referencia |
| Baja | Finance-Assistant | Nice-to-have para analisis avanzado |
