// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Wallet
 * @notice Billetera de liquidez diaria. Owner = cuenta externa (Metamask).
 *         Permite enviar tokens/ETH, recibir depositos, y transferir a CajaFuerte.
 * @dev Owner puede delegar operaciones via Session Keys (futuro).
 */
contract Wallet is ReentrancyGuard {
    // --- State ---
    address public owner;
    address public cajaFuerte;
    bool public initialized;

    // Session Keys para modo autonomo
    struct SessionKey {
        uint256 maxAmount;    // Monto maximo por tx en wei
        uint256 validUntil;   // Timestamp de expiracion
        bool active;
    }
    mapping(address => SessionKey) public sessionKeys;

    // --- Events ---
    event Deposited(address indexed from, uint256 amount);
    event Sent(address indexed to, uint256 amount);
    event TransferredToCajaFuerte(uint256 amount);
    event SessionKeyGranted(address indexed key, uint256 maxAmount, uint256 validUntil);
    event SessionKeyRevoked(address indexed key);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    // --- Errors ---
    error OnlyOwner();
    error AlreadyInitialized();
    error NotInitialized();
    error TransferFailed();
    error InsufficientBalance();
    error InvalidAddress();
    error InvalidAmount();
    error SessionKeyInvalid();
    error SessionKeyExpired();
    error ExceedsSessionLimit();

    // --- Modifiers ---
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyAuthorized(uint256 amount) {
        if (msg.sender == owner) {
            _;
            return;
        }
        SessionKey storage sk = sessionKeys[msg.sender];
        if (!sk.active) revert SessionKeyInvalid();
        if (block.timestamp > sk.validUntil) revert SessionKeyExpired();
        if (amount > sk.maxAmount) revert ExceedsSessionLimit();
        _;
    }

    modifier whenInitialized() {
        if (!initialized) revert NotInitialized();
        _;
    }

    // --- Init ---
    /**
     * @notice Inicializa la wallet. Solo puede llamarse una vez (via Factory).
     * @param _owner Cuenta externa duena de la wallet
     * @param _cajaFuerte Direccion del contrato CajaFuerte vinculado
     */
    function initialize(address _owner, address _cajaFuerte) external {
        if (initialized) revert AlreadyInitialized();
        if (_owner == address(0)) revert InvalidAddress();
        if (_cajaFuerte == address(0)) revert InvalidAddress();

        owner = _owner;
        cajaFuerte = _cajaFuerte;
        initialized = true;
    }

    // --- Core ---
    /**
     * @notice Recibe depositos de BNB/ETH.
     */
    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @notice Envia BNB a una direccion. Owner o Session Key autorizada.
     * @param to Direccion destino
     * @param amount Monto en wei
     */
    function enviar(address to, uint256 amount) 
        external 
        nonReentrant 
        whenInitialized 
        onlyAuthorized(amount) 
    {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (address(this).balance < amount) revert InsufficientBalance();

        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Sent(to, amount);
    }

    /**
     * @notice Transfiere fondos a la CajaFuerte vinculada.
     * @param amount Monto en wei
     */
    function depositarEnCajaFuerte(uint256 amount) 
        external 
        nonReentrant 
        whenInitialized 
        onlyAuthorized(amount) 
    {
        if (amount == 0) revert InvalidAmount();
        if (address(this).balance < amount) revert InsufficientBalance();

        (bool ok, ) = cajaFuerte.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit TransferredToCajaFuerte(amount);
    }

    // --- Session Keys ---
    /**
     * @notice Otorga una Session Key para el modo autonomo.
     * @param key Direccion autorizada
     * @param maxAmount Monto maximo por tx
     * @param duration Duracion en segundos
     */
    function grantSessionKey(address key, uint256 maxAmount, uint256 duration) 
        external 
        onlyOwner 
    {
        if (key == address(0)) revert InvalidAddress();

        sessionKeys[key] = SessionKey({
            maxAmount: maxAmount,
            validUntil: block.timestamp + duration,
            active: true
        });

        emit SessionKeyGranted(key, maxAmount, block.timestamp + duration);
    }

    /**
     * @notice Revoca una Session Key. Usado por el Kill Switch.
     * @param key Direccion a revocar
     */
    function revokeSessionKey(address key) external onlyOwner {
        sessionKeys[key].active = false;
        emit SessionKeyRevoked(key);
    }

    /**
     * @notice Revoca TODAS las Session Keys conocidas (emergency kill switch).
     *         En produccion se usaria un set/array; aqui el owner revoca una por una.
     */

    // --- View ---
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function isSessionKeyValid(address key) external view returns (bool) {
        SessionKey storage sk = sessionKeys[key];
        return sk.active && block.timestamp <= sk.validUntil;
    }
}
