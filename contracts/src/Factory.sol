// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.10;

import {Wallet} from "HackITBA2026/Wallet.sol";
import {StrongBox} from "HackITBA2026/StrongBox.sol";

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

        Wallet wallet = new Wallet();
        address walletAddress = wallet.getAddress();

        emit NewWalletCreated(email, walletAddress);

        setWallet(email, walletAddress);
    }

    function createNewStrongBox(address walletAddress) public { // Quiza debe retornar bool
        if (getStrongBox(walletAddress) != address(0)) {
            revert UserAlreadyHaveStrongBox();
        }

        StrongBox strongBox = new StrongBox(walletAddress);
        address strongBoxAddress = strongBox.getAddress();

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