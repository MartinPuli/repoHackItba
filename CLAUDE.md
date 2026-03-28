# Smart Wallet Agent-First — Contexto del Proyecto

## Que es
Billetera fintech "Agent-First" para el mercado argentino. Un gestor patrimonial autonomo que combina Smart Contracts en BSC, DeFi cross-chain (BSC + Rootstock), un Agente AI multicanal (App + Telegram + WhatsApp), y sistema de herencia con Dead Man's Switch. Hackathon ITBA 2026.

## Stack Tecnico
- **Smart Contracts**: Solidity ^0.8.10, Hardhat, Ethers.js
- **Chain principal**: BSC Testnet (BNB Smart Chain)
- **Cross-chain**: Rootstock (RSK) para rendimientos en rBTC
- **Frontend**: Next.js 14+ App Router, Wagmi v2, Viem, TailwindCSS
- **MCP Server**: Node.js, @modelcontextprotocol/sdk, Zod, ethers.js
- **Canales**: App (REST API), Telegram Bot, WhatsApp (Twilio)
- **Contratos**: Factory, Wallet, StrongBox, Owner (abstract), HeirGuardians (abstract)
- **Agente AI**: NLP intent detection, multi-agent consensus (compliance + risk + investment)
- **Base de datos**: Supabase (opcional, fallback in-memory)

## Arquitectura de Contratos
```
Factory (email → wallet address)
  |
  |-- createNewWallet(email)     → deploy Wallet, mapea email→address
  '-- createNewStrongBox(wallet) → deploy StrongBox, mapea wallet→strongbox

Owner (abstract)
  '-- OnlyOwner modifier, getOwner()

HeirGuardians (abstract, hereda de Owner)
  '-- setHeirGuardian1/2(), OnlyHeirGuardians modifier

Wallet
  |-- SendTo(address to) payable → envia BNB
  |-- Receive() payable          → recibe BNB
  '-- GetBalance()               → consulta balance

StrongBox (hereda de Owner + HeirGuardians)
  |-- deposit() payable OnlyOwner       → deposita en caja fuerte
  |-- withdraw() OnlyOwner              → retira (requiere confirm herederos)
  |-- inherit() OnlyHeirGuardians       → herencia (solo despues de timeLimit)
  |-- getBalance() OnlyOwner            → consulta balance
  '-- updateTime() OnlyOwner            → resetea Dead Man's Switch (1 año)
```

- **Factory**: Mapea `email → wallet address`. `createNewWallet(email)` y `createNewStrongBox(walletAddr)`
- **Wallet**: Billetera de gasto diario. `SendTo(to)`, `Receive()`, `GetBalance()`
- **StrongBox**: Caja fuerte con herencia. Dead Man's Switch (1 año). `deposit()`, `withdraw()`, `inherit()`
- **Owner**: Contrato abstracto con modifier `OnlyOwner` y `getOwner()`
- **HeirGuardians**: Contrato abstracto con `setHeirGuardian1/2()`, modifier `OnlyHeirGuardians`

## Arquitectura del Sistema Agentico
```
Canales de Entrada:
  App (frontend)  ──┐
  Telegram Bot    ──┼──► Channel Manager ──► Agent Orchestrator ──► MCP Tools (27)
  WhatsApp Bot    ──┘         |                    |
                              |              Multi-Agent Consensus
                         HTTP API :3001       (compliance + risk + investment)
                              |
                         Sessions + Conversational Flows
```

### MCP Server — 27 Tools
```
Wallet:      wallet_create, wallet_balance, wallet_info
Pagos:       wallet_deposit, wallet_withdraw, wallet_transfer, wallet_pay, wallet_request_payment
StrongBox:   strongbox_create, strongbox_set_heir, strongbox_info
Inversion:   yield_strategies, yield_invest, yield_withdraw, yield_portfolio
Prestamos:   loan_options, loan_take, loan_repay, loan_status
Compliance:  compliance_status, compliance_verify
Canales:     channel_list, channel_configure, channel_link_wallet
Discovery:   platform_info, transaction_history
Agente:      agent_chat (lenguaje natural → routing automatico)
```

