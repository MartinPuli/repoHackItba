// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Wallet -- Billetera de gasto diario
/// @notice Permite enviar, recibir y consultar balance de BNB nativos.
///         Solo el owner puede enviar fondos; cualquiera puede depositar.
contract Wallet is ReentrancyGuard {

    error InvalidAmount();
    error InvalidAddress();
    error SelfTransferNotAllowed();
    error TransferFailed();
    error NotOwner();

    event Sent(address indexed from, address indexed to, uint256 amount);
    event Received(address indexed from, uint256 amount);

    /// @dev Dueno de la wallet, unico autorizado a enviar fondos
    address private immutable owner;

    /// @param _owner Direccion del dueño. Se setea en deploy y no cambia.
    constructor(address _owner) {
        if (_owner == address(0)) revert InvalidAddress();
        owner = _owner;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @notice Envia BNB nativo desde el balance del contrato hacia `to`
    /// @param to Direccion destino
    /// @param amount Cantidad en wei a enviar
    function sendTo(address to, uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert InvalidAmount();
        if (to == address(0)) revert InvalidAddress();
        if (to == address(this)) revert SelfTransferNotAllowed();
        if (amount > address(this).balance) revert InvalidAmount();

        // Checks-Effects-Interactions: emit after checks, call last
        emit Sent(address(this), to, amount);

        (bool success, ) = payable(to).call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /// @notice Consulta el balance nativo del contrato
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Devuelve la direccion del owner
    function getOwner() external view returns (address) {
        return owner;
    }

    /// @notice Devuelve la direccion del contrato (conveniencia para Factory)
    function getAddress() external view returns (address) {
        return address(this);
    }

    /// @dev Permite recibir BNB nativo via transferencia directa o call sin data
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    /// @dev Permite recibir BNB nativo via call con data arbitraria
    fallback() external payable {
        emit Received(msg.sender, msg.value);
    }
}
