# StrongBox — Smart Recovery Vault

## Que es
Caja fuerte digital inteligente, no custodial, que protege activos on-chain y asegura la continuidad del acceso mediante guardianes y contactos de recuperacion. Hackathon ITBA 2026.

El objetivo NO es herencia — es resolver:
- Perdida de acceso a la wallet (seed phrase, dispositivo)
- Robo o compromiso de credenciales
- Retiros no autorizados
- Inactividad prolongada → fondos congelados para siempre

## Propuesta de valor
**Nunca perder el acceso a tus activos digitales.**
- **Seguridad**: Retiros requieren aprobacion de 2 guardianes
- **Recuperacion**: Recovery contacts reclaman fondos tras inactividad
- **No custodial**: Fondos en smart contract, no en poder de una empresa

## Stack Tecnico
- **Smart Contracts**: Solidity ^0.8.24, Hardhat, Ethers.js
- **Chain**: BSC Testnet (chainId 97)
- **Frontend**: Next.js 14+ App Router, Wagmi v2, Viem, TailwindCSS
- **Backend**: Express, TypeScript, Supabase (auth + DB)
- **Auth**: MetaMask + Supabase Web3 login (JWT)

## Arquitectura de Contratos (codigo real)

```
Factory
  └── createStrongBox(guardian1, guardian2, heir1, heir2, timeLimit)
      ├── deploy Guardian(guardian1, guardian2)
      ├── deploy Heir(heir1, heir2)
      └── deploy StrongBox(owner, guardianAddr, heirAddr, timeLimit)
          → mapea wallet → strongbox

Owner (abstract)
  └── OnlyOwner modifier, getOwner()

Guardian
  ├── getGuardian1(), getGuardian2()
  └── isGuardian(address) → bool

Heir (= Recovery Contacts)
  ├── getHeir1(), getHeir2()
  └── isHeir(address) → bool

StrongBox (hereda de Owner)
  ├── deposit() payable OnlyOwner          → deposita, resetea timer
  ├── withdraw(amount, to) OnlyOwner       → crea solicitud de retiro
  ├── approveWithdrawal(id) onlyGuardian   → guardian aprueba (auto-ejecuta si ambos aprueban)
  ├── rejectWithdrawal(id) onlyGuardian    → guardian rechaza (cancela solicitud)
  ├── inherit() onlyHeir onlyAfterTime     → recovery contact reclama 50% tras inactividad
  ├── getBalance() OnlyOwner               → consulta balance
  ├── getWithdrawalRequest(id)             → info de solicitud
  ├── hasPendingWithdrawalRequest()        → hay solicitud activa?
  ├── getLastTimeUsed()                    → ultimo timestamp de actividad
  └── getTimeLimit()                       → tiempo limite de inactividad
```

### Flujo de retiro seguro (implementado)
1. Owner llama `withdraw(amount, to)` → crea WithdrawalRequest
2. Guardian 1 llama `approveWithdrawal(id)` → registra aprobacion
3. Guardian 2 llama `approveWithdrawal(id)` → auto-ejecuta el retiro
4. Si algun guardian llama `rejectWithdrawal(id)` → cancela la solicitud
5. Solo 1 solicitud activa a la vez

### Flujo de recovery por inactividad (implementado)
1. Owner no interactua por `timeLimit` segundos
2. `block.timestamp - lastTimeUsed >= timeLimit` → recovery habilitado
3. Heir 1 llama `inherit()` → reclama 50% (snapshot del balance)
4. Heir 2 llama `inherit()` → reclama el resto
5. Cada heir solo puede reclamar una vez

### Timer de inactividad
- Se resetea automaticamente con `deposit()` y `withdraw()`
- `timeLimit` es immutable (se define en el constructor)
- No hay check-in manual — cualquier operacion resetea el timer

## Roles

| Rol | Que hace | Contrato |
|-----|----------|----------|
| **Owner** | Deposita, solicita retiros, consulta balance | StrongBox (OnlyOwner) |
| **Guardian (x2)** | Aprueba o rechaza retiros del owner | Guardian + StrongBox (onlyGuardian) |
| **Heir/Recovery (x2)** | Reclama fondos tras inactividad prolongada | Heir + StrongBox (onlyHeir + onlyAfterTime) |

## Base de datos (Supabase)

7 tablas, schema limpio:

