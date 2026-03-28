// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title FiatRamp — On/Off-Ramp simulado ARS ↔ USDT para demo hackathon
///
/// @notice Simula el flujo:
///   ON-RAMP:  Usuario deposita ARS (off-chain) → recibe mUSDT en su wallet on-chain
///   OFF-RAMP: Usuario envía mUSDT → recibe ARS en su cuenta bancaria (off-chain)
///
/// @dev En producción esto sería reemplazado por integración con un proveedor
///      fiat real (Lemon, Ripio, etc). El contrato actúa como escrow + oracle de TC.
///
/// @author Smart Wallet HackITBA 2026
contract FiatRamp is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // =========================================================================
    //                              ESTADO
    // =========================================================================

    /// @notice Token stablecoin que se usa como puente (mUSDT en testnet)
    IERC20 public immutable stablecoin;

    /// @notice Tipo de cambio ARS por 1 USDT (con 2 decimales de precisión)
    ///         Ej: 120000 = 1200.00 ARS por USDT
    uint256 public exchangeRate;

    /// @notice Spread del off-ramp en basis points (100 = 1%)
    uint256 public offRampSpreadBps;

    /// @notice Spread del on-ramp en basis points (100 = 1%)
    uint256 public onRampSpreadBps;

    /// @notice Límite diario de off-ramp por usuario (en USDT, 6 decimales)
    uint256 public dailyOffRampLimit;

    /// @notice Monto off-ramped hoy por usuario
    mapping(address => uint256) public dailyOffRamped;

    /// @notice Último día (timestamp / 1 day) de off-ramp por usuario
    mapping(address => uint256) public lastOffRampDay;

    /// @notice Órdenes de on-ramp pendientes (operador las completa cuando confirma el pago ARS)
    mapping(uint256 => OnRampOrder) public onRampOrders;
    uint256 public nextOrderId;

    /// @notice Dirección autorizada para confirmar on-ramps (simula el backend/operador)
    address public operator;

    // =========================================================================
    //                            ESTRUCTURAS
    // =========================================================================

    enum OrderStatus {
        Pending,    // Esperando confirmación de pago ARS
        Completed,  // USDT entregado al usuario
        Cancelled   // Cancelada
    }

    struct OnRampOrder {
        address user;           // Wallet destino del usuario
        uint256 arsAmount;      // Monto en ARS (2 decimales: 100000 = 1000.00 ARS)
        uint256 usdtAmount;     // USDT a recibir (ya con spread aplicado)
        OrderStatus status;
        uint256 createdAt;
    }

    // =========================================================================
    //                              EVENTOS
    // =========================================================================

    event OnRampRequested(
        uint256 indexed orderId,
        address indexed user,
        uint256 arsAmount,
        uint256 usdtAmount
    );

    event OnRampCompleted(
        uint256 indexed orderId,
        address indexed user,
        uint256 usdtAmount
    );

    event OnRampCancelled(uint256 indexed orderId);

    event OffRampExecuted(
        address indexed user,
        uint256 usdtAmount,
        uint256 arsAmount,
        string bankAccount
    );

    event ExchangeRateUpdated(uint256 oldRate, uint256 newRate);
    event SpreadUpdated(string rampType, uint256 oldBps, uint256 newBps);
    event OperatorUpdated(address oldOperator, address newOperator);

    // =========================================================================
    //                              ERRORES
    // =========================================================================

    error ZeroAmount();
    error InvalidRate();
    error DailyLimitExceeded(uint256 requested, uint256 remaining);
    error OrderNotPending(uint256 orderId);
    error InsufficientLiquidity(uint256 requested, uint256 available);
    error NotOperator();
    error EmptyBankAccount();
    error SpreadTooHigh();

    // =========================================================================
    //                           CONSTRUCTOR
    // =========================================================================

    /// @param _stablecoin Address del token mUSDT
    /// @param _exchangeRate Tipo de cambio ARS/USDT con 2 decimales (ej: 120000 = 1200.00)
    /// @param _operator Address autorizada para confirmar on-ramps
    constructor(
        address _stablecoin,
        uint256 _exchangeRate,
        address _operator
    ) Ownable(msg.sender) {
        if (_exchangeRate == 0) revert InvalidRate();

        stablecoin = IERC20(_stablecoin);
        exchangeRate = _exchangeRate;
        operator = _operator;

        // Defaults: 1% spread on-ramp, 1.5% spread off-ramp
        onRampSpreadBps = 100;
        offRampSpreadBps = 150;

        // Límite diario off-ramp: 1000 USDT
        dailyOffRampLimit = 1000 * 1e6;
    }

    // =========================================================================
    //                         MODIFIERS
    // =========================================================================

    modifier onlyOperator() {
        if (msg.sender != operator) revert NotOperator();
        _;
    }

    // =========================================================================
    //                     ON-RAMP: ARS → USDT
    // =========================================================================

    /// @notice Paso 1: Usuario solicita on-ramp. Indica cuántos ARS va a transferir.
    ///         El operador (backend) confirma cuando el pago ARS se acredita.
    /// @param arsAmount Monto en ARS con 2 decimales (ej: 100000 = 1000.00 ARS)
    /// @return orderId ID de la orden creada
    function requestOnRamp(uint256 arsAmount) external returns (uint256 orderId) {
        if (arsAmount == 0) revert ZeroAmount();

        // Calcular USDT que recibirá (ARS / TC, descontando spread)
        uint256 usdtAmount = _arsToUsdt(arsAmount, onRampSpreadBps);

        orderId = nextOrderId++;
        onRampOrders[orderId] = OnRampOrder({
            user: msg.sender,
            arsAmount: arsAmount,
            usdtAmount: usdtAmount,
            status: OrderStatus.Pending,
            createdAt: block.timestamp
        });

        emit OnRampRequested(orderId, msg.sender, arsAmount, usdtAmount);
    }

    /// @notice Paso 2: Operador confirma que recibió el pago ARS → mintea/envía USDT al usuario
    /// @param orderId ID de la orden a completar
    function completeOnRamp(uint256 orderId) external onlyOperator nonReentrant {
        OnRampOrder storage order = onRampOrders[orderId];
        if (order.status != OrderStatus.Pending) revert OrderNotPending(orderId);

        uint256 available = stablecoin.balanceOf(address(this));
        if (available < order.usdtAmount) {
            revert InsufficientLiquidity(order.usdtAmount, available);
        }

        order.status = OrderStatus.Completed;
        stablecoin.safeTransfer(order.user, order.usdtAmount);

        emit OnRampCompleted(orderId, order.user, order.usdtAmount);
    }

    /// @notice Cancelar orden de on-ramp (solo operador o el usuario que la creó)
    function cancelOnRamp(uint256 orderId) external {
        OnRampOrder storage order = onRampOrders[orderId];
        if (order.status != OrderStatus.Pending) revert OrderNotPending(orderId);
        if (msg.sender != operator && msg.sender != order.user) revert NotOperator();

        order.status = OrderStatus.Cancelled;
        emit OnRampCancelled(orderId);
    }

    // =========================================================================
    //                     OFF-RAMP: USDT → ARS
    // =========================================================================

    /// @notice Usuario envía USDT al contrato y recibe ARS en su cuenta bancaria.
    ///         El pago ARS se ejecuta off-chain por el operador.
    /// @param usdtAmount Monto de USDT a convertir (6 decimales)
    /// @param bankAccount CBU/CVU/alias del usuario (string para demo)
    function offRamp(uint256 usdtAmount, string calldata bankAccount) external nonReentrant {
        if (usdtAmount == 0) revert ZeroAmount();
        if (bytes(bankAccount).length == 0) revert EmptyBankAccount();

        // Verificar límite diario
        _checkAndUpdateDailyLimit(msg.sender, usdtAmount);

        // Calcular ARS que recibirá (USDT * TC, descontando spread)
        uint256 arsAmount = _usdtToArs(usdtAmount, offRampSpreadBps);

        // Transferir USDT del usuario al contrato
        stablecoin.safeTransferFrom(msg.sender, address(this), usdtAmount);

        // Evento para que el operador/backend ejecute la transferencia ARS
        emit OffRampExecuted(msg.sender, usdtAmount, arsAmount, bankAccount);
    }

    // =========================================================================
    //                          ADMIN
    // =========================================================================

    /// @notice Actualizar tipo de cambio ARS/USDT
    function setExchangeRate(uint256 newRate) external onlyOwner {
        if (newRate == 0) revert InvalidRate();
        emit ExchangeRateUpdated(exchangeRate, newRate);
        exchangeRate = newRate;
    }

    /// @notice Actualizar spread del on-ramp
    function setOnRampSpread(uint256 newBps) external onlyOwner {
        if (newBps > 1000) revert SpreadTooHigh(); // max 10%
        emit SpreadUpdated("onRamp", onRampSpreadBps, newBps);
        onRampSpreadBps = newBps;
    }

    /// @notice Actualizar spread del off-ramp
    function setOffRampSpread(uint256 newBps) external onlyOwner {
        if (newBps > 1000) revert SpreadTooHigh(); // max 10%
        emit SpreadUpdated("offRamp", offRampSpreadBps, newBps);
        offRampSpreadBps = newBps;
    }

    /// @notice Actualizar límite diario de off-ramp
    function setDailyOffRampLimit(uint256 newLimit) external onlyOwner {
        dailyOffRampLimit = newLimit;
    }

    /// @notice Cambiar operador
    function setOperator(address newOperator) external onlyOwner {
        emit OperatorUpdated(operator, newOperator);
        operator = newOperator;
    }

    /// @notice Depositar liquidez USDT para on-ramps (el owner fondea el contrato)
    function depositLiquidity(uint256 amount) external onlyOwner {
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);
    }

    /// @notice Retirar liquidez USDT del contrato
    function withdrawLiquidity(uint256 amount) external onlyOwner {
        stablecoin.safeTransfer(msg.sender, amount);
    }

    // =========================================================================
    //                         VIEW FUNCTIONS
    // =========================================================================

    /// @notice Cuántos USDT recibiría el usuario por X ARS (on-ramp)
    function quoteOnRamp(uint256 arsAmount) external view returns (uint256 usdtAmount) {
        return _arsToUsdt(arsAmount, onRampSpreadBps);
    }

    /// @notice Cuántos ARS recibiría el usuario por X USDT (off-ramp)
    function quoteOffRamp(uint256 usdtAmount) external view returns (uint256 arsAmount) {
        return _usdtToArs(usdtAmount, offRampSpreadBps);
    }

    /// @notice Liquidez disponible para on-ramps
    function availableLiquidity() external view returns (uint256) {
        return stablecoin.balanceOf(address(this));
    }

    /// @notice Límite diario restante para un usuario
    function remainingDailyLimit(address user) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        if (lastOffRampDay[user] != today) {
            return dailyOffRampLimit;
        }
        if (dailyOffRamped[user] >= dailyOffRampLimit) {
            return 0;
        }
        return dailyOffRampLimit - dailyOffRamped[user];
    }

    /// @notice Obtener detalle de una orden de on-ramp
    function getOnRampOrder(uint256 orderId)
        external
        view
        returns (
            address user,
            uint256 arsAmount,
            uint256 usdtAmount,
            OrderStatus status,
            uint256 createdAt
        )
    {
        OnRampOrder storage order = onRampOrders[orderId];
        return (order.user, order.arsAmount, order.usdtAmount, order.status, order.createdAt);
    }

    // =========================================================================
    //                         INTERNALS
    // =========================================================================

    /// @dev Convierte ARS → USDT descontando spread
    ///      arsAmount tiene 2 decimales, resultado tiene 6 decimales (USDT)
    function _arsToUsdt(uint256 arsAmount, uint256 spreadBps) internal view returns (uint256) {
        // arsAmount (2 dec) * 1e6 / exchangeRate (2 dec) = USDT (6 dec)
        // Spread: reducimos lo que recibe el usuario
        uint256 effectiveRate = exchangeRate * (10000 + spreadBps) / 10000;
        return (arsAmount * 1e6) / effectiveRate;
    }

    /// @dev Convierte USDT → ARS descontando spread
    ///      usdtAmount tiene 6 decimales, resultado tiene 2 decimales (ARS)
    function _usdtToArs(uint256 usdtAmount, uint256 spreadBps) internal view returns (uint256) {
        // usdtAmount (6 dec) * exchangeRate (2 dec) / 1e6 = ARS (2 dec)
        // Spread: reducimos lo que recibe el usuario
        uint256 effectiveRate = exchangeRate * (10000 - spreadBps) / 10000;
        return (usdtAmount * effectiveRate) / 1e6;
    }

    /// @dev Verifica y actualiza el límite diario de off-ramp
    function _checkAndUpdateDailyLimit(address user, uint256 amount) internal {
        uint256 today = block.timestamp / 1 days;

        // Reset si es un nuevo día
        if (lastOffRampDay[user] != today) {
            dailyOffRamped[user] = 0;
            lastOffRampDay[user] = today;
        }

        uint256 remaining = dailyOffRampLimit - dailyOffRamped[user];
        if (amount > remaining) {
            revert DailyLimitExceeded(amount, remaining);
        }

        dailyOffRamped[user] += amount;
    }
}
