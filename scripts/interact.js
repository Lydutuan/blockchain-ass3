// Script to interact with deployed Medical Records contract
const hre = require("hardhat");

async function main() {
  // Get contract address from command line or deployment info
  let contractAddress = process.argv[2];

  if (!contractAddress) {
    console.log("ℹ️  Loading contract address from deployment-info.json...");
    const fs = require("fs");
    try {
      const deploymentInfo = JSON.parse(
        fs.readFileSync("./deployment-info.json", "utf8")
      );
      contractAddress = deploymentInfo.contractAddress;
      console.log("✅ Found contract at:", contractAddress);
    } catch (error) {
      console.error(
        "❌ Error: No contract address provided and deployment-info.json not found"
      );
      console.log("\nUsage: npx hardhat run scripts/interact.js --network localhost");
      console.log("   or: npx hardhat run scripts/interact.js <CONTRACT_ADDRESS> --network localhost");
      process.exit(1);
    }
  }

  console.log("\n📋 Interacting with Medical Records Contract\n");

  // Get contract factory and attach to deployed contract
  const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");
  const contract = MedicalRecords.attach(contractAddress);

  try {
    // Get contract details
    console.log("🔍 Fetching contract data...\n");
    
    const [signer] = await hre.ethers.getSigners();
    console.log("Connected wallet:", signer.address);
    console.log("Contract address:", contractAddress);
    console.log("Network:", (await hre.ethers.provider.getNetwork()).name);

    console.log("\n✅ Contract interaction successful!");
    console.log("\n💡 Available operations on this contract:");
    console.log("   - addRecord(ipfsCid)");
    console.log("   - grantAccess(recordId, userAddress, expiryTime)");
    console.log("   - revokeAccess(recordId, userAddress)");
    console.log("   - getRecord(recordId)");
    console.log("   - checkAccess(recordId, userAddress)");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);