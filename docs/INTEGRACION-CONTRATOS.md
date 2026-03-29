# Integracion Frontend/Backend ↔ Smart Contracts

## Contratos deployados

Cada vault son 3 contratos deployados por la Factory:

```
Factory.createStrongBox(guardian1, guardian2, heir1, heir2, timeLimit)
  │
  ├── Guardian(guardian1, guardian2)     → contrato inmutable con 2 direcciones
  ├── Heir(heir1, heir2)                → contrato inmutable con 2 direcciones
  └── StrongBox(owner, guardian, heir, timeLimit) → vault principal
```

La Factory guarda `mapping(address => address)` de wallet → strongbox.

## Contratos: API publica real

### Factory.sol

```solidity
// Crear vault (msg.sender = owner)
function createStrongBox(
    address guardian1, address guardian2,
    address heir1, address heir2,
    uint256 timeLimit
) external returns (address strongBoxAddress);

// Consultar vault de una wallet
function getStrongBox(address wallet) external view returns (address);

// Admin: asignar vault manualmente
function setStrongBox(address wallet, address strongBox) external OnlyOwner;
```

**Evento**: `StrongBoxCreated(wallet, strongBox, guardianContract, heirContract)`

### StrongBox.sol

```solidity
// === OWNER ===
function deposit() external payable OnlyOwner;
// → resetea timer, emite DepositMade(from, amount, newBalance)

function withdraw(uint256 amount, address to) external OnlyOwner;
// → crea WithdrawalRequest, emite WithdrawalRequested(requestId, owner, to, amount)
// → solo 1 solicitud activa a la vez (noActiveRequest modifier)

function getBalance() external view OnlyOwner returns (uint256);

// === GUARDIANS ===
function approveWithdrawal(uint256 requestId) external onlyGuardian;
// → si ambos aprueban, auto-ejecuta el retiro
// → emite WithdrawalApproved(requestId, guardian)
// → si auto-ejecuta, emite WithdrawalExecuted(requestId, to, amount)

function rejectWithdrawal(uint256 requestId) external onlyGuardian;
// → cancela la solicitud
// → emite WithdrawalRejected(requestId, guardian)

// === HEIRS (Recovery Contacts) ===
function inherit() external onlyHeir onlyAfterTime;
// → cada heir reclama 50% del balance (snapshot al primer reclamo)
// → emite InheritanceClaimed(heir, amount)

// === GETTERS (sin restriccion) ===
function getWithdrawalRequestCount() external view returns (uint256);
function getWithdrawalRequest(uint256 id) external view returns (WithdrawalRequest);
function isWithdrawalRequestCancelled(uint256 id) external view returns (bool);
function getLastTimeUsed() external view returns (uint256);
function getTimeLimit() external view returns (uint256);
function hasPendingWithdrawalRequest() external view returns (bool);
function getActiveWithdrawalRequestId() external view returns (uint256);
function getHeir1Claimed() external view returns (bool);
function getHeir2Claimed() external view returns (bool);
function getAddress() external view returns (address);
function getOwner() public view returns (address);
```

### Guardian.sol

```solidity
function getGuardian1() external view returns (address);
function getGuardian2() external view returns (address);
function isGuardian(address account) external view returns (bool);
```

### Heir.sol

```solidity
function getHeir1() external view returns (address);
function getHeir2() external view returns (address);
function isHeir(address account) external view returns (bool);
```

## Flujos Frontend → Contrato

### 1. Crear vault (primer uso)

```
Frontend                          Backend                         Blockchain
   │                                │                                │
   ├─ POST /strongbox/setup ───────►│ Crea en DB:                    │
   │   {guardians, recovery,        │  - strongboxes (is_deployed=false)
   │    own_email}                   │  - guardians x2                │
   │                                │  - recovery_contacts x2        │
   │◄─ 201 OK ─────────────────────┤                                │
   │                                │                                │
   │  (cuando deposita por 1ra vez)  │                                │
   ├─ wagmi: Factory.createStrongBox ────────────────────────────────►│
   │   (g1, g2, h1, h2, timeLimit)  │                                │ deploy 3 contratos
   │◄──── tx receipt ────────────────────────────────────────────────┤
   │                                │                                │
   ├─ PATCH /strongbox ────────────►│ Actualiza:                     │
   │   {contract_address, tx_hash}  │  - strongboxes.contract_address│
   │                                │  - strongboxes.is_deployed=true│
   │                                │  - strongboxes.deploy_tx_hash  │
```

