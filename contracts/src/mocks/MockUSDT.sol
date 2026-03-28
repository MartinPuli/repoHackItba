// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDT — Stablecoin de prueba para demo hackathon
/// @notice Cualquiera puede mintear. Solo para testnet.
contract MockUSDT is ERC20 {
    constructor() ERC20("Mock USDT", "mUSDT") {}

    /// @notice Mint libre para testing — cualquier address puede mintear
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @notice USDT usa 6 decimales en produccion
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
