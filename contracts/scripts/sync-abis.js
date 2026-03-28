/**
 * Script to sync ABI artifacts from contracts/ to frontend/
 * Run after: cd contracts && npx hardhat compile
 * Usage: node contracts/scripts/sync-abis.js
 */
const fs = require("fs");
const path = require("path");

const ARTIFACTS_DIR = path.join(__dirname, "..", "artifacts", "src");
const OUTPUT_FILE = path.join(__dirname, "..", "..", "frontend", "lib", "contracts", "abis.ts");

const contracts = [
  { name: "SmartWalletFactory", path: "Factory.sol/SmartWalletFactory.json", exportName: "FACTORY_ABI" },
  { name: "Wallet", path: "Wallet.sol/Wallet.json", exportName: "WALLET_ABI" },
  { name: "CajaFuerte", path: "CajaFuerte.sol/CajaFuerte.json", exportName: "CAJA_FUERTE_ABI" },
];

let output = `// Auto-generated from hardhat compile — do not edit manually\n// Run: node contracts/scripts/sync-abis.js\n\n`;

for (const c of contracts) {
  const artifact = JSON.parse(fs.readFileSync(path.join(ARTIFACTS_DIR, c.path), "utf8"));
  output += `export const ${c.exportName} = ${JSON.stringify(artifact.abi, null, 2)} as const;\n\n`;
}

output += `// Contract addresses — update after deploy to BSC Testnet
export const CONTRACTS = {
  factory: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000") as \`0x\${string}\`,
} as const;\n`;

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, output);
console.log(`Synced ${contracts.length} ABIs to ${OUTPUT_FILE} (${output.length} bytes)`);
