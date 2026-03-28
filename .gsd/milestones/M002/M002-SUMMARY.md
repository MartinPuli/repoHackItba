# M002 — Smart Contracts Core

**Objetivo**: Implementar, testear y deployar los 3 contratos principales (Factory, Wallet, CajaFuerte) + Paymaster en BSC Testnet.

**Deadline**: Horas 4-16 del hackathon

## Slices

### S01 — Factory Contract
- Implementar Factory con CREATE2
- Modificador checkUserHasAccount()
- Funciones: crear(), getWallet(), getCajaFuerte()
- Tests unitarios

### S02 — Wallet Contract
- Implementar Wallet con onlyOwner
- Funciones: enviar(), recibir()
- Integración con ERC-4337 (IAccount)
- Tests unitarios

### S03 — CajaFuerte Contract
- Implementar CajaFuerte con Owner = Wallet
- Funciones: depositar(), getBalances(), retirar()
- Lógica de herederos (requiere 2/2 para retiros grandes)
- Tests unitarios

### S04 — Dead Man's Switch
- Implementar resetTime() y retirarFondos()
- Timer de inactividad configurable
- Distribución 50/50 a herederos
- Tests de escenarios temporales

### S05 — Paymaster (ERC-4337)
- Implementar Paymaster que acepta stablecoins como fee
- Integrar con EntryPoint de ERC-4337
- Markup configurable
- Tests de UserOperations

### S06 — Integration Tests & Deploy
- Tests de integración Factory→Wallet→CajaFuerte
- Deploy script completo a BSC Testnet
- Verificación en BscScan

## Criterio de Éxito
- Todos los tests pasan (>90% coverage en funciones core)
- Contratos deployados y verificados en BSC Testnet
- Flujo completo funciona: crear→depositar→retirar→herencia
