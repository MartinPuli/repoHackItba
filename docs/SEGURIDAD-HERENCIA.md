# Seguridad Avanzada — Guardianes y Social Recovery

## Vulnerabilidades Conocidas en Social Recovery

Auditores han identificado riesgos graves en modulos de recuperacion social que aplican directamente a nuestro sistema de guardianes y recovery contacts.

### 1. Mutacion de Guardianes Durante Recuperacion

**Vulnerabilidad**: Si la lista de guardianes/recovery contacts puede modificarse mientras un proceso de recuperacion esta en curso, un atacante podria:
- Agregar un guardian malicioso durante el periodo de espera
- Cambiar la composicion del quorum a su favor
- Ejecutar la recuperacion con guardianes que el usuario nunca aprobo

**Patron de proteccion en Solidity**:

```solidity
// Estado de recuperacion
enum RecoveryState { INACTIVE, PENDING, EXECUTED }
RecoveryState public recoveryState;

// Bloquear cambios de guardianes durante recuperacion activa
modifier noActiveRecovery() {
    require(recoveryState == RecoveryState.INACTIVE, "Recovery in progress");
    _;
}

function setGuardian(address _guardian, uint8 _slot) external onlyOwner noActiveRecovery {
    require(_guardian != address(0), "Invalid address");
    require(_slot == 1 || _slot == 2, "Invalid slot");
    if (_slot == 1) guardian1 = _guardian;
    else guardian2 = _guardian;
    emit GuardianUpdated(_slot, _guardian);
}
```

### 2. Replay Attacks en Aprobaciones

**Vulnerabilidad**: Sin proteccion contra replay, una firma de aprobacion de un guardian podria reutilizarse para:
- Ejecutar multiples retiros con una sola aprobacion
- Reactivar un proceso de recovery que fue cancelado
- Usar firmas de una chain en otra (cross-chain replay)

**Patron de proteccion**:

```solidity
// Nonce por guardian para prevenir replay
mapping(address => uint256) public guardianNonce;

// ID unico por solicitud de retiro
uint256 public withdrawalRequestId;

// Incluir chainId + nonce + requestId en la firma
function approveWithdrawal(
    uint256 _requestId,
    uint256 _nonce,
    bytes calldata _signature
) external onlyGuardian {
    require(_requestId == withdrawalRequestId, "Invalid request");
    require(_nonce == guardianNonce[msg.sender], "Invalid nonce");

    bytes32 hash = keccak256(abi.encodePacked(
        block.chainid,
        address(this),
        _requestId,
        _nonce,
        msg.sender
    ));
    require(_verifySignature(hash, _signature, msg.sender), "Invalid signature");

    guardianNonce[msg.sender]++;
    // ... registrar aprobacion
}
```

### 3. Guardian Malicioso / Recovery Contact Comprometido

**Vulnerabilidad**: Si un guardian o recovery contact es comprometido (clave robada), podria intentar drenar la vault.

**Patron de proteccion — Timelock + Notificacion**:

```solidity
uint256 public constant WITHDRAWAL_DELAY = 48 hours;
uint256 public withdrawalUnlocksAt;

// Paso 1: Recovery contact inicia recovery (no ejecuta inmediatamente)
function initiateRecovery() external onlyRecoveryContact {
    require(block.timestamp > lastActivity + timeLimit, "Owner still active");
    require(withdrawalUnlocksAt == 0, "Recovery already pending");

    withdrawalUnlocksAt = block.timestamp + WITHDRAWAL_DELAY;
    emit RecoveryInitiated(msg.sender, withdrawalUnlocksAt);
}

// Paso 2: Ejecutar recovery despues del delay
function executeRecovery() external onlyRecoveryContact {
    require(withdrawalUnlocksAt != 0, "No pending recovery");
    require(block.timestamp >= withdrawalUnlocksAt, "Delay not met");

    withdrawalUnlocksAt = 0;
    // ... repartir fondos a recovery contacts
}

// El owner puede cancelar durante el delay si vuelve
function cancelRecovery() external onlyOwner {
    withdrawalUnlocksAt = 0;
    lastActivity = block.timestamp; // reset timer
    emit RecoveryCancelled(msg.sender);
}
```

### 4. Reentrancy en Retiro/Recovery

**Patron de proteccion**:

```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StrongBox is ReentrancyGuard {
    function executeWithdrawal(uint256 requestId) external onlyOwner nonReentrant {
        // Checks-Effects-Interactions pattern
        WithdrawalRequest storage req = requests[requestId];
        uint256 amount = req.amount;
        address to = req.to;

        // Effects primero
        req.executed = true;
        withdrawalRequestId++;

        // Interactions al final
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "Transfer failed");

        emit WithdrawalExecuted(requestId, amount, to);
    }
}
```

## Checklist de Seguridad para StrongBox

- [ ] `noActiveRecovery` modifier en funciones que modifican guardianes/recovery contacts
- [ ] Nonce por guardian para prevenir replay attacks
- [ ] `block.chainid` en hashes de firma para prevenir cross-chain replay
- [ ] Timelock de 48h en recovery con notificacion al owner
- [ ] `cancelRecovery()` disponible para el owner durante el periodo de delay
- [ ] `nonReentrant` en todas las funciones que transfieren fondos
- [ ] Checks-Effects-Interactions pattern en retiros y recovery
- [ ] Eventos emitidos en cada accion critica para monitoreo
- [ ] Tests de fuzzing para timer de inactividad edge cases
- [ ] Auditoria con Slither antes de deploy a mainnet
