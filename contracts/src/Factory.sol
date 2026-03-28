// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Wallet} from "./Wallet.sol";
import {StrongBox} from "./StrongBox.sol";

/// @title Factory -- Registro central de wallets y strongboxes
/// @notice Mapea email a wallet address, y wallet a strongbox.
///         Despliega las instancias de ambos contratos.
contract Factory {

    error UserAlreadyHaveWallet();
    error UserAlreadyHaveStrongBox();
    error WalletNotRegistered();

    event NewWalletCreated(string indexed email, address indexed wallet);
    event NewStrongBoxCreated(address indexed wallet, address indexed strongBox);

    mapping (string => address) emailToWallet;
    mapping (address => address) walletToStrongBox;

    /// @notice Crea una nueva wallet para el email dado
    /// @dev La empresa (deployer) llama esta funcion; el owner de la wallet es userAddress
    /// @param email Identificador unico del usuario
    /// @param userAddress Direccion del usuario que sera owner de la wallet
    /// @return La direccion del contrato Wallet desplegado
    function createNewWallet(string memory email, address userAddress) public returns (address) {
        if (getWallet(email) != address(0)) {
            revert UserAlreadyHaveWallet();
        }

        Wallet wallet = new Wallet(userAddress);
        address walletAddress = wallet.getAddress();

        setWallet(email, walletAddress);
        emit NewWalletCreated(email, walletAddress);

        return walletAddress;
    }

    /// @notice Crea una StrongBox vinculada a una wallet existente
    /// @dev El owner de la StrongBox sera walletAddress (la wallet controla la caja fuerte)
    /// @param walletAddress Direccion de la wallet a la que se vincula (debe estar registrada en esta Factory)
    /// @return strongBoxAddress Direccion del contrato StrongBox desplegado
    function createNewStrongBox(address walletAddress) public returns (address strongBoxAddress) {
        if (getStrongBox(walletAddress) != address(0)) {
            revert UserAlreadyHaveStrongBox();
        }

        // Verificar que la wallet es un contrato desplegado (no un EOA arbitrario).
        // No podemos iterar el mapping, pero al menos verificamos que tiene codigo.
        if (walletAddress == address(0) || walletAddress.code.length == 0) {
            revert WalletNotRegistered();
        }

        StrongBox strongBox = new StrongBox(walletAddress);
        strongBoxAddress = strongBox.getAddress();

        setStrongBox(walletAddress, strongBoxAddress);
        emit NewStrongBoxCreated(walletAddress, strongBoxAddress);
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
