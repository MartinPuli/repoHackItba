# Requisitos del Proyecto — Smart Wallet Agent-First

## Contratos Core

### R001 — Factory Contract
- **Estado**: active
- **Descripción**: Contrato Factory que despliega Wallet + CajaFuerte con CREATE2. Modificador checkUserHasAccount(). Funciones crear(), getWallet(), getCajaFuerte().
- **Validación**: Deploy exitoso en BSC Testnet, crear() despliega ambos contratos vinculados, no permite duplicados.
- **Owner**: contracts

### R002 — Wallet Contract
- **Estado**: active
- **Descripción**: Billetera de liquidez diaria. Owner = cuenta externa (Metamask). Funciones enviar() y recibir() con onlyOwner.
- **Validación**: Solo owner puede enviar(), cualquiera puede depositar vía recibir(), fondos se transfieren correctamente.
- **Owner**: contracts

### R003 — CajaFuerte Contract
- **Estado**: active
- **Descripción**: Bóveda de ahorros. Owner = contrato Wallet. Funciones depositar(), getBalances(), retirar() con lógica de herederos. Dead Man's Switch con resetTime() y retirarFondos().
- **Validación**: Solo Wallet puede operar, retiros grandes requieren 2/2 herederos, Dead Man's Switch distribuye 50/50 tras inactividad.
- **Owner**: contracts

### R004 — Paymaster Contract (ERC-4337)
- **Estado**: active
- **Descripción**: Contrato Paymaster que subsidia gas de transacciones. Cobra al usuario en stablecoins/ARS con markup.
- **Validación**: UserOperations se ejecutan sin gas nativo del usuario, Paymaster descuenta fee en stablecoin.
- **Owner**: contracts

## Frontend

### R005 — Wallet Connection
- **Estado**: active
- **Descripción**: Conexión de wallet (Metamask) a BSC Testnet via Wagmi. Mostrar balance, dirección, y estado de conexión.
- **Validación**: Usuario conecta Metamask, ve su balance en BSC Testnet, puede cambiar de red.
- **Owner**: frontend

### R006 — Toggle de Autonomía
- **Estado**: active
- **Descripción**: Selector UI de 3 niveles de autonomía del agente (Asistente, Co-Piloto, Autónomo). Persiste preferencia.
- **Validación**: Toggle funciona, cambia permisos del agente, estado persiste entre sesiones.
- **Owner**: frontend

### R007 — Dashboard de Portfolio
- **Estado**: active
- **Descripción**: Vista principal mostrando: balance Wallet, balance CajaFuerte, rendimientos DeFi, historial de transacciones.
- **Validación**: Datos reales de contratos, actualización en tiempo real, responsive.
- **Owner**: frontend

## Agente AI

### R008 — Modo Asistente (Autonomía Nula)
- **Estado**: active
- **Descripción**: Agente analítico. Monitorea mercado crypto + API InvertirOnline (bonos/CEDEARs). Genera reportes JSON. No ejecuta sin firma humana.
- **Validación**: Genera análisis correcto, prepara transacciones, requiere aprobación humana para ejecutar.
- **Owner**: agent

### R009 — Modo Co-Piloto (Autonomía Media)
- **Estado**: active
- **Descripción**: Notificaciones push proactivas. Compliance UIF (Res. 49/2024) y CNV (Res. 1058/2025). Pide justificación de fondos cuando corresponde.
- **Validación**: Envía notificaciones relevantes, detecta límites UIF/CNV, solicita documentación al usuario.
- **Owner**: agent

### R010 — Modo Autónomo (Autonomía Alta)
- **Estado**: active
- **Descripción**: Rebalanceo automático de colateral en Venus. Integración Agentic Commerce (Stripe ACP, PayPal AP2). Ejecución sin intervención humana.
- **Validación**: Rebalancea ante riesgo de liquidación, ejecuta pagos autónomos, respeta límites configurados.
- **Owner**: agent

## Modelo de Negocio

### R011 — Yield Spread Engine
- **Estado**: active
- **Descripción**: Motor de arbitraje: colateral en Venus (BSC) → préstamo → inversión en Rootstock → captura performance fee del diferencial.
- **Validación**: Diferencial positivo demostrable, fee capturado correctamente, flujo cross-chain funcional.
- **Owner**: contracts

### R012 — Off-Ramp QR
- **Estado**: deferred
- **Descripción**: Liquidación crypto→ARS para pagos QR via Transferencias 3.0. Spread de conversión con proveedores B2B (Inswitch/Pomelo).
- **Validación**: Demo de flujo QR payment con conversión, spread visible.
- **Owner**: frontend
- **Notas**: Diferido para post-hackathon, requiere integración B2B real.

### R013 — Módulo de Herencia
- **Estado**: active
- **Descripción**: Dead Man's Switch descentralizado. resetTime() marca actividad. retirarFondos() se desbloquea tras inactividad, distribuye 50% a cada heredero.
- **Validación**: Timer funciona, expiración desbloquea retiro, distribución 50/50 correcta, solo herederos pueden ejecutar.
- **Owner**: contracts
