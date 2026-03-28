// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Owner -- Control de acceso basico con owner unico
/// @notice Contrato abstracto que provee modifier OnlyOwner y getter.
abstract contract Owner {

    address private owner;

    error InvalidOwner(address owner);
    error NotOwner();

    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert InvalidOwner(address(0));
        }
        owner = initialOwner;
    }

    modifier OnlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function getOwner() public view returns(address) {
        return owner;
    }
}
