# M003 — Agente AI + DeFi Engine

**Objetivo**: Implementar el agente AI con los 3 niveles de autonomía y el motor de yield spread Venus→Rootstock.

**Deadline**: Horas 16-32 del hackathon

## Slices

### S01 — Agent Core Engine
- Arquitectura modular del agente
- Sistema de permisos basado en nivel de autonomía
- Interfaz de comunicación con smart contracts

### S02 — Modo Asistente
- Monitoreo de precios crypto (CoinGecko/similar API)
- Conexión a API InvertirOnline para bonos/CEDEARs
- Generación de reportes JSON
- Preparación de transacciones sin ejecución

### S03 — Modo Co-Piloto
- Sistema de notificaciones push
- Motor de compliance UIF (Resolución 49/2024)
- Detección de límites CNV (Resolución 1058/2025)
- Solicitud automática de justificación de fondos

### S04 — Modo Autónomo
- Rebalanceo automático de colateral en Venus
- Detección de riesgo de liquidación
- Integración básica Agentic Commerce (mock para demo)

### S05 — Yield Spread Engine
- Integración con Venus Protocol (BSC): depositar colateral, tomar préstamo
- Bridge BSC→Rootstock
- Integración con Sovryn/Tropykus (Rootstock): invertir para rBTC yield
- Cálculo y captura de performance fee

## Criterio de Éxito
- Toggle de autonomía cambia comportamiento del agente
- Modo Asistente genera análisis correcto
- Modo Co-Piloto detecta límites UIF y notifica
- Yield spread engine muestra diferencial positivo en demo