### 2. Depositar (Owner)

```
Frontend                                    Blockchain
   │                                           │
   ├─ wagmi: StrongBox.deposit{value: X} ─────►│
   │                                           │ → acepta BNB
   │◄─── tx receipt (DepositMade event) ───────┤ → resetea lastTimeUsed
   │                                           │
   ├─ (opcional) POST /transactions ──► Backend registra en DB
```

### 3. Solicitar retiro (Owner)

```
Frontend                                    Blockchain
   │                                           │
   ├─ wagmi: StrongBox.withdraw(amount, to) ──►│
   │                                           │ → crea WithdrawalRequest
   │◄─── tx receipt (WithdrawalRequested) ─────┤ → requestId en evento
   │                                           │
   ├─ POST /strongbox/withdraw/request ──► Backend crea withdrawal_request en DB
   │                                       y notifica guardians (alerts)
```

### 4. Aprobar retiro (Guardian)

```
Frontend (Guardian Dashboard)               Blockchain
   │                                           │
   ├─ GET /strongbox/withdraw/pending ──► Backend lista pendientes
   │◄─── [{id, amount, to, status}] ──────────┤
   │                                           │
   ├─ wagmi: StrongBox.approveWithdrawal(id) ─►│
   │                                           │ → registra aprobacion
   │◄─── tx receipt ──────────────────────────┤ → si ambos: auto-ejecuta
   │                                           │   WithdrawalExecuted event
   │
   ├─ (o rechazar)
   ├─ wagmi: StrongBox.rejectWithdrawal(id) ──►│
   │                                           │ → cancela solicitud
```

### 5. Recovery por inactividad (Heir)

```
Frontend (Recovery Dashboard)               Blockchain
   │                                           │
   ├─ wagmi: StrongBox.getLastTimeUsed() ─────►│
   ├─ wagmi: StrongBox.getTimeLimit() ────────►│
   │◄─── lastTimeUsed, timeLimit ─────────────┤
   │                                           │
   │  (calcula: block.timestamp - lastTimeUsed >= timeLimit?)
   │                                           │
   ├─ wagmi: StrongBox.inherit() ─────────────►│
   │                                           │ → transfiere 50% al heir
   │◄─── tx receipt (InheritanceClaimed) ──────┤
```

## Mapeo Frontend Pages → Contratos

| Pagina | Rol | Lecturas on-chain | Escrituras on-chain |
|--------|-----|-------------------|---------------------|
| `/safe/owner` | Owner | getBalance, getLastTimeUsed, getTimeLimit, hasPendingWithdrawalRequest | deposit, withdraw |
| `/guardian` | Guardian | getWithdrawalRequest, getActiveWithdrawalRequestId | approveWithdrawal, rejectWithdrawal |
| `/heir` | Heir | getLastTimeUsed, getTimeLimit, getHeir1Claimed, getHeir2Claimed | inherit |
| `/safe/configure` | Owner | (pre-deploy) | Factory.createStrongBox |
| `/connect` | Todos | Factory.getStrongBox | - |

## Mapeo DB ↔ On-chain

| Dato | DB (Supabase) | On-chain |
|------|---------------|----------|
| Balance | strongboxes.balance_native (cache) | StrongBox.getBalance() (source of truth) |
| Timer | strongboxes.last_activity_at (cache) | StrongBox.getLastTimeUsed() (source of truth) |
| Recovery state | strongboxes.recovery_state | Derivado de timestamps on-chain |
| Withdrawal status | withdrawal_requests.status | StrongBox.getWithdrawalRequest(id) |
| Guardian addresses | guardians.address | Guardian.getGuardian1/2() |
| Recovery addresses | recovery_contacts.address | Heir.getHeir1/2() |

**Regla**: On-chain es siempre source of truth. DB es cache + metadata (emails, nombres).
