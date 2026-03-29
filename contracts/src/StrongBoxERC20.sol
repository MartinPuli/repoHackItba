// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.10;

import {Owner} from "./Owner.sol";

// Interfaz para interactuar con tokens ERC-20
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

// Ejemplo con ERC-20
// Caso simplificado con 1 solo heir
contract StrongBoxERC20 is Owner {
    
    error BalanceEqualsZero();
    error TransferFailed();
    error NotHeir();
    error TooEarly();

    IERC20 public immutable token;
    address public heir; // El único heredero
    uint256 public lastTimeUsed;
    uint256 public constant TIME_LIMIT = 365 days;

    event DepositMade(address indexed from, uint256 amount);
    event Inherited(address indexed by, uint256 amount);

    // Modificador que reemplaza la lógica de guardianes
    modifier OnlyAfterTime() {
        if (block.timestamp - lastTimeUsed < TIME_LIMIT) revert TooEarly();
        _;
    }

    constructor(address initialOwner, address _heir, address _tokenAddress) Owner(initialOwner) {
        token = IERC20(_tokenAddress);
        heir = _heir;
        lastTimeUsed = block.timestamp;
    }

    // El dueño deposita tokens (previo approve en el contrato del token)
    function deposit(uint256 _amount) public OnlyOwner returns(bool) {
        updateTime();

        bool success = token.transferFrom(msg.sender, address(this), _amount);
        if (!success) revert TransferFailed();

        emit DepositMade(msg.sender, _amount);
        return true;
    }

    // Función para que el dueño actualice el contador y demuestre que está activo
    function updateTime() public OnlyOwner {
        lastTimeUsed = block.timestamp;
    }

    // Permite al dueño cambiar al heredero si lo desea
    function setHeir(address _newHeir) public OnlyOwner {
        heir = _newHeir;
    }

    // Función que ejecuta el heredero cuando el tiempo expira
    function inherit() public OnlyAfterTime returns(bool) {
        if (msg.sender != heir) revert NotHeir();

        uint256 totalBalance = token.balanceOf(address(this));
        if (totalBalance == 0) revert BalanceEqualsZero();

        // En esta versión simplificada, el heredero se lleva TODO el balance
        bool success = token.transfer(heir, totalBalance);
        if (!success) revert TransferFailed();

        emit Inherited(heir, totalBalance);
        return true;
    }

    function getBalance() public view returns(uint256) {
        return token.balanceOf(address(this));
    }
}