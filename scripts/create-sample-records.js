// Script to create sample medical records for testing
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
    } catch (error) {
      console.error(
        "❌ Error: No contract address provided and deployment-info.json not found"
      );
      console.log(
        "\nUsage: npx hardhat run scripts/create-sample-records.js <CONTRACT_ADDRESS>"
      );
      process.exit(1);
    }
  }

  console.log("📝 Creating sample medical records\n");
  console.log("Contract Address:", contractAddress);

  // Get contract factory and attach to deployed contract
  const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");
  const contract = MedicalRecords.attach(contractAddress);

  // Get signers
  const [deployer, doctor, patient1, patient2] =
    await hre.ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log("Doctor:", doctor.address);
  console.log("Patient 1:", patient1.address);
  console.log("Patient 2:", patient2.address);

  try {
    // Sample IPFS CIDs (mock data)
    const sampleRecords = [
      {
        owner: deployer,
        ipfsCid: "QmExample1111111111111111111111111111111111",
        description: "Deployer's Health Checkup",
      },
      {
        owner: deployer,
        ipfsCid: "QmExample2222222222222222222222222222222222",
        description: "Deployer's Blood Test Results",
      },
      {
        owner: patient1,
        ipfsCid: "QmExample3333333333333333333333333333333333",
        description: "Patient 1 - COVID-19 Vaccination Certificate",
      },
      {
        owner: patient2,
        ipfsCid: "QmExample4444444444444444444444444444444444",
        description: "Patient 2 - X-Ray Report",
      },
    ];

    console.log("\n📋 Sample Records to Create:");
    console.log("=======================");
    sampleRecords.forEach((record, index) => {
      console.log(`${index + 1}. Owner: ${record.owner.address.slice(0, 10)}...`);
      console.log(`   IPFS CID: ${record.ipfsCid}`);
      console.log(`   Description: ${record.description}\n`);
    });

    console.log("🔄 Creating records...\n");

    let successCount = 0;
    for (let i = 0; i < sampleRecords.length; i++) {
      const record = sampleRecords[i];
      try {
        console.log(`⏳ Creating record ${i + 1}/${sampleRecords.length}...`);

        const tx = await contract
          .connect(record.owner)
          .addRecord(record.ipfsCid);
        const receipt = await tx.wait();

        console.log(`✅ Record ${i + 1} created!`);
        console.log(`   Transaction Hash: ${receipt.hash}`);
        console.log(`   Block: ${receipt.blockNumber}\n`);

        successCount++;
      } catch (error) {
        console.error(`❌ Error creating record ${i + 1}:`, error.message);
      }
    }

    console.log("\n📊 Summary:");
    console.log("=======================");
    console.log(`Successfully created: ${successCount}/${sampleRecords.length}`);
    console.log("=======================\n");
    console.log("✅ Sample records created successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);
