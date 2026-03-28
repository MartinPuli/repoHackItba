// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.10;

abstract contract Owner {

    address private owner;

    error InvalidOwner(address owner);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert InvalidOwner(address(0));
        }
        owner = initialOwner;
    }

    modifier OnlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    function getOwner() public view returns(address) {
        return owner;
    }
}