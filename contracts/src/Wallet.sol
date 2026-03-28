// SPDX-License-Identifier: MIT

// AGREGAR EL ONLYOWNER A ESTE S.C. PARA HACERLO MAS SEGURO (EL ADDRESS VA A ESTAR EN EL BACKEND Y LO COMPARAMOS CON EL QUE
// QUEDO GUARDADO EN LA BLOCKCHAIN QUE VA A SER Owner(address(this)) )

pragma solidity >= 0.8.10;

contract Wallet {

    error InvalidAmount();
    error InvalidAddress();
    error SelfTransferNotAllowed();
    error TransferFailed();

    event Tx(address indexed _from, address indexed _to, uint256 _amount);

    function SendTo(address to) public payable returns(bool) {
        if (msg.value == 0) revert InvalidAmount(); // Deberia verificar si: el msg.value == 0 or msg.value > balance???
        if (address(this) == to) revert SelfTransferNotAllowed();
        if (to == address(0)) revert InvalidAddress();

        emit Tx(address(this), to, msg.value);

        (bool success, ) = payable(to).call{value: msg.value}("");
        if (!success) revert TransferFailed();

        return true;
    }

    // receive() external payable {} QUIZA DEBAMOS USAR ESTA FUNCION

    function Receive() public payable returns(bool) {
        if (msg.value == 0) revert InvalidAmount(); // Deberia verificar si: el msg.value == 0 or msg.value > balance???
        if (msg.sender == address(this)) revert SelfTransferNotAllowed();

        emit Tx(msg.sender, address(this), msg.value);

        (bool success, ) = payable(address(this)).call{value: msg.value}("");
        if (!success) revert TransferFailed();

        return true;
    }

    function GetBalance() public view returns (uint) {
        return address(this).balance;
    }

    function getAddress() public view returns (address) {
        return address(this);
    }
}