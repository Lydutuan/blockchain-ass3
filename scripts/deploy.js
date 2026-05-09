// Deployment script for Medical Records Smart Contract
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Medical Records Smart Contract...\n");

  // Get the contract factory
  const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");

  // Deploy the contract
  console.log("📝 Deploying MedicalRecords contract...");
  const medicalRecords = await MedicalRecords.deploy();
  await medicalRecords.waitForDeployment();

  const contractAddress = await medicalRecords.getAddress();
  console.log("✅ MedicalRecords deployed to:", contractAddress);

  // Get deployment info
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n📋 Deployment Summary:");
  console.log("=======================");
  console.log("Network:", (await hre.ethers.provider.getNetwork()).name);
  console.log("Contract Address:", contractAddress);
  console.log("Deployer Address:", deployer.address);
  console.log("=======================\n");

  // Verify on block explorer (if on testnet)
  const network = await hre.ethers.provider.getNetwork();
  if (network.name !== "localhost" && network.name !== "hardhat") {
    console.log("\n📡 Verify on block explorer:");
    console.log(
      `npx hardhat verify --network ${network.name} ${contractAddress}`
    );
  }

  // Save deployment info to file
  const fs = require("fs");
  const deploymentInfo = {
    network: (await hre.ethers.provider.getNetwork()).name,
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    deploymentBlock: (await hre.ethers.provider.getBlockNumber()),
    deploymentDate: new Date().toISOString(),
  };

  fs.writeFileSync(
    "./deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n✅ Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