| Tabla | Proposito |
|-------|-----------|
| `users` | Wallet address, email, timestamps |
| `strongboxes` | Vault: contract_address, balance, time_limit, recovery_state, is_deployed |
| `guardians` | 2 por vault (slot 1,2): address + email |
| `recovery_contacts` | 2 por vault (slot 1,2): address + email + share% |
| `withdrawal_requests` | Solicitudes: amount, to, status, aprobaciones de cada guardian |
| `transactions` | Historial: deposit, withdraw, recovery |
| `alerts` | Notificaciones: retiro pendiente, recovery iniciado, inactividad |

Ver `docs/SUPABASE-SCHEMA.md` para el SQL completo.

## API (Express)

| Endpoint | Metodo | Que hace |
|----------|--------|----------|
| `/api/auth/me` | GET | Upsert user, devuelve has_strongbox |
| `/api/strongbox/setup` | POST | Crea vault en DB + 2 guardians + 2 recovery contacts |
| `/api/strongbox/balance` | GET | Balance de la vault (mock → RPC) |
| `/api/strongbox/withdraw/request` | POST | Crea solicitud de retiro |
| `/api/strongbox/withdraw/:id/approve` | POST | Guardian aprueba |
| `/api/strongbox/withdraw/pending` | GET | Lista solicitudes pendientes |
| `/api/strongbox/guardians` | GET | Lista guardians y recovery contacts |

Ver `docs/API.md` para detalles.

## Frontend — Pantallas por rol

**Owner Dashboard**: balance, depositar, solicitar retiro, countdown inactividad, ver guardians/recovery contacts
**Guardian Dashboard**: solicitudes pendientes, aprobar/rechazar retiros
**Recovery Dashboard**: vaults asignadas, countdown para recovery, reclamar fondos
**Connect**: MetaMask login
**Role Selection**: elegir rol si la wallet participa en multiples vaults

## Estructura del Proyecto
```
/contracts                → Smart contracts Solidity
  /src                    → Factory.sol, StrongBox.sol, Owner.sol, Guardian.sol, Heir.sol
  /deploy                 → deploy.ts (Hardhat)
  /test                   → Factory.test.js, StrongBox.test.js
/frontend                 → Next.js App Router
  /app                    → Pages: /, connect, caja-fuerte, guardian, heir, role, settings, transactions
  /app/safe               → configure, owner
  /components/dashboard   → BalanceCards, DeadManStatus, ActivityFeed
  /components/layout      → AppShell, Sidebar, TopBar
  /components/vault       → VaultPrimitives, VaultShell, VaultSidebar, VaultTopBar
  /components/ui          → PageHeader, PrimaryButton, StatBlock
  /hooks                  → useContracts, useSupabase
  /lib                    → wagmi config, supabase client, contract ABIs
/api                      → Backend Express + Supabase
  /src/controllers        → auth, balance, strongbox
  /src/services           → auth, strongbox, mockChainBalance, userContracts
  /src/middlewares         → requireAuth, errorHandler, asyncHandler
  /supabase/migrations    → 001_initial_schema.sql
/docs                     → Documentacion
```

## Convenciones
- Solidity: custom errors, eventos en cada accion, NatSpec comments
- Frontend: TypeScript estricto, RSC por default, componentes en /components
- Backend: Express + TypeScript, Supabase client
- Commits: conventional commits (feat:, fix:, docs:, test:)
- Deploy: BSC Testnet para hackathon

## Que NO es el proyecto
- No es un exchange
- No es custodial
- No es principalmente un testamento digital
- No es un sistema legal sucesorio

## Modelo de negocio
- **Fee de deploy**: Fee unico al crear vault on-chain
- **Fee por retiro**: % en retiros ejecutados
- **Premium**: Mas guardians, timelimits custom, notificaciones multi-canal

## Seguridad (ver `docs/SEGURIDAD-HERENCIA.md`)
- Bloqueo de mutacion de guardians durante recovery activa
- Nonces + chainId contra replay attacks
- Timelock en recovery con cancelacion por owner
- Checks-Effects-Interactions en transfers
- Solo 1 solicitud de retiro activa a la vez

## Prioridades Hackathon
1. Contratos deployados y verificados en BSC Testnet ✓ (codigo listo)
2. Frontend con 3 dashboards por rol (owner, guardian, recovery)
3. Backend con auth Web3 + setup + balance + withdrawal flow
4. Demo: crear vault → depositar → solicitar retiro → guardianes aprueban → recovery por inactividad
5. UI profesional
