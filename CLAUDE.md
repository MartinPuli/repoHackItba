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

## Prioridades Hackathon (<48hs)
1. Contratos core (Factory, Wallet, CajaFuerte) deployados en BSC Testnet
2. Frontend funcional con wallet connection y toggle de autonomía
3. Demo del flujo completo: crear wallet → depositar → yield strategy → herencia
4. Agente AI mínimo viable (modo Asistente funcionando)
