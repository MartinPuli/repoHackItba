# StrongBox — Contexto del Proyecto

## Que es
StrongBox es una caja fuerte digital inteligente, no custodial, que protege activos on-chain y asegura la continuidad del acceso mediante guardianes y contactos de recuperacion. Hackathon ITBA 2026.

El objetivo principal NO es herencia como caso central, sino resolver:
- Perdida de acceso a la wallet (seed phrase, dispositivo)
- Robo o compromiso de credenciales
- Retiros no deseados
- Inactividad prolongada del usuario

## Propuesta de valor
**Nunca perder el acceso a tus activos digitales.**
- **Seguridad**: Retiros requieren validacion de guardianes
- **Recuperacion**: Si el usuario pierde acceso, recovery contacts intervienen
- **Continuidad**: Si hay inactividad prolongada, se habilita modo de recuperacion

## Stack Tecnico
- **Smart Contracts**: Solidity ^0.8.10, Hardhat, Ethers.js
- **Chain principal**: BSC Testnet (BNB Smart Chain)
- **Frontend**: Next.js 14+ App Router, Wagmi v2, Viem, TailwindCSS
- **Backend**: Node.js, Express, Supabase (auth + DB)
- **Auth**: MetaMask + Supabase Web3 login (JWT)

## Arquitectura de Contratos

```
Factory (wallet → strongbox)
  └── createNewStrongBox(wallet) → deploy StrongBox, mapea wallet→strongbox

Owner (abstract)
  └── OnlyOwner modifier, getOwner()

Guardian (abstract, hereda de Owner)
  └── setGuardian1/2(), OnlyGuardians modifier

StrongBox (hereda de Owner + Guardian)
  ├── deposit() payable OnlyOwner           → deposita en caja fuerte
  ├── requestWithdrawal(amount, to) OnlyOwner → solicita retiro
  ├── approveWithdrawal(id) OnlyGuardians   → guardian aprueba retiro
  ├── executeWithdrawal(id) OnlyOwner       → ejecuta retiro aprobado
  ├── recover() OnlyRecoveryContacts        → recuperacion tras inactividad
  ├── getBalance()                          → consulta balance
  ├── receive() payable                     → recibe ETH/BNB
  └── updateTime() OnlyOwner               → resetea timer de inactividad
```

### Roles

- **Owner**: Dueno de la caja fuerte. Deposita, solicita retiros, configura red de confianza.
- **Guardianes (2)**: Validan solicitudes de retiro del owner. Capa extra de seguridad contra hackeos.
- **Recovery Contacts (2)**: Intervienen cuando el owner pierde acceso o queda inactivo. No "heredan", recuperan.

### Flujo de retiro seguro
1. Owner solicita retiro → `requestWithdrawal(amount, to)`
2. Guardian 1 aprueba → `approveWithdrawal(id)`
3. Guardian 2 aprueba → `approveWithdrawal(id)`
4. Owner ejecuta → `executeWithdrawal(id)`

### Flujo de recuperacion por inactividad
1. Owner no interactua por `timeLimit` (configurable)
2. `block.timestamp - lastTimeUsed >= timeLimit`
3. Recovery contacts pueden llamar `recover()`
4. Fondos se desbloquean para recovery contacts

### Flujo de recuperacion por perdida de acceso
1. Owner pierde control de su wallet
2. Se inicia flujo de recuperacion social
3. Recovery contacts intervienen
4. Se destraba o redirige el acceso

## Arquitectura del Sistema

```
Frontend (Next.js)
  ├── Owner Dashboard    → balance, depositar, pedir retiro, countdown inactividad, config guardianes/recovery
  ├── Guardian Dashboard → solicitudes pendientes, aprobar/rechazar retiros
  └── Recovery Dashboard → vaults asignadas, countdown, reclamar recovery

Backend (Express + Supabase)
  ├── Auth (MetaMask + JWT)
  ├── StrongBox setup (guardianes + recovery contacts en DB)
  ├── Balances (mock → RPC on-chain)
  └── Historial de transacciones
```

### Pantallas del producto

**Owner Dashboard**: balance, depositar, pedir retiro, countdown inactividad, config guardianes, config recovery contacts
**Guardian Dashboard**: solicitudes pendientes, aprobar/rechazar retiros, vaults donde participa
**Recovery Dashboard**: vaults asignadas, countdown para recovery, reclamar fondos

## Modelo de seguridad por capas
1. **Capa 1 — Owner**: Solo el owner opera normalmente
2. **Capa 2 — Guardianes**: Retiros necesitan aprobacion de terceros
3. **Capa 3 — Recovery Contacts**: Actuan cuando el owner no puede
4. **Capa 4 — TimeLimit**: Inactividad prolongada activa recovery

## Estructura del Proyecto
```
/contracts              → Smart contracts Solidity
  /src                  → Factory.sol, StrongBox.sol, Owner.sol, Guardian.sol
  /deploy               → Scripts de deploy Hardhat
  /test                 → Tests de contratos
/frontend               → Next.js App Router
  /app                  → page.tsx, layout.tsx, providers.tsx
  /components           → Dashboard components por rol (owner, guardian, recovery)
  /lib/contracts        → ABIs y addresses
  /lib/wagmi            → Config Wagmi + BSC Testnet
/api                    → Backend Express + Supabase
  /src                  → Rutas, middleware, tipos
  /supabase             → Migraciones SQL
/docs                   → Documentacion
```

## Convenciones
- Solidity: Eventos para cada accion importante, custom errors
- Frontend: TypeScript estricto, componentes en /components con RSC por default
- Backend: Express, TypeScript, Supabase client
- Commits: conventional commits (feat:, fix:, docs:, test:)
- Deploy: BSC Testnet para hackathon

## Que NO es el proyecto
- No es un exchange
- No es una wallet custodial
- No es una app donde la empresa guarda las claves
- No es principalmente un testamento digital
- No es un sistema legal sucesorio

## Modelo de negocio
- **Fee por creacion de vault**: Fee unico al deployar StrongBox on-chain
- **Fee por transaccion**: Porcentaje en retiros ejecutados
- **Premium features**: Configuracion avanzada (mas guardianes, timelimits custom, notificaciones)

## Seguridad Avanzada (ver `docs/SEGURIDAD-HERENCIA.md`)
- Bloqueo de mutacion de guardianes durante recuperacion activa
- Nonces + chainId en firmas contra replay attacks
- Timelock en retiros con cancelacion por owner
- Checks-Effects-Interactions en transferencias

## Rubrica HackITBA 2026 (ver `docs/RUBRICA-HACKITBA.md`)
- **Total: 47 puntos** → Idea (23) + MVP (21) + Presentacion (3)
- **Criticos (0 = descalificado)**: Relacion tematica, Monetizable, Ejecutable

## Prioridades Hackathon (<48hs)
1. Contratos core (Factory, StrongBox) deployados en BSC Testnet
2. Frontend funcional con wallet connection y dashboards por rol (owner, guardian, recovery)
3. Demo del flujo completo: crear vault → depositar → solicitar retiro → aprobacion guardianes → recovery por inactividad
4. Backend con auth Web3 y setup de StrongBox
5. UI profesional y fluida
