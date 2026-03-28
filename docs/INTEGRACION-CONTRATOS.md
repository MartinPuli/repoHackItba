# Integracion Frontend/Backend ↔ Smart Contracts

## Arquitectura de Contratos

```
Factory (wallet → strongbox)
  └── createNewStrongBox(ownerAddress) → deploy StrongBox, mapea owner→strongbox

Owner (abstract)
  └── OnlyOwner modifier, getOwner()

Guardian (abstract, hereda de Owner)
  └── setGuardian1/2(), OnlyGuardians modifier
  └── _validateGuardian: newGuardian != otherGuardian (sin excepcion address(0))

StrongBox (hereda de Owner + Guardian)
  ├── deposit() payable OnlyOwner                    → deposita en caja fuerte
  ├── requestWithdrawal(amount, to) OnlyOwner        → solicita retiro
  ├── approveWithdrawal(requestId) OnlyGuardians     → guardian aprueba retiro
  ├── executeWithdrawal(requestId) OnlyOwner         → ejecuta retiro aprobado por ambos
  ├── recover() OnlyRecoveryContacts onlyAfterTime   → recuperacion tras inactividad
  ├── getBalance()                                   → consulta balance
  ├── receive() payable                              → recibe BNB
  └── (updateTime interno — se resetea con deposit/requestWithdrawal)
```

## Interacciones por Contrato

### 1. Factory — Creacion de Vault

```solidity
// Crear StrongBox para un owner
function createNewStrongBox(address ownerAddress) public;
// → Emite NewStrongBoxCreated(ownerAddress, strongBoxAddress)

// Consulta
function getStrongBox(address owner) public view returns(address);
```

**Flujo desde frontend**:
1. Usuario conecta MetaMask
2. Backend hace setup en DB (guardianes + recovery contacts)
3. Al primer deposito, frontend llama `Factory.createNewStrongBox(ownerAddress)`
4. Se guarda `contract_address` en DB

### 2. StrongBox — Operaciones del Owner

```solidity
// Depositar en caja fuerte (solo owner)
function deposit() public payable OnlyOwner returns(bool);
// → Actualiza lastTimeUsed (resetea timer de inactividad)

// Solicitar retiro (solo owner, requiere aprobacion de guardianes)
function requestWithdrawal(uint256 amount, address to) public OnlyOwner returns(uint256 requestId);
// → Emite WithdrawalRequested(requestId, amount, to)

// Ejecutar retiro aprobado (solo owner, despues de ambas aprobaciones)
function executeWithdrawal(uint256 requestId) public OnlyOwner returns(bool);
// → Emite WithdrawalExecuted(requestId, amount, to)
```

**Interaccion desde frontend (Owner Dashboard)**:

| Accion UI | Contrato | Resultado |
|-----------|----------|-----------|
| "Depositar" | StrongBox.deposit() | msg.value depositado, timer reseteado |
| "Solicitar retiro" | StrongBox.requestWithdrawal(amount, to) | Solicitud creada, espera guardianes |
| "Ejecutar retiro" | StrongBox.executeWithdrawal(requestId) | Fondos transferidos |
| "Ver balance" | StrongBox.getBalance() | view call |

### 3. StrongBox — Operaciones de Guardianes

```solidity
// Aprobar solicitud de retiro (solo guardianes)
function approveWithdrawal(uint256 requestId) public OnlyGuardians;
// → Emite WithdrawalApproved(requestId, msg.sender)
```

**Interaccion desde frontend (Guardian Dashboard)**:

| Accion UI | Contrato | Resultado |
|-----------|----------|-----------|
| "Aprobar retiro" | StrongBox.approveWithdrawal(requestId) | Aprobacion registrada |
| "Rechazar retiro" | (cancelacion off-chain o timeout) | Solicitud expira |

### 4. StrongBox — Recovery por Inactividad

```solidity
// Recuperar fondos tras inactividad (solo recovery contacts, solo despues de timeLimit)
function recover() public OnlyRecoveryContacts onlyAfterTime;
// → Reparte fondos entre recovery contacts
// → Emite RecoveryExecuted(msg.sender, amount)
```

**Interaccion desde frontend (Recovery Dashboard)**:

| Accion UI | Contrato | Resultado |
|-----------|----------|-----------|
| "Reclamar recovery" | StrongBox.recover() | Fondos transferidos a recovery contacts |
| "Ver countdown" | StrongBox.getTimeRemaining() | Tiempo restante para recovery |

### 5. Configuracion de Guardianes y Recovery Contacts

```solidity
// Configurar guardianes (solo owner)
function setGuardian1(address newGuardian) public OnlyOwner;
function setGuardian2(address newGuardian) public OnlyOwner;

// Configurar recovery contacts (solo owner)
function setRecoveryContact1(address newContact) public OnlyOwner;
function setRecoveryContact2(address newContact) public OnlyOwner;

// Consultas
function getGuardian1() public view returns(address);
function getGuardian2() public view returns(address);
function getRecoveryContact1() public view returns(address);
function getRecoveryContact2() public view returns(address);
```

## Timer de Inactividad (Dead Man's Switch)

```solidity
uint256 private timeLimit; // configurable por owner
uint256 private lastTimeUsed;

// Se resetea automaticamente con:
// - deposit()
// - requestWithdrawal()

// Recovery habilitado cuando:
// block.timestamp - lastTimeUsed >= timeLimit
```

El owner NO necesita hacer check-in manual — cualquier interaccion con la vault resetea el timer.

## Pendientes de Implementacion

1. **Factory**: Adaptar para crear StrongBox directamente (sin Wallet intermedia)
2. **StrongBox**: Implementar cola de solicitudes de retiro con aprobacion de guardianes
3. **StrongBox**: Separar roles Guardian vs Recovery Contact (actualmente ambos son "HeirGuardians")
4. **StrongBox**: Agregar `recover()` con logica de distribucion a recovery contacts
5. **StrongBox**: Agregar `setRecoveryContact1/2()` separados de guardianes
6. **Events**: Emitir eventos en deposit, requestWithdrawal, approveWithdrawal, executeWithdrawal, recover
7. **Import paths**: Verificar que matcheen con Hardhat remappings
