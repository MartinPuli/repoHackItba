# Priorización Hackathon — Smart Wallet Agent-First

## Estrategia de 48 horas (4-6 personas)

### ⏰ Bloque 1: Setup (0-4h) — TODO EL EQUIPO
**M001 completo**
- [ ] Persona A+B: Hardhat setup + compilar contratos base
- [ ] Persona C+D: Next.js + Wagmi + wallet connection
- [ ] Persona E+F: Estructura agente + investigar APIs (Venus, IOL)

### ⏰ Bloque 2: Contracts Core (4-16h) — EQUIPO SPLIT
**M002 slices S01-S04**
- [ ] 2 personas: Factory + Wallet contracts + tests
- [ ] 2 personas: CajaFuerte + Dead Man's Switch + tests
- [ ] 2 personas: Frontend layout + componentes base

### ⏰ Bloque 3: Agent + DeFi (16-32h) — EQUIPO SPLIT
**M002-S05/S06 + M003**
- [ ] 2 personas: Paymaster + deploy BSC Testnet + verificar
- [ ] 2 personas: Agente modo Asistente + API integrations
- [ ] 2 personas: Frontend dashboard + toggle autonomía

### ⏰ Bloque 4: Integración + Demo (32-48h) — TODO EL EQUIPO
**M004 completo**
- [ ] Conectar frontend ↔ contratos ↔ agente
- [ ] Pulir UI, fix bugs
- [ ] Preparar demo script y pitch
- [ ] Video backup

---

## 🎯 MVP Mínimo para Demo (si el tiempo aprieta)
Si quedan < 12 horas, priorizar:
1. ✅ Factory + Wallet + CajaFuerte deployados (sin Paymaster)
2. ✅ Frontend con wallet connection + depositar/retirar
3. ✅ Toggle de autonomía (aunque sea visual)
4. ✅ Dead Man's Switch funcionando
5. ⬜ Yield spread puede ser simulado/mock

## 🚫 Lo que NO hacer en el hackathon
- No optimizar gas prematuramente
- No hacer UI pixel-perfect al inicio
- No implementar off-ramp real (R012 está deferred)
- No perder tiempo en CI/CD elaborado
