import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB");

  // Deploy Factory
  console.log("\n--- Deploying SmartWalletFactory ---");
  const Factory = await ethers.getContractFactory("SmartWalletFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log("Factory deployed at:", factoryAddr);

  // Log addresses for frontend config
  console.log("\n=== ADDRESSES FOR FRONTEND ===");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddr}`);
  console.log("==============================\n");

  // Verify instructions
  console.log("To verify on BSCScan:");
  console.log(`npx hardhat verify --network bscTestnet ${factoryAddr}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
