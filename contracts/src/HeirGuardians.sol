// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Owner} from "./Owner.sol";

/// @title HeirGuardians -- Gestion de herederos para StrongBox
/// @notice Permite al owner designar dos herederos que podran reclamar fondos
///         si el Dead Man's Switch se activa.
abstract contract HeirGuardians is Owner {
    
    address private heirGuardian1;
    address private heirGuardian2;

    error InvalidHeirAddress(address heir);
    error HeirCannotBeOwner();
    error HeirsMustBeDifferent();
    error HeirsNotConfigured();

    event HeirGuardianUpdated(uint8 indexed slot, address oldHeir, address newHeir);

    constructor() {
        heirGuardian1 = address(0);
        heirGuardian2 = address(0);
    }

    modifier OnlyHeirGuardians() {
        if (msg.sender != heirGuardian1 && msg.sender != heirGuardian2) {
            revert InvalidHeirAddress(msg.sender);
        }
        _;
    }

    /// @notice Configura el heredero 1. Solo el owner puede llamar.
    function setHeirGuardian1(address newHeirGuardian) public OnlyOwner {
        _validateHeir(newHeirGuardian, heirGuardian2);
        address old = heirGuardian1;
        heirGuardian1 = newHeirGuardian;
        emit HeirGuardianUpdated(1, old, newHeirGuardian);
    }

    /// @notice Configura el heredero 2. Solo el owner puede llamar.
    function setHeirGuardian2(address newHeirGuardian) public OnlyOwner {
        _validateHeir(newHeirGuardian, heirGuardian1);
        address old = heirGuardian2;
        heirGuardian2 = newHeirGuardian;
        emit HeirGuardianUpdated(2, old, newHeirGuardian);
    }

    function getHeirGuardian1() public view returns(address) {
        return heirGuardian1;
    }

    function getHeirGuardian2() public view returns(address) {
        return heirGuardian2;
    }

    /// @dev Verifica que ambos herederos esten configurados (no address(0))
    function _requireBothHeirsSet() internal view {
        if (heirGuardian1 == address(0) || heirGuardian2 == address(0)) {
            revert HeirsNotConfigured();
        }
    }

    /// @dev Valida que el heredero no sea address(0), no sea el owner, y no sea igual al otro
    function _validateHeir(address newHeir, address otherHeir) private view {
        if (newHeir == address(0)) {
            revert InvalidHeirAddress(newHeir);
        }
        if (newHeir == getOwner()) {
            revert HeirCannotBeOwner();
        }
        if (newHeir == otherHeir && otherHeir != address(0)) {
            revert HeirsMustBeDifferent();
        }
    }
}
