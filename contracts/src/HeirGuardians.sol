// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.10;

import {Owner} from "HackITBA2026/Owner.sol";

abstract contract HeirGuardians is Owner {
    
    address private heirGuardian1;
    address private heirGuardian2;

    error InvalidAddress(address heirGuardian);

    constructor() {
        heirGuardian1 = address(0);
        heirGuardian2 = address(0);
    }

    modifier OnlyHeirGuardians() {
        require(msg.sender == heirGuardian1 || msg.sender == heirGuardian2, "You are not an heir guardian");
        _;
    }

    function setHeirGuardian1(address newHeirGuardian) public OnlyOwner {
        if (newHeirGuardian == address(0)) {
            revert InvalidAddress(newHeirGuardian);
        }
        heirGuardian1 = newHeirGuardian;
    }

    function setHeirGuardian2(address newHeirGuardian) public OnlyOwner {
        if (newHeirGuardian == address(0)) {
            revert InvalidAddress(newHeirGuardian);
        }
        heirGuardian2 = newHeirGuardian;
    }

    function getHeirGuardian1() public view returns(address) {
        return heirGuardian1;
    }

    function getHeirGuardian2() public view returns(address) {
        return heirGuardian2;
    }
}