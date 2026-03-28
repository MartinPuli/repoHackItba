# Smart Wallet Agent-First — Contexto del Proyecto

## Qué es
Billetera fintech "Agent-First" para el mercado argentino. Un gestor patrimonial autónomo que combina Account Abstraction (ERC-4337), DeFi cross-chain (BSC + Rootstock), y un Agente AI con 3 niveles de autonomía. Hackathon ITBA.

## Stack Técnico
- **Smart Contracts**: Solidity, Hardhat, Ethers.js, OpenZeppelin
- **Chain principal**: BSC Testnet (BNB Smart Chain)
- **Cross-chain**: Rootstock (RSK) para rendimientos en rBTC
- **Frontend**: Next.js 14+ App Router, Wagmi v2, Viem, TailwindCSS
- **Account Abstraction**: ERC-4337 (Factory, Wallet, CajaFuerte, Paymaster)
- **Agente AI**: Análisis de mercado, compliance UIF/CNV, ejecución delegada
- **Equipo**: 4-6 personas

## Arquitectura de Contratos
```
OWNER (Metamask) → WALLET (liquidez diaria) → CAJA FUERTE (ahorros + DeFi)
                                                  ↑
                                            HEREDEROS / GUARDIANES
```
- **Factory**: Despliega Wallet + CajaFuerte con CREATE2
- **Wallet**: Billetera de gasto diario, Owner = cuenta externa del usuario
- **CajaFuerte**: Bóveda de ahorros, Owner = contrato Wallet. Dead Man's Switch para herencia.

## Modelo de Negocio
1. **Yield Spread**: Colateral en Venus (BSC) → Préstamo → Invertir en Rootstock → Performance fee
2. **Paymaster**: Subsidia gas, cobra en stablecoins/ARS con markup
3. **Off-Ramp**: Spread de conversión crypto→ARS para pagos QR

## Niveles de Autonomía del Agente
- **Nula (Asistente)**: Solo análisis, el humano firma todo
- **Media (Co-Piloto)**: Notificaciones proactivas, compliance UIF/CNV automático
- **Alta (Autónomo)**: Rebalanceo automático, Agentic Commerce (Stripe ACP, PayPal AP2)

## Estructura del Proyecto
```
/contracts        → Smart contracts Solidity
/deploy           → Scripts de deploy Hardhat
/test             → Tests de contratos
/frontend         → Next.js App Router
/agent            → Lógica del Agente AI
/docs             → Documentación adicional
```

## Convenciones
- Solidity: NatSpec para documentación, eventos para cada acción importante
- Tests: Mínimo 1 test por función pública de cada contrato
- Frontend: TypeScript estricto, componentes en /app con RSC por default
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
- **Factory**: Agente orquesta `crear()` con verificacion `checkUserHasAccount()`
- **Wallet**: Agente usa `enviar()` con Session Keys segun nivel de autonomia
- **CajaFuerte**: Agente ejecuta yield strategy Venus→Rootstock via `depositar()`/`retirar()`
- **Dead Man's Switch**: Agente llama `resetTime()` al detectar actividad del usuario
- **Session Keys**: Claves temporales con limites de monto/duracion para modo Autonomo

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
- Timelock 48h en retiros de herencia con cancelacion por owner
- ReentrancyGuard + Checks-Effects-Interactions en transferencias

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

1. Contratos core (Factory, Wallet, CajaFuerte) deployados en BSC Testnet
2. Frontend funcional con wallet connection y toggle de autonomia
3. Demo del flujo completo: crear wallet → depositar → yield strategy → herencia
4. Agente AI minimo viable (modo Asistente funcionando)