## Modelo de Negocio
1. **Yield Spread**: Colateral en Venus (BSC) → Prestamo → Invertir en Rootstock → Performance fee
2. **Paymaster**: Subsidia gas, cobra en stablecoins/ARS con markup
3. **Lending**: Prestamos con colateral crypto (LTV 60-80%, tasas 3.5-5.2% APY)
4. **Off-Ramp**: Spread de conversion crypto→ARS para pagos QR

## Niveles de Autonomia del Agente
- **Nula (Asistente)**: Solo analisis, el humano firma todo
- **Media (Co-Piloto)**: Notificaciones proactivas, compliance UIF/CNV automatico
- **Alta (Autonomo)**: Rebalanceo automatico, Agentic Commerce (Stripe ACP, PayPal AP2)

## Estructura del Proyecto
```
/contracts              → Smart contracts Solidity
  /src                  → Factory.sol, Wallet.sol, StrongBox.sol, Owner.sol, HeirGuardians.sol
  /deploy               → Scripts de deploy Hardhat
  /test                 → Tests de contratos
/frontend               → Next.js App Router
  /app                  → page.tsx, layout.tsx, providers.tsx
  /components/dashboard → BalanceCards, AutonomySlider, KillSwitch, ActivityFeed,
                          DeadManStatus, YieldBreakdown, AgentChat
  /components/layout    → Sidebar, TopBar
  /lib/contracts        → ABIs y addresses
  /lib/wagmi            → Config Wagmi + BSC Testnet
/mcp-server             → MCP Server + HTTP API + Canales
  /src/tools            → wallet-manager, payment-engine, investment-engine,
                          lending-engine, compliance-engine, agent-orchestrator
  /src/channels         → channel-manager, telegram-bot, whatsapp-bot, http-server
  /src/db               → database.js (Supabase + in-memory fallback)
/agent                  → Logica del Agente AI (core, modes, integrations, utils)
/docs                   → Documentacion (14 archivos)
```

## Convenciones
- Solidity: Eventos para cada accion importante, custom errors
- Frontend: TypeScript estricto, componentes en /components con RSC por default
- MCP Server: ES modules, Zod schemas, JSDoc comments
- Commits: conventional commits (feat:, fix:, docs:, test:)
- Deploy: BSC Testnet para hackathon, Rootstock Testnet para cross-chain

## Aprendizaje Autonomo del Agente
El agente implementa 3 estrategias de auto-mejora (ver `docs/AGENTE-AUTONOMO.md`):
1. **AutoResearch Loop (Karpathy)**: Ciclo continuo de simulacion → evaluacion → ajuste de parametros de yield
2. **R-MCTS (Reflexion Contrastiva)**: Arbol de decisiones con aprendizaje de errores, ~30% mejora sin supervision
3. **COPPER (Multi-Agente)**: Debate entre Compliance, Inversion, Risk y Execution agents con consenso ponderado

## Repos de Referencia Open-Source
Repositorios clave para integrar (ver `docs/REPOS-REFERENCIA.md`):
- `TauricResearch/TradingAgents` → Framework multi-agente de trading
- `goat-sdk/goat` → Plugins para interaccion agente ↔ DeFi
- `coinbase/smart-wallet` → Patron de referencia ERC-4337
- `eth-infinitism/account-abstraction` → Interfaces EntryPoint/Paymaster

## Integracion Agente ↔ Contratos
Flujo de interaccion del agente con cada contrato (ver `docs/INTEGRACION-CONTRATOS.md`):

- **Factory**: Agente orquesta `createNewWallet(email)` y `createNewStrongBox(walletAddr)`
- **Wallet**: Agente usa `SendTo(to)` para pagos, `Receive()` para depositos, `GetBalance()` para consultas
- **StrongBox**: Agente ejecuta `deposit()` para ahorros, `withdraw()` requiere confirm herederos
- **HeirGuardians**: `setHeirGuardian1/2(addr)` para configurar herederos via Owner
- **Dead Man's Switch**: Agente llama `updateTime()` al detectar actividad del usuario (timeout 1 año)
- **Herencia**: `inherit()` solo ejecutable por herederos despues del timeLimit

