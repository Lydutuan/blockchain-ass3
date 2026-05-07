// Extract contract ABI and save for frontend integration
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("📋 Extracting Contract ABI...\n");

  // Compile the contract first
  const { execSync } = require("child_process");
  try {
    console.log("🔨 Compiling contracts...");
    execSync("npx hardhat compile", { stdio: "inherit" });
    console.log("✅ Compilation successful\n");
  } catch (error) {
    console.error("❌ Compilation failed");
    process.exit(1);
  }

  // Read the artifact
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/MedicalRecords.sol/MedicalRecords.json"
  );

  if (!fs.existsSync(artifactPath)) {
    console.error("❌ Contract artifact not found at:", artifactPath);
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;

  // Create frontend directory if it doesn't exist
  const frontendDir = path.join(__dirname, "../frontend");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  // Save ABI as JSON
  const abiPath = path.join(frontendDir, "MedicalRecords.abi.json");
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
  console.log("✅ ABI saved to:", abiPath);

  // Save ABI as TypeScript export
  const tsPath = path.join(frontendDir, "MedicalRecords.abi.ts");
  const tsContent = `export const MEDICAL_RECORDS_ABI = ${JSON.stringify(
    abi,
    null,
    2
  )} as const;\n`;
  fs.writeFileSync(tsPath, tsContent);
  console.log("✅ TypeScript ABI saved to:", tsPath);

  // Save ABI as JavaScript export
  const jsPath = path.join(frontendDir, "MedicalRecords.abi.js");
  const jsContent = `module.exports = ${JSON.stringify(abi, null, 2)};\n`;
  fs.writeFileSync(jsPath, jsContent);
  console.log("✅ JavaScript ABI saved to:", jsPath);

  // Print summary
  console.log("\n📊 ABI Summary:");
  console.log("=======================");

  // Count functions
  const functions = abi.filter(
    (item) => item.type === "function" && item.stateMutability !== "view"
  );
  const views = abi.filter(
    (item) => item.type === "function" && item.stateMutability === "view"
  );
  const events = abi.filter((item) => item.type === "event");

  console.log(`Functions (write/execute): ${functions.length}`);
  functions.forEach((func) => {
    console.log(`  - ${func.name}`);
  });

  console.log(`\nView Functions (read-only): ${views.length}`);
  views.forEach((func) => {
    console.log(`  - ${func.name}`);
  });

  console.log(`\nEvents: ${events.length}`);
  events.forEach((event) => {
    console.log(`  - ${event.name}`);
  });

  console.log("=======================\n");

  // Generate integration guide
  const integrationGuide = `# Medical Records Contract - Frontend Integration Guide

## Contract ABI

The contract ABI is available in multiple formats:
- \`MedicalRecords.abi.json\` - JSON format
- \`MedicalRecords.abi.ts\` - TypeScript export
- \`MedicalRecords.abi.js\` - JavaScript export

## Key Functions

### Write Functions (require transactions)
${functions.map((func) => `- \`${func.name}()\``).join("\n")}

### View Functions (read-only, no gas cost)
${views.map((func) => `- \`${func.name}()\``).join("\n")}

### Events
${events.map((event) => `- \`${event.name}\``).join("\n")}

## Usage Example (Web3.js)

\`\`\`javascript
import { MEDICAL_RECORDS_ABI } from './MedicalRecords.abi.js';

const contract = new web3.eth.Contract(
  MEDICAL_RECORDS_ABI,
  '0x...' // Contract address
);

// Read patient record
const record = await contract.methods.getRecord(1).call();

// Grant access
await contract.methods
  .grantAccess(
    1,                    // recordId
    '0x...',              // userAddress
    Math.floor(Date.now()/1000) + 86400, // expiryTime
    'read'                // accessLevel
  )
  .send({ from: account });
\`\`\`

## Usage Example (Ethers.js v6)

\`\`\`javascript
import { MEDICAL_RECORDS_ABI } from './MedicalRecords.abi.js';

const contract = new ethers.Contract(
  contractAddress,
  MEDICAL_RECORDS_ABI,
  signer
);

// Create a new record
const tx = await contract.addRecord(
  patientAddress,
  'QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
);
await tx.wait();

// Listen to events
contract.on('RecordCreated', (recordId, patient, ipfsCid, timestamp) => {
  console.log('Record created:', recordId);
});
\`\`\`

## Contract Events to Monitor

- \`RecordCreated\`: Fired when a new medical record is created
- \`RecordUpdated\`: Fired when a record's IPFS CID is updated
- \`AccessGranted\`: Fired when access is granted to a user
- \`AccessRevoked\`: Fired when access is revoked from a user
- \`MedicineVerified\`: Fired when medicine verification is completed
- \`AuditLogged\`: Fired for all audit trail entries

## Security Considerations

1. **Always verify on-chain access** before displaying patient data
2. **Use expiry times** for temporary access grants
3. **Monitor audit logs** for suspicious access patterns
4. **Validate IPFS CIDs** before accepting them
5. **Use HTTPS** for all API calls
6. **Store private keys securely** - never expose in frontend code
`;

  const guidePath = path.join(frontendDir, "INTEGRATION_GUIDE.md");
  fs.writeFileSync(guidePath, integrationGuide);
  console.log("📖 Integration guide saved to:", guidePath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
