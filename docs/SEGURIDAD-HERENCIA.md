# Seguridad Avanzada — Herencia y Social Recovery

## Vulnerabilidades Conocidas en Social Recovery (ERC-4337)

Auditores han identificado riesgos graves en modulos de recuperacion social para wallets ERC-4337 que aplican directamente a nuestro Dead Man's Switch y sistema de herederos.

### 1. Mutacion de Guardianes Durante Recuperacion

**Vulnerabilidad**: Si la lista de herederos/guardianes puede modificarse mientras un proceso de recuperacion esta en curso, un atacante podria:
- Agregar un guardian malicioso durante el periodo de espera
- Cambiar la composicion del quorum a su favor
- Ejecutar la recuperacion con guardianes que el usuario nunca aprobo

**Patron de proteccion en Solidity**:

```solidity
// Estado de recuperacion
enum RecoveryState { INACTIVE, PENDING, EXECUTED }
RecoveryState public recoveryState;

// Bloquear cambios de herederos durante recuperacion activa
modifier noActiveRecovery() {
    require(recoveryState == RecoveryState.INACTIVE, "Recovery in progress");
    _;
}

function setHeredero(address _heredero, uint8 _slot) external onlyOwner noActiveRecovery {
    require(_heredero != address(0), "Invalid address");
    require(_slot == 1 || _slot == 2, "Invalid slot");
    if (_slot == 1) heredero1 = _heredero;
    else heredero2 = _heredero;
    emit HerederoUpdated(_slot, _heredero);
}
```

### 2. Replay Attacks en Aprobaciones de Quorum

**Vulnerabilidad**: Sin proteccion contra replay, una firma de aprobacion de un heredero podria reutilizarse para:
- Ejecutar multiples retiros con una sola aprobacion
- Reactivar un proceso de herencia que fue cancelado
- Usar firmas de una chain en otra (cross-chain replay)

**Patron de proteccion**:

```solidity
// Nonce por heredero para prevenir replay
mapping(address => uint256) public herederoNonce;

// ID unico por solicitud de herencia
uint256 public inheritanceRequestId;

// Incluir chainId + nonce + requestId en la firma
function retirarFondos(
    uint256 _requestId,
    uint256 _nonce,
    bytes calldata _signature
) external onlyHeredero {
    require(_requestId == inheritanceRequestId, "Invalid request");
    require(_nonce == herederoNonce[msg.sender], "Invalid nonce");
    require(block.timestamp > lastActivity + deadManTimeout, "Owner still active");

    // Verificar firma incluye chainId para prevenir cross-chain replay
    bytes32 hash = keccak256(abi.encodePacked(
        block.chainid,
        address(this),
        _requestId,
        _nonce,
        msg.sender
    ));
    require(_verifySignature(hash, _signature, msg.sender), "Invalid signature");

    herederoNonce[msg.sender]++;
    // ... ejecutar retiro
}
```

### 3. Guardian Malicioso / Heredero Comprometido

**Vulnerabilidad**: Si un heredero es comprometido (clave robada), podria intentar drenar la CajaFuerte en cuanto expire el Dead Man's Switch.

**Patron de proteccion — Timelock + Notificacion**:

```solidity
uint256 public constant WITHDRAWAL_DELAY = 48 hours;
uint256 public withdrawalUnlocksAt;

// Paso 1: Heredero inicia retiro (no ejecuta inmediatamente)
function iniciarRetiro() external onlyHeredero {
    require(block.timestamp > lastActivity + deadManTimeout, "Owner still active");
    require(withdrawalUnlocksAt == 0, "Withdrawal already pending");

    withdrawalUnlocksAt = block.timestamp + WITHDRAWAL_DELAY;
    emit WithdrawalInitiated(msg.sender, withdrawalUnlocksAt);
    // El agente detecta este evento y notifica al owner urgentemente
}

// Paso 2: Ejecutar retiro despues del delay
function ejecutarRetiro() external onlyHeredero {
    require(withdrawalUnlocksAt != 0, "No pending withdrawal");
    require(block.timestamp >= withdrawalUnlocksAt, "Delay not met");

    withdrawalUnlocksAt = 0;
    // ... repartir fondos 50/50
}

// El owner puede cancelar durante el delay si vuelve
function cancelarRetiro() external onlyOwner {
    withdrawalUnlocksAt = 0;
    lastActivity = block.timestamp; // reset Dead Man's Switch
    emit WithdrawalCancelled(msg.sender);
}
```

### 4. Reentrancy en Retiro de Herencia

**Patron de proteccion**:

```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CajaFuerte is ReentrancyGuard {
    function ejecutarRetiro() external onlyHeredero nonReentrant {
        // Checks-Effects-Interactions pattern
        uint256 balance = address(this).balance;
        uint256 share = balance / 2;

        // Effects primero
        withdrawalUnlocksAt = 0;
        inheritanceRequestId++;

        // Interactions al final
        (bool sent1, ) = heredero1.call{value: share}("");
        require(sent1, "Transfer to H1 failed");
        (bool sent2, ) = heredero2.call{value: balance - share}("");
        require(sent2, "Transfer to H2 failed");

        emit InheritanceExecuted(heredero1, heredero2, balance);
    }
}
```

## Checklist de Seguridad para CajaFuerte

- [ ] `noActiveRecovery` modifier en todas las funciones que modifican herederos
- [ ] Nonce por heredero para prevenir replay attacks
- [ ] `block.chainid` en hashes de firma para prevenir cross-chain replay
- [ ] Timelock de 48h en retiros de herencia con notificacion al owner
- [ ] `cancelarRetiro()` disponible para el owner durante el periodo de delay
- [ ] `nonReentrant` en todas las funciones que transfieren fondos
- [ ] Checks-Effects-Interactions pattern en retiros
- [ ] Eventos emitidos en cada accion critica para monitoreo del agente
- [ ] Tests de fuzzing para Dead Man's Switch edge cases
- [ ] Auditoria con Slither antes de deploy a mainnet
