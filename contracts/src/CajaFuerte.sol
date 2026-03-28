// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CajaFuerte
 * @notice Boveda de ahorros con Dead Man's Switch y herencia.
 *         Owner = contrato Wallet. Soporta 2 herederos con distribucion 50/50.
 * @dev Dead Man's Switch: si el owner no llama resetTime() en `timeoutPeriod`,
 *      los herederos pueden retirar los fondos. Timelock de 48hs en retiros de herencia.
 */
contract CajaFuerte is ReentrancyGuard {
    // --- State ---
    address public owner;       // = Wallet contract
    address public userEOA;     // = cuenta externa del usuario (para UI queries)
    bool public initialized;

    // Herederos
    address public heredero1;
    address public heredero2;

    // Dead Man's Switch
    uint256 public lastActivity;
    uint256 public timeoutPeriod;  // en segundos (default 90 dias)

    // Herencia state machine
    enum RecoveryState { Inactive, Pending, Executed }
    RecoveryState public recoveryState;
    uint256 public recoveryRequestedAt;
    uint256 public constant TIMELOCK = 48 hours;

    // --- Events ---
    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event TimeReset(uint256 newTimestamp);
    event HerederosUpdated(address heredero1, address heredero2);
    event RecoveryInitiated(address indexed initiator, uint256 unlocksAt);
    event RecoveryCancelled(address indexed cancelledBy);
    event RecoveryExecuted(address indexed heredero1, address indexed heredero2, uint256 amountEach);
    event TimeoutPeriodUpdated(uint256 newPeriod);

    // --- Errors ---
    error OnlyOwner();
    error OnlyOwnerOrUserEOA();
    error AlreadyInitialized();
    error NotInitialized();
    error TransferFailed();
    error InsufficientBalance();
    error InvalidAddress();
    error InvalidAmount();
    error DeadManSwitchNotExpired();
    error RecoveryNotPending();
    error RecoveryAlreadyPending();
    error TimelockNotExpired();
    error OnlyHeredero();
    error RecoveryActiveCannotChangeHerederos();
    error InvalidTimeoutPeriod();
    error NoBalance();

    // --- Modifiers ---
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyOwnerOrEOA() {
        if (msg.sender != owner && msg.sender != userEOA) revert OnlyOwnerOrUserEOA();
        _;
    }

    modifier onlyHeredero() {
        if (msg.sender != heredero1 && msg.sender != heredero2) revert OnlyHeredero();
        _;
    }

    modifier whenInitialized() {
        if (!initialized) revert NotInitialized();
        _;
    }

    // --- Init ---
    /**
     * @notice Inicializa la CajaFuerte. Solo puede llamarse una vez (via Factory).
     * @param _owner Contrato Wallet que posee la CajaFuerte
     * @param _userEOA Cuenta externa del usuario (para queries y resetTime)
     * @param _heredero1 Primer heredero
     * @param _heredero2 Segundo heredero
     * @param _timeoutDays Dias de inactividad antes de activar herencia
     */
    function initialize(
        address _owner,
        address _userEOA,
        address _heredero1,
        address _heredero2,
        uint256 _timeoutDays
    ) external {
        if (initialized) revert AlreadyInitialized();
        if (_owner == address(0)) revert InvalidAddress();
        if (_userEOA == address(0)) revert InvalidAddress();
        if (_heredero1 == address(0)) revert InvalidAddress();
        if (_heredero2 == address(0)) revert InvalidAddress();
        if (_timeoutDays == 0) revert InvalidTimeoutPeriod();

        owner = _owner;
        userEOA = _userEOA;
        heredero1 = _heredero1;
        heredero2 = _heredero2;
        timeoutPeriod = _timeoutDays * 1 days;
        lastActivity = block.timestamp;
        recoveryState = RecoveryState.Inactive;
        initialized = true;
    }

    // --- Core ---
    /**
     * @notice Recibe depositos.
     */
    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @notice Deposita fondos en la CajaFuerte. Resetea el Dead Man's Switch.
     */
    function depositar() external payable whenInitialized {
        if (msg.value == 0) revert InvalidAmount();
        _resetTime();
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @notice Retira fondos de la CajaFuerte. Solo el Wallet (owner) puede.
     * @param amount Monto en wei
     * @param to Direccion destino
     */
    function retirar(uint256 amount, address to) 
        external 
        nonReentrant 
        whenInitialized 
        onlyOwner 
    {
        if (amount == 0) revert InvalidAmount();
        if (to == address(0)) revert InvalidAddress();
        if (address(this).balance < amount) revert InsufficientBalance();

        _resetTime();

        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Withdrawn(to, amount);
    }

    // --- Dead Man's Switch ---
    /**
     * @notice Resetea el timer del Dead Man's Switch. Owner o userEOA.
     *         El agente AI llama esto al detectar actividad del usuario.
     */
    function resetTime() external whenInitialized onlyOwnerOrEOA {
        _resetTime();
    }

    function _resetTime() internal {
        lastActivity = block.timestamp;
        emit TimeReset(block.timestamp);
    }

    /**
     * @notice Verifica si el Dead Man's Switch ha expirado.
     */
    function isExpired() public view returns (bool) {
        return block.timestamp > lastActivity + timeoutPeriod;
    }

    /**
     * @notice Tiempo restante antes de que expire el switch.
     */
    function timeRemaining() external view returns (uint256) {
        uint256 deadline = lastActivity + timeoutPeriod;
        if (block.timestamp >= deadline) return 0;
        return deadline - block.timestamp;
    }

    // --- Herencia ---
    /**
     * @notice Heredero inicia el proceso de recuperacion (requiere switch expirado).
     *         Empieza un timelock de 48hs durante el cual el owner puede cancelar.
     */
    function iniciarRecuperacion() external whenInitialized onlyHeredero {
        if (!isExpired()) revert DeadManSwitchNotExpired();
        if (recoveryState == RecoveryState.Pending) revert RecoveryAlreadyPending();
        if (address(this).balance == 0) revert NoBalance();

        recoveryState = RecoveryState.Pending;
        recoveryRequestedAt = block.timestamp;

        emit RecoveryInitiated(msg.sender, block.timestamp + TIMELOCK);
    }

    /**
     * @notice Owner cancela una recuperacion pendiente.
     */
    function cancelarRecuperacion() external whenInitialized onlyOwnerOrEOA {
        if (recoveryState != RecoveryState.Pending) revert RecoveryNotPending();

        recoveryState = RecoveryState.Inactive;
        recoveryRequestedAt = 0;
        _resetTime();

        emit RecoveryCancelled(msg.sender);
    }

    /**
     * @notice Ejecuta la recuperacion despues del timelock. Distribuye 50/50.
     */
    function ejecutarRecuperacion() 
        external 
        nonReentrant 
        whenInitialized 
        onlyHeredero 
    {
        if (recoveryState != RecoveryState.Pending) revert RecoveryNotPending();
        if (block.timestamp < recoveryRequestedAt + TIMELOCK) revert TimelockNotExpired();

        uint256 total = address(this).balance;
        if (total == 0) revert NoBalance();

        recoveryState = RecoveryState.Executed;

        uint256 half = total / 2;
        uint256 remainder = total - half; // handles odd wei

        (bool ok1, ) = heredero1.call{value: half}("");
        if (!ok1) revert TransferFailed();

        (bool ok2, ) = heredero2.call{value: remainder}("");
        if (!ok2) revert TransferFailed();

        emit RecoveryExecuted(heredero1, heredero2, half);
    }

    // --- Admin ---
    /**
     * @notice Actualiza herederos. No se puede durante recuperacion activa.
     */
    function actualizarHerederos(address _h1, address _h2) 
        external 
        whenInitialized 
        onlyOwnerOrEOA 
    {
        if (recoveryState == RecoveryState.Pending) revert RecoveryActiveCannotChangeHerederos();
        if (_h1 == address(0) || _h2 == address(0)) revert InvalidAddress();

        heredero1 = _h1;
        heredero2 = _h2;

        emit HerederosUpdated(_h1, _h2);
    }

    /**
     * @notice Actualiza el periodo de timeout (en dias).
     */
    function actualizarTimeout(uint256 _days) external whenInitialized onlyOwnerOrEOA {
        if (_days == 0) revert InvalidTimeoutPeriod();
        timeoutPeriod = _days * 1 days;
        emit TimeoutPeriodUpdated(timeoutPeriod);
    }

    // --- View ---
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getHerederos() external view returns (address, address) {
        return (heredero1, heredero2);
    }

    function getRecoveryInfo() external view returns (
        RecoveryState state,
        uint256 requestedAt,
        uint256 unlocksAt
    ) {
        state = recoveryState;
        requestedAt = recoveryRequestedAt;
        unlocksAt = recoveryState == RecoveryState.Pending 
            ? recoveryRequestedAt + TIMELOCK 
            : 0;
    }
}
