// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Owner} from "./Owner.sol";
import {HeirGuardians} from "./HeirGuardians.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title StrongBox -- Caja fuerte con herencia y Dead Man's Switch
/// @notice Permite depositar ahorros a largo plazo. Si el owner no interactua
///         durante `timeLimit` segundos, los herederos pueden reclamar los fondos.
contract StrongBox is Owner, HeirGuardians, ReentrancyGuard {

    error BalanceEqualsZero();
    error InvalidAmount();
    error InvalidAddress();
    error InsufficientBalance();
    error TransferFailed();

    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event Inherited(address indexed heir1, address indexed heir2, uint256 amountEach);
    event TimeUpdated(uint256 timestamp);

    /// @dev Timestamp de la ultima interaccion del owner
    uint256 private lastTimeUsed;

    /// @dev Periodo de inactividad antes de que los herederos puedan reclamar (1 anio)
    uint256 private timeLimit = 365 days;

    modifier onlyAfterTime() {
        require(block.timestamp - lastTimeUsed >= timeLimit, "Time limit not reached yet");
        _;
    }

    /// @param initialOwner Direccion del dueno de la caja fuerte
    constructor(address initialOwner) Owner(initialOwner) {
        lastTimeUsed = block.timestamp;
    }

    /// @notice Deposita BNB nativo en la caja fuerte. Solo el owner.
    /// @dev El ether llega via msg.value y queda en el contrato automaticamente.
    function deposit() external payable OnlyOwner {
        if (msg.value == 0) revert InvalidAmount();

        _updateTime();
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Retira fondos de la caja fuerte (solo owner)
    /// @param amount Cantidad en wei a retirar
    /// @param to Direccion destino del retiro
    function withdraw(uint256 amount, address to) external OnlyOwner nonReentrant {
        if (amount == 0) revert InvalidAmount();
        if (to == address(0)) revert InvalidAddress();
        if (address(this).balance < amount) revert InsufficientBalance();

        _updateTime();

        // Checks-Effects-Interactions: emit before external call
        emit Withdrawn(to, amount);

        (bool success, ) = payable(to).call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /// @notice Consulta el balance de la caja fuerte
    function getBalance() external view returns(uint256) {
        return address(this).balance;
    }

    /// @notice Devuelve la direccion del contrato (conveniencia para Factory)
    function getAddress() external view returns (address) {
        return address(this);
    }

    /// @notice Resetea el timer del Dead Man's Switch (solo owner)
    function updateTime() external OnlyOwner {
        _updateTime();
    }

    /// @notice Devuelve el timestamp de la ultima actividad
    function getLastTimeUsed() external view returns(uint256) {
        return lastTimeUsed;
    }

    /// @notice Devuelve el periodo de timeout configurado
    function getTimeLimit() external view returns(uint256) {
        return timeLimit;
    }

    /// @notice Permite a los herederos reclamar los fondos despues del tiempo limite.
    ///         Requiere que ambos herederos esten configurados.
    ///         Divide el balance en partes iguales entre ambos herederos.
    function inherit() external OnlyHeirGuardians onlyAfterTime nonReentrant {
        // Verificar que ambos herederos esten configurados
        _requireBothHeirsSet();

        uint256 balance = address(this).balance;
        if (balance == 0) {
            revert BalanceEqualsZero();
        }

        address heir1 = getHeirGuardian1();
        address heir2 = getHeirGuardian2();

        // Dividir balance completo: heir1 recibe la mitad, heir2 recibe el resto
        // (evita perder 1 wei si el balance es impar)
        uint256 amountHeir1 = balance / 2;
        uint256 amountHeir2 = balance - amountHeir1;

        // Checks-Effects-Interactions: emit before external calls
        emit Inherited(heir1, heir2, amountHeir1);

        (bool s1, ) = payable(heir1).call{value: amountHeir1}("");
        if (!s1) revert TransferFailed();

        (bool s2, ) = payable(heir2).call{value: amountHeir2}("");
        if (!s2) revert TransferFailed();
    }

    /// @dev Actualiza el timestamp de ultima actividad (uso interno)
    function _updateTime() private {
        lastTimeUsed = block.timestamp;
        emit TimeUpdated(block.timestamp);
    }

    /// @dev Permite recibir BNB nativo directamente — actualiza Dead Man's Switch
    receive() external payable {
        // Solo actualizar timer si el sender es el owner
        // (evitar que un tercero resetee el switch)
        if (msg.sender == getOwner()) {
            _updateTime();
        }
        emit Deposited(msg.sender, msg.value);
    }
}
