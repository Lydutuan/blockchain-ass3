# Smart Contract Deployment & Verification Guide

## Pre-Deployment Checklist

- [ ] Environment variables configured (`.env` file)
- [ ] Dependencies installed: `npm install`
- [ ] Contracts compiled successfully: `npm run compile`
- [ ] All tests passing: `npm test`
- [ ] Private key is for testnet account only
- [ ] Account has sufficient ETH for gas fees
- [ ] Network RPC endpoint is working

## Local Deployment (Hardhat Network)

### Step 1: Start Local Node
```bash
npm run localnode
```
This starts a local Ethereum network at `http://localhost:8545`

### Step 2: Deploy (in another terminal)
```bash
npm run deploy:localhost
```

**Output:**
```
🚀 Deploying Medical Records Smart Contract...

📝 Deploying MedicalRecords contract...
✅ MedicalRecords deployed to: 0x5FbDB2315678afccb333f8a9c4662ce232609e0a

🔧 Initializing contract...
✅ Contract initialized

📋 Deployment Summary:
=======================
Network: hardhat
Contract Address: 0x5FbDB2315678afccb333f8a9c4662ce232609e0a
Deployer Address: 0xf39Fd6e51aad88F6F4ce6ab8827279cffFb92266
=======================

✅ Deployment info saved to deployment-info.json
```

### Step 3: Interact with Contract

Create a test script `interact.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");
  const contract = MedicalRecords.attach("0x5FbDB2315678afccb333f8a9c4662ce232609e0a");
  
  // Get record count
  const count = await contract.getRecordCount();
  console.log("Total records:", count);
}

main().catch(console.error);
```

Run with:
```bash
npx hardhat run interact.js --network localhost
```

## Polygon Mumbai Testnet Deployment

### Step 1: Setup Accounts

1. **Create a new account** for testing (DO NOT USE MAINNET KEYS)
   ```bash
   npx hardhat run scripts/create-account.js
   ```
   Or use an existing testnet account.

2. **Get Mumbai Faucet ETH**
   - Visit: https://faucet.polygon.technology/
   - Select "Mumbai"
   - Enter your wallet address
   - Wait for ETH to arrive

3. **Configure .env**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```
   POLYGON_MUMBAI_RPC=https://rpc-mumbai.maticvigil.com
   PRIVATE_KEY=0x... (your testnet private key)
   ```

### Step 2: Deploy to Mumbai

```bash
npm run deploy:polygon
```

**Output Example:**
```
🚀 Deploying Medical Records Smart Contract...

📝 Deploying MedicalRecords contract...
✅ MedicalRecords deployed to: 0xAbCd123EF456...

🔧 Initializing contract...
✅ Contract initialized

📋 Deployment Summary:
=======================
Network: polygonMumbai
Contract Address: 0xAbCd123EF456...
Deployer Address: 0x1234...
=======================

📡 Verify on block explorer:
npx hardhat verify --network polygonMumbai 0xAbCd123EF456...
```

### Step 3: Verify Contract

#### Automatic Verification (if API key configured)

```bash
# Install hardhat-verify
npm install --save-dev @nomiclabs/hardhat-etherscan

# Add to hardhat.config.js
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

module.exports = {
  // ... other config
  etherscan: {
    apiKey: {
      polygonMumbai: ETHERSCAN_API_KEY
    }
  }
};

# Verify
npx hardhat verify --network polygonMumbai <CONTRACT_ADDRESS>
```

#### Manual Verification

1. Go to: https://mumbai.polygonscan.com/
2. Search for contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Select:
   - Compiler Type: Single File
   - Compiler Version: v0.8.20
   - License: MIT
6. Paste full contract code
7. Submit

### Step 4: View on Block Explorer

After deployment/verification:
```
https://mumbai.polygonscan.com/address/0x<YOUR_CONTRACT_ADDRESS>
```

## Contract Initialization After Deployment

After deployment, the contract is automatically initialized. To manually initialize:

```javascript
const hre = require("hardhat");

async function main() {
  const contractAddress = "0x..."; // Your deployed address
  const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");
  const contract = MedicalRecords.attach(contractAddress);
  
  // Initialize
  const tx = await contract.initialize();
  await tx.wait();
  
  console.log("Contract initialized");
}

main();
```

## Setup Roles

After deployment, grant roles to doctors and admins:

```javascript
const hre = require("hardhat");

async function main() {
  const contractAddress = "0x...";
  const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");
  const contract = MedicalRecords.attach(contractAddress);
  
  const DOCTOR_ROLE = await contract.DOCTOR_ROLE();
  const doctorAddress = "0x..."; // Doctor's address
  
  // Grant doctor role
  const tx = await contract.grantRole(DOCTOR_ROLE, doctorAddress);
  await tx.wait();
  
  console.log("Doctor role granted to:", doctorAddress);
}

main();
```

