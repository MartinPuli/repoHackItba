// SPDX-License-Identifier: MIT

// DEBEMOS AGREGAR LA COLA DE PETICIONES DE RETIRO DE DINERO, LA CUAL DEBE SER ACEPTADA PREVIAMENTE POR LOS
// DOS HEREDEROS. UNA VEZ REALIZADO ESO (ES DECIR, LOS 2 HEREDEROS ACEPTARON LA RETIRADA) SE EJECUTA LA
// FUNCION DE RETIRO DE DINERO

pragma solidity >= 0.8.10;

import {Owner} from "HackITBA2026/Owner.sol";
import {HeirGuardians} from "HackITBA2026/HeirGuardians.sol";

contract StrongBox is Owner, HeirGuardians {

    error BalanceEqualsZero();
    error InvalidAmount();
    error SelfTransferNotAllowed();
    error TransferFailed();

    event TxToHeirGuardian(address indexed to, uint256 amount);

    uint private lastTimeUsed;
    uint private timeLimit = 365 * 24 * 60 * 60; // 1 año

    modifier OnlyAfterTime() {
        require(block.timestamp - lastTimeUsed >= timeLimit, "You can't withdraw yet");
        _;
    }

    constructor(address initialOwner) Owner(initialOwner) {}

    function deposit() public payable OnlyOwner returns(bool) {
        if (msg.value == 0) revert InvalidAmount();
        if (msg.sender == address(this)) revert SelfTransferNotAllowed();

        updateTime();

        (bool success, ) = payable(address(this)).call{value: msg.value}("");
        if (!success) revert TransferFailed();

        return true;
    }

    function withdraw() public payable OnlyOwner returns(bool) {
        updateTime();

        // Los guardianes herederos deben confirmar la transaccion

        return true;
    }

    function getBalance() public view OnlyOwner returns(uint) {
        return address(this).balance;
    }

    function getAddress() public view returns (address) {
        return address(this);
    }

    function updateTime() public OnlyOwner {
        lastTimeUsed = block.timestamp;
    }

    function inherit() public OnlyHeirGuardians OnlyAfterTime returns(bool) {
        //Si el segundo heredero retira después, se llevará el 50% de lo que quedó (es decir, el 25% del total original).

        if (address(this).balance == 0) {
            revert BalanceEqualsZero();
        }

        uint amount = address(this).balance / 2;
        address payable to = payable(msg.sender);

        emit TxToHeirGuardian(to, amount);
        
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();

        return true;
    }
}