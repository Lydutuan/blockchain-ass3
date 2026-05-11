// Script to demonstrate access control setup for Medical Records contract
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
      console.log("\nUsage: npx hardhat run scripts/setup-roles.js <CONTRACT_ADDRESS>");
      process.exit(1);
    }
  }

  console.log("\n🔐 Medical Records Access Control Setup\n");
  console.log("Contract Address:", contractAddress);

  // Get contract factory and attach to deployed contract
  const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");
  const contract = MedicalRecords.attach(contractAddress);

  // Get signers
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  const doctor = signers[1] || deployer;
  const patient = signers[2] || deployer;
  
  console.log("\n👥 Available Accounts:");
  console.log("Deployer:", deployer.address);
  console.log("Doctor:   ", doctor.address);
  console.log("Patient:  ", patient.address);

  try {
    console.log("\n📋 Access Control Methods:");
    console.log("==========================");
    console.log("1. grantAccess(recordId, userAddress, expiryTime)");
    console.log("   - Grant access to a specific record");
    console.log("   - expiryTime: 0 for perpetual access, or Unix timestamp for expiry\n");
    
    console.log("2. revokeAccess(recordId, userAddress)");
    console.log("   - Revoke access to a specific record\n");
    
    console.log("3. checkAccess(recordId, userAddress)");
    console.log("   - Check if a user has valid access to a record\n");

    console.log("✅ Contract is ready for access control management!");
    console.log("\n💡 Example: Grant doctor access to patient's record");
    console.log("   const recordId = 1;");
    console.log("   const expiryTime = 0; // perpetual access");
    console.log(`   const tx = await contract.connect(patientSigner).grantAccess(recordId, "${doctor.address}", expiryTime);`);
    console.log("   await tx.wait();\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);