## Create Sample Records

Once deployed, test with sample data:

```javascript
const hre = require("hardhat");

async function main() {
  const contractAddress = "0x...";
  const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");
  const contract = MedicalRecords.attach(contractAddress);
  
  const patientAddress = "0x...";
  const ipfsCid = "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  
  // Create record
  const tx = await contract.addRecord(patientAddress, ipfsCid);
  const receipt = await tx.wait();
  
  console.log("Record created, tx:", receipt.hash);
  console.log("Record ID: 1");
}

main();
```

## Upgrade Contracts (if using Proxy Pattern)

If implementing upgradeable contracts:

```javascript
const { upgrades } = require("hardhat");

async function main() {
  const MedicalRecords = await ethers.getContractFactory("MedicalRecords");
  const contract = await upgrades.deployProxy(MedicalRecords);
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("Proxy deployed to:", address);
}

main();
```

To upgrade:

```javascript
async function main() {
  const proxyAddress = "0x...";
  const MedicalRecordsV2 = await ethers.getContractFactory("MedicalRecordsV2");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, MedicalRecordsV2);
  
  console.log("Upgraded to:", upgraded.address);
}

main();
```

## Testing Before Mainnet Deployment

### Run Complete Test Suite
```bash
npm test
```

### Test Specific Functions
```bash
npx hardhat test --grep "grantAccess"
```

### Monitor Gas Usage
```bash
REPORT_GAS=true npx hardhat test
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Security Verification Checklist

Before real-world deployment:

- [ ] All tests passing
- [ ] No hardcoded addresses
- [ ] No exposed private keys
- [ ] Input validation on all functions
- [ ] Access control properly enforced
- [ ] Reentrancy protection in place
- [ ] Event logging implemented
- [ ] Contract verified on block explorer
- [ ] Contract paused feature tested
- [ ] Role management tested

## Mainnet Deployment (Production)

Only after thorough testing on testnet:

```bash
# Edit .env for mainnet
POLYGON_RPC=https://polygon-rpc.com
PRIVATE_KEY=0x... # Production key (extremely secure)

# Deploy
npx hardhat run scripts/deploy.js --network polygon
```

**⚠️ CRITICAL PRODUCTION CHECKLIST:**
- [ ] Use hardware wallet for mainnet deployment
- [ ] Never commit mainnet private keys to git
- [ ] Have contract security audit
- [ ] Use multisig wallet for admin functions
- [ ] Implement rate limiting
- [ ] Setup monitoring and alerts
- [ ] Have incident response plan
- [ ] Test failure scenarios

## Monitor Contract After Deployment

### Check Transaction Status
```bash
# On Polygonscan
https://mumbai.polygonscan.com/tx/0x<TXHASH>
```

### Monitor Events
```javascript
const contract = new ethers.Contract(
  ADDRESS,
  ABI,
  provider
);

contract.on('RecordCreated', (recordId, patient, ipfsCid) => {
  console.log('Record created:', recordId);
});
```

### Track Gas Usage
```bash
# In hardhat.config.js
gasReporter: {
  enabled: true,
  currency: 'USD',
  coinmarketcap: process.env.COINMARKETCAP_API_KEY
}
```

## Troubleshooting Deployment Issues

### Compilation Errors
```bash
npm run clean
npm run compile
```

### RPC Connection Issues
- Check network status
- Verify RPC endpoint is active
- Try alternative RPC endpoints

### Gas Estimation Errors
- Increase gas limit in hardhat.config.js
- Ensure account has sufficient balance

### Account Balance Too Low
- Get more testnet ETH from faucet
- Reduce gas price (experimental)

## Extract and Distribute ABI

After successful deployment:

```bash
node scripts/extract-abi.js
```

This generates:
- `frontend/MedicalRecords.abi.json`
- `frontend/MedicalRecords.abi.ts`
- `frontend/INTEGRATION_GUIDE.md`

Share these files with frontend team.

## Backup and Documentation

Save important information:

1. **Deployment Info**
   ```json
   {
     "network": "polygonMumbai",
     "contractAddress": "0x...",
     "deploymentDate": "2026-05-06",
     "deployer": "0x...",
     "txHash": "0x..."
   }
   ```

2. **Network Configuration**
   - RPC endpoints used
   - Account addresses with roles
   - Gas settings

3. **Contract ABI**
   - Store in version control
   - Share with frontend team

---

**For Questions**: See README.md and INTEGRATION_GUIDE.md
