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
    error NotOwnerOrUserEOA();
    error InsufficientBalance();
    error TransferFailed();
    error WithdrawalNotApproved();
    error AlreadyApproved();
    error NoWithdrawalPending();

    event Inherited(address indexed heir, uint256 amount);
    event TimeUpdated(uint256 timestamp);
    event WithdrawalRequested(uint256 indexed requestId, uint256 amount, address to);
    event WithdrawalApproved(uint256 indexed requestId, address indexed heir);
    event WithdrawalExecuted(uint256 indexed requestId, uint256 amount, address to);

    /// @dev Timestamp de la ultima interaccion del owner
    uint256 private lastTimeUsed;

    /// @dev Periodo de inactividad antes de que los herederos puedan reclamar (1 año)
    uint256 private timeLimit = 365 days;

    /// @dev Estructura para solicitudes de retiro pendientes
    struct WithdrawalRequest {
        uint256 amount;
        address to;
        bool heir1Approved;
        bool heir2Approved;
        bool executed;
    }

    uint256 private withdrawalRequestCount;
    mapping(uint256 => WithdrawalRequest) private withdrawalRequests;

    /// @dev EOA del usuario que puede configurar herederos (ademas del owner contrato Wallet)
    address private immutable userEOA;

    modifier onlyAfterTime() {
        require(block.timestamp - lastTimeUsed >= timeLimit, "Time limit not reached yet");
        _;
    }

    modifier OnlyOwnerOrUserEOA() {
        if (msg.sender != getOwner() && msg.sender != userEOA) {
            revert NotOwnerOrUserEOA();
        }
        _;
    }

    /// @param initialOwner Dueno del contrato (normalmente la Wallet desplegada)
    /// @param _userEOA Cuenta del usuario que firma desde el frontend para setear herederos
    constructor(address initialOwner, address _userEOA) Owner(initialOwner) {
        if (_userEOA == address(0)) revert InvalidAddress();
        userEOA = _userEOA;
        lastTimeUsed = block.timestamp;
    }

    function getUserEOA() external view returns (address) {
        return userEOA;
    }

    /// @inheritdoc HeirGuardians
    function setHeirGuardian1(address newHeirGuardian) public virtual override OnlyOwnerOrUserEOA {
        _setHeirGuardian1(newHeirGuardian);
    }

    /// @inheritdoc HeirGuardians
    function setHeirGuardian2(address newHeirGuardian) public virtual override OnlyOwnerOrUserEOA {
        _setHeirGuardian2(newHeirGuardian);
    }

    /// @notice Deposita BNB nativo en la caja fuerte. Solo el owner.
    /// @dev El ether llega via msg.value y queda en el contrato automaticamente.
    function deposit() external payable OnlyOwner {
        if (msg.value == 0) revert InvalidAmount();
        _updateTime();
    }

    /// @notice Solicita un retiro de la caja fuerte (solo owner).
    ///         Requiere aprobacion de ambos herederos antes de ejecutarse.
    /// @param amount Cantidad en wei a retirar
    /// @param to Direccion destino del retiro
    /// @return requestId ID de la solicitud de retiro
    function requestWithdrawal(uint256 amount, address to) external OnlyOwner returns (uint256 requestId) {
        if (amount == 0) revert InvalidAmount();
        if (to == address(0)) revert InvalidAddress();
        if (address(this).balance < amount) revert InsufficientBalance();

        _updateTime();

        requestId = withdrawalRequestCount++;
        withdrawalRequests[requestId] = WithdrawalRequest({
            amount: amount,
            to: to,
            heir1Approved: false,
            heir2Approved: false,
            executed: false
        });

        emit WithdrawalRequested(requestId, amount, to);
    }

    /// @notice Un heredero aprueba una solicitud de retiro pendiente
    /// @param requestId ID de la solicitud a aprobar
    function approveWithdrawal(uint256 requestId) external OnlyHeirGuardians {
        WithdrawalRequest storage req = withdrawalRequests[requestId];
        if (req.amount == 0) revert NoWithdrawalPending();
        if (req.executed) revert NoWithdrawalPending();

        if (msg.sender == getHeirGuardian1()) {
            if (req.heir1Approved) revert AlreadyApproved();
            req.heir1Approved = true;
        } else {
            if (req.heir2Approved) revert AlreadyApproved();
            req.heir2Approved = true;
        }

        emit WithdrawalApproved(requestId, msg.sender);
    }

    /// @notice Ejecuta un retiro aprobado por ambos herederos (solo owner)
    /// @param requestId ID de la solicitud a ejecutar
    function executeWithdrawal(uint256 requestId) external OnlyOwner nonReentrant {
        WithdrawalRequest storage req = withdrawalRequests[requestId];
        if (req.amount == 0) revert NoWithdrawalPending();
        if (req.executed) revert NoWithdrawalPending();
        if (!req.heir1Approved || !req.heir2Approved) revert WithdrawalNotApproved();
        if (address(this).balance < req.amount) revert InsufficientBalance();

        req.executed = true;
        _updateTime();

        emit WithdrawalExecuted(requestId, req.amount, req.to);

        (bool success, ) = payable(req.to).call{value: req.amount}("");
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

    /// @notice Devuelve el timestamp de la ultima actividad
    function getLastTimeUsed() external view returns(uint256) {
        return lastTimeUsed;
    }

    /// @notice Devuelve el periodo de timeout configurado
    function getTimeLimit() external view returns(uint256) {
        return timeLimit;
    }

    /// @notice Consulta el estado de una solicitud de retiro
    function getWithdrawalRequest(uint256 requestId) external view returns (
        uint256 amount, address to, bool heir1Approved, bool heir2Approved, bool executed
    ) {
        WithdrawalRequest storage req = withdrawalRequests[requestId];
        return (req.amount, req.to, req.heir1Approved, req.heir2Approved, req.executed);
    }

    /// @notice Permite a un heredero reclamar su parte de los fondos despues del tiempo limite.
    ///         Cada heredero reclama individualmente su mitad (50%).
    function inherit() external OnlyHeirGuardians onlyAfterTime nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) {
            revert BalanceEqualsZero();
        }

        uint256 amountPerHeir = balance / 2;
        emit Inherited(msg.sender, amountPerHeir);

        (bool success, ) = payable(msg.sender).call{value: amountPerHeir}("");
        if (!success) revert TransferFailed();
    }

    /// @dev Actualiza el timestamp de ultima actividad (uso interno)
    function _updateTime() private {
        lastTimeUsed = block.timestamp;
        emit TimeUpdated(block.timestamp);
    }

    /// @dev Permite recibir BNB nativo directamente — solo el owner puede depositar
    receive() external payable OnlyOwner {
        _updateTime();
    }
}
