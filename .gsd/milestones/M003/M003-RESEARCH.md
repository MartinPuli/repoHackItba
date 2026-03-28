# Investigación: Integraciones Externas

## Venus Protocol (BSC)
- **Docs**: https://docs.venus.io/
- **Testnet**: Desplegado en BSC Testnet
- **Contratos clave**: vToken (supply), Comptroller (enter markets), PriceOracle
- **Flujo**: Supply colateral → enterMarkets → borrow USDT/BUSD
- **API**: On-chain via contratos, no API REST

## Rootstock (RSK)
- **Docs**: https://developers.rsk.co/
- **Testnet RPC**: https://public-node.testnet.rsk.co
- **Bridge BSC→RSK**: Token Bridge (https://tokenbridge.rsk.co/) o cross-chain manual
- **DeFi**: Sovryn (https://sovryn.com/), Tropykus (https://tropykus.com/)

## InvertirOnline (IOL) API
- **API Docs**: https://api.invertironline.com/
- **Funcionalidad**: Consulta de bonos, CEDEARs, cotizaciones
- **Auth**: OAuth2, requiere cuenta IOL
- **Uso en agente**: Modo Asistente consulta para análisis comparativo crypto vs. TradFi

## ERC-4337 Account Abstraction
- **Spec**: https://eips.ethereum.org/EIPS/eip-4337
- **EntryPoint**: Contrato singleton, ya deployado en BSC Testnet
- **Bundler**: Se puede usar Stackup, Pimlico, o Alchemy para UserOperations
- **Paymaster**: Custom, acepta ERC20 como pago de gas

## Compliance Argentina
- **UIF Res. 49/2024**: Límites de reporte USD 1000/mes para PSV (Proveedores de Servicios Virtuales)
- **CNV Res. 1058/2025**: Registro de PSV, requisitos KYC/AML
- **Implementación**: El agente Co-Piloto trackea montos acumulados y alerta

## Agentic Commerce
- **Stripe ACP**: Agent Commerce Protocol — API para que agentes AI hagan compras
- **PayPal AP2**: Agent Payments Protocol — pagos M2M
- **Para hackathon**: Mock/simulación, integración real post-hackathon
