// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Wallet.sol";
import "./CajaFuerte.sol";

/**
 * @title SmartWalletFactory
 * @notice Despliega pares Wallet + CajaFuerte con CREATE2 para direcciones deterministas.
 *         Un usuario solo puede tener un par de contratos.
 * @dev El Agente AI orquesta llamadas a crear() verificando con checkUserHasAccount().
 */
contract SmartWalletFactory {
    // --- State ---
    struct UserContracts {
        address wallet;
        address cajaFuerte;
        bool exists;
    }

    mapping(address => UserContracts) public userContracts;
    address[] public allUsers;

    // --- Events ---
    event AccountCreated(
        address indexed user,
        address indexed wallet,
        address indexed cajaFuerte,
        address heredero1,
        address heredero2
    );

    // --- Errors ---
    error AccountAlreadyExists();
    error InvalidAddress();
    error InvalidTimeoutPeriod();

    // --- Core ---
    /**
     * @notice Crea un par Wallet + CajaFuerte para el msg.sender.
     * @param heredero1 Primer heredero para la CajaFuerte
     * @param heredero2 Segundo heredero
     * @param timeoutDays Dias de inactividad para el Dead Man's Switch
     */
    function crear(
        address heredero1,
        address heredero2,
        uint256 timeoutDays
    ) external returns (address walletAddr, address cajaFuerteAddr) {
        if (userContracts[msg.sender].exists) revert AccountAlreadyExists();
        if (heredero1 == address(0) || heredero2 == address(0)) revert InvalidAddress();
        if (timeoutDays == 0) revert InvalidTimeoutPeriod();

        // Salt = hash del user address para determinismo
        bytes32 salt = keccak256(abi.encodePacked(msg.sender));

        // Deploy Wallet con CREATE2
        Wallet wallet = new Wallet{salt: salt}();
        walletAddr = address(wallet);

        // Deploy CajaFuerte con CREATE2
        CajaFuerte cajaFuerte = new CajaFuerte{salt: salt}();
        cajaFuerteAddr = address(cajaFuerte);

        // Initialize: Wallet.owner = msg.sender, CajaFuerte.owner = wallet
        wallet.initialize(msg.sender, cajaFuerteAddr);
        cajaFuerte.initialize(walletAddr, msg.sender, heredero1, heredero2, timeoutDays);

        // Track
        userContracts[msg.sender] = UserContracts({
            wallet: walletAddr,
            cajaFuerte: cajaFuerteAddr,
            exists: true
        });
        allUsers.push(msg.sender);

        emit AccountCreated(msg.sender, walletAddr, cajaFuerteAddr, heredero1, heredero2);
    }

    // --- Views ---
    /**
     * @notice Verifica si un usuario ya tiene cuenta.
     */
    function checkUserHasAccount(address user) external view returns (bool) {
        return userContracts[user].exists;
    }

    /**
     * @notice Obtiene la Wallet de un usuario.
     */
    function getWallet(address user) external view returns (address) {
        return userContracts[user].wallet;
    }

    /**
     * @notice Obtiene la CajaFuerte de un usuario.
     */
    function getCajaFuerte(address user) external view returns (address) {
        return userContracts[user].cajaFuerte;
    }

    /**
     * @notice Total de usuarios registrados.
     */
    function totalUsers() external view returns (uint256) {
        return allUsers.length;
    }
}
