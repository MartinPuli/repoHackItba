// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.10;

contract Factory {

    error UserAlreadyHaveWallet();
    error UserAlreadyHaveStrongBox();

    event NewWalletCreated(string indexed email, address indexed wallet);
    event NewStrongBoxCreated(address indexed wallet, address indexed strongBox);

    mapping (string => address) emailToWallet;
    mapping (address => address) walletToStrongBox;

    function createNewWallet(string memory email) public { // Quiza debe retornar bool
        if (getWallet(email) != address(0)) {
            revert UserAlreadyHaveWallet();
        }

        // Creamos wallet al nuevo usuario

        emit NewWalletCreated(email, walletAddress);

        setWallet(email, walletAddress);
    }

    function createNewStrongBox(address walletAddress) public { // Quiza debe retornar bool
        if (getStrongBox(walletAddress) != address(0)) {
            revert UserAlreadyHaveStrongBox();
        }

        // Creamos strongbox al usuario que lo desee

        emit NewStrongBoxCreated(walletAddress, strongBoxAddress);

        setStrongBox(walletAddress, strongBoxAddress);
    }

    function getWallet(string memory email) public view returns(address) {
        return emailToWallet[email];
    }

    function getStrongBox(address wallet) public view returns(address) {
        return walletToStrongBox[wallet];
    }

    function setWallet(string memory email, address wallet) private {
        emailToWallet[email] = wallet;
    }

    function setStrongBox(address wallet, address strongBox) private {
        walletToStrongBox[wallet] = strongBox;
    }
}