## UX Agentico — Perilla de Autonomia
Diseno de interfaz para transicionar de manipulacion directa a supervision por permisos (ver `docs/UX-AUTONOMIA.md`):
- **Slider 3 niveles**: Asistente → Co-Piloto → Autonomo con feedback visual progresivo
- **Kill Switch**: Boton de panico tactil que revoca Session Keys instantaneamente
- **Activity Feed**: Panel en tiempo real de acciones del agente con opcion de revertir

## Agentic Commerce — Pagos Tradicionales
Integracion del agente con sistemas de pagos fiat (ver `docs/AGENTIC-COMMERCE.md`):
- **Stripe ACP**: Shared Payment Tokens (SPT) acotados a un comercio y monto maximo
- **PayPal AP2**: Mandatos firmados criptograficamente para pagos recurrentes
- **Payment Router**: Decide ACP vs AP2 vs crypto on-chain segun tipo de pago

## Seguridad Avanzada — Herencia y Social Recovery
Patrones de Solidity contra vulnerabilidades en recuperacion social (ver `docs/SEGURIDAD-HERENCIA.md`):
- Bloqueo de mutacion de herederos durante recuperacion activa
- Nonces + chainId en firmas contra replay attacks
- Timelock en retiros de herencia con cancelacion por owner
- Checks-Effects-Interactions en transferencias

## Unit Economics — Modelo de Rentabilidad
Margenes y metricas del modelo de negocio (ver `docs/UNIT-ECONOMICS.md`):
- **Yield Spread**: ~5.3% APY neto (Rootstock 10% - Venus 4% - gas/bridge)
- **Performance Fee**: 80% usuario / 15% protocolo / 5% agente
- **LTV/CAC**: ~1.5-3.5x, payback ~5 meses
- **Break-even**: ~10,000 usuarios con $5M en depositos

## Reflexion del Agente — Validacion Pre-Ejecucion
Sub-agente reflexivo que debate cada decision antes de ejecutar (ver `docs/REFLEXION-AGENTE.md`):
- Ciclo: Hipotesis → Validacion empirica → Ajuste → Ejecucion → Feedback
- Integracion con R-MCTS como nodo de evaluacion
- Reduce trades con perdida ~52% y error de prediccion ~56%
- Trade-off: +6s latencia por decision (aceptable para yield, no time-sensitive)

## Rubrica HackITBA 2026
Desglose completo con estrategias para maximizar puntaje (ver `docs/RUBRICA-HACKITBA.md`):
- **Total: 47 puntos** → Idea (23) + MVP (21) + Presentacion (3)
- **Criticos (0 = descalificado)**: Relacion tematica, Monetizable, Ejecutable
- **Mayor peso**: Calidad MVP (10 pts), UI (8 pts), Problematica + Innovacion + Impacto (5 pts c/u)
- Estrategia por categoria con argumentos y checklist pre-entrega

## UI — Componentes 21st.dev
Componentes React + Tailwind de 21st.dev para UI profesional rapida (ver `docs/UI-COMPONENTES-21ST.md`):
- **Source**: https://21st.dev/home — copiar/pegar componentes premium
- **Estilo**: Dark mode first, glassmorphism, micro-animaciones, gradientes azul-violeta
- **Componentes clave**: Dashboard layout, balance cards, AI chat feed, modals, tablas
- **Custom (construir)**: AutonomySlider, KillSwitch, DeadManStatus, YieldBreakdown

## Prioridades Hackathon (<48hs)
1. Contratos core (Factory, Wallet, StrongBox) deployados en BSC Testnet
2. Frontend funcional con wallet connection, chat del agente, y toggle de autonomia
3. Demo del flujo completo: crear wallet → depositar → yield strategy → herencia
4. MCP Server + Telegram Bot funcionando en vivo
5. Agente AI minimo viable (modo Asistente con NLP funcionando)
