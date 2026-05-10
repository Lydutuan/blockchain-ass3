// Script to create a new Ethereum account for testing
const ethers = require("ethers");

async function main() {
  console.log("🔑 Creating a new Ethereum account...\n");

  // Generate a new random wallet
  const wallet = ethers.Wallet.createRandom();

  console.log("✅ New Account Created!\n");
  console.log("📋 Account Details:");
  console.log("=======================");
  console.log("Address:   ", wallet.address);
  console.log("Private Key:", wallet.privateKey);
  console.log("=======================\n");

  console.log("⚠️  IMPORTANT SECURITY NOTES:");
  console.log("1. Save the private key in a SECURE location");
  console.log("2. NEVER share or commit the private key to git");
  console.log("3. Use this account ONLY for testnet (Amoy, Mumbai, etc.)");
  console.log("4. Add to .env file: PRIVATE_KEY=" + wallet.privateKey);
  console.log("\n📌 Next Steps:");
  console.log(
    "1. Update your .env file with the private key"
  );
  console.log("2. Get testnet ETH from faucet: https://faucet.polygon.technology/");
  console.log("3. Select 'Amoy' network and enter your address:", wallet.address);
  console.log("4. Run deployment: npm run deploy:polygon\n");
}

main().catch(console.error);
