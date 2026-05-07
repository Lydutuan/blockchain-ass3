# Blockchain Medical Records System - Smart Contracts

A decentralized medical records management system built on Solidity (Polygon/Ethereum). This system enables secure storage, access control, and verification of medical records using blockchain technology and IPFS.

## 📋 Features

### Core Features
- ✅ **Patient Record Management**: Create, update, and manage patient medical records
- ✅ **Access Control with Expiry**: Grant/revoke access to records with time-based expiry
- ✅ **Audit Logs**: Complete audit trail of all record access and modifications
- ✅ **IPFS Integration**: Store encrypted medical data on IPFS with CID references
- ✅ **Medicine Verification**: QR-based medicine authenticity verification with hash matching
- ✅ **Role-Based Access**: Doctor, Patient, and Admin roles
- ✅ **Reentrancy Protection**: Secure against reentrancy attacks
- ✅ **Pausable Contracts**: Emergency pause functionality for security
- ✅ **Input Validation**: Comprehensive validation for all inputs

## 🏗️ Architecture

### Smart Contracts

#### `MedicalRecords.sol`
Main contract that combines:
- **AuditLog**: Event and audit trail management
- **PatientRecord**: Structure for storing patient medical data
- **AccessGrant**: Access control with expiry timestamps
- **MedicineRecord**: Medicine verification and tracking

### Key Components

1. **Patient Record Mapping**
   ```solidity
   struct PatientRecord {
       uint256 recordId;
       address patient;
       string ipfsCid;        // Encrypted data on IPFS
       uint256 createdAt;
       uint256 updatedAt;
       bool isActive;
       uint256 version;       // Track record versions
   }
   ```

2. **Access Control**
   ```solidity
   struct AccessGrant {
       address user;
       uint256 grantedAt;
       uint256 expiryTime;    // Time-based expiry
       bool isRevoked;
       string accessLevel;    // "read", "read-write"
   }
   ```

3. **Medicine Verification**
   ```solidity
   struct MedicineRecord {
       uint256 medicineId;
       address doctor;
       uint256 recordId;
       string medicineName;
       string qrCode;         // QR code hash
       bytes32 medicineHash;  // Authenticity proof
       uint256 prescribedAt;
       bool isVerified;
   }
   ```

## 🔐 Security Features

### Reentrancy Protection
- All state-modifying functions use `nonReentrant` modifier from OpenZeppelin

### Access Control
- Role-based access with OpenZeppelin `AccessControl`
- Three roles: ADMIN, DOCTOR, PATIENT
- Granular permission checks on all functions

### Input Validation
- Address validation (no zero addresses)
- String length validation (non-empty CIDs, names, QR codes)
- Hash validation (non-zero hashes)
- Time validation (expiry times must be in future or zero)

### Emergency Functions
- Pausable contract for emergency situations
- Only admin can pause/unpause

### Medicine Authenticity
- QR code tracking
- Hash-based verification system
- Prevents counterfeit medicine detection

## 📦 Installation & Setup

### Prerequisites
- Node.js v16+ 
- npm or yarn
- Git

### Installation Steps

1. **Clone and Install**
```bash
cd blockchain-ass3
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Compile Contracts**
```bash
npm run compile
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npx hardhat test test/MedicalRecords.test.js
npx hardhat test test/MedicalRecords.security.test.js
```

### Test Coverage
```bash
npm run test:coverage
```

### Test Suites

**MedicalRecords.test.js** - Core functionality tests
- Record creation and management
- Access control with expiry
- Record access permissions
- Medicine verification
- Reentrancy protection
- Pausable functionality
- Role management
- Query functions
- Audit logs

**MedicalRecords.security.test.js** - Security & edge cases
- Input validation
- Access control security
- Expiry time security
- Record lifecycle
- Multiple medicines handling
- Concurrent operations
- Medicine hash verification
- Pause/resume operations

## 📝 Deployment

### Local Deployment (Hardhat Network)

```bash
# Start local node
npm run localnode

# In another terminal, deploy
npm run deploy:localhost
```

### Polygon Mumbai Testnet Deployment

1. **Setup Private Key**
```bash
# Get Mumbai testnet ETH from faucet: https://faucet.polygon.technology/
# Add private key to .env
```

2. **Deploy**
```bash
npm run deploy:polygon
```

3. **Verify on Block Explorer**
```bash
npx hardhat verify --network polygonMumbai <CONTRACT_ADDRESS>
```

## 🎯 API Functions

### Record Management

#### `addRecord(address _patient, string memory _ipfsCid) → uint256`
Create a new patient medical record
- ✅ Only ADMIN
- Returns: recordId

#### `getRecord(uint256 _recordId) → PatientRecord`
Retrieve a patient record (with permission check)
- ✅ Requires valid access

#### `updateRecord(uint256 _recordId, string memory _newIpfsCid)`
Update patient record IPFS CID
- ✅ Only ADMIN  
- Increments version

### Access Control

#### `grantAccess(uint256 _recordId, address _user, uint256 _expiryTime, string memory _accessLevel)`
Grant access to a record with optional expiry
- ✅ Only ADMIN
- `_expiryTime = 0` for perpetual access
- `_accessLevel`: "read" or "read-write"

#### `revokeAccess(uint256 _recordId, address _user)`
Revoke access to a record
- ✅ Only ADMIN

#### `hasValidAccess(uint256 _recordId, address _user) → bool`
Check if user has valid access to record
- ✅ Public view function

### Medicine Verification

#### `verifyMedicine(uint256 _recordId, string memory _medicineName, string memory _qrCode, bytes32 _medicineHash) → uint256`
Register and verify medicine for a record
- ✅ Only DOCTOR with record access
- Returns: medicineId

#### `verifyMedicineHash(uint256 _medicineId, bytes32 _providedHash) → bool`
Verify medicine authenticity using hash
- ✅ Public view function

#### `getMedicinesForRecord(uint256 _recordId) → uint256[]`
Get all medicine IDs for a record

### Audit Functions

#### `getAuditTrail(uint256 _recordId) → AuditEntry[]`
Retrieve complete audit trail for a record

#### `getAuditTrailLength() → uint256`
Get total number of audit entries

## 📊 Contract ABI

Extract ABI for frontend integration:

```bash
node scripts/extract-abi.js
```

This generates:
- `frontend/MedicalRecords.abi.json` - JSON format
- `frontend/MedicalRecords.abi.ts` - TypeScript export
- `frontend/MedicalRecords.abi.js` - JavaScript export
- `frontend/INTEGRATION_GUIDE.md` - Frontend integration guide

### Frontend Integration Example

```javascript
import { ethers } from 'ethers';
import { MEDICAL_RECORDS_ABI } from './MedicalRecords.abi.js';

const contract = new ethers.Contract(
  contractAddress,
  MEDICAL_RECORDS_ABI,
  signer
);

// Create record
const tx = await contract.addRecord(patientAddress, ipfsCid);
await tx.wait();

// Listen to events
contract.on('RecordCreated', (recordId, patient, ipfsCid) => {
  console.log('Record created:', recordId);
});
```

## 📋 Events

All events are logged to the audit trail:

- **RecordCreated**: New record created
- **RecordUpdated**: Record IPFS CID updated
- **AccessGranted**: Access granted to user
- **AccessRevoked**: Access revoked from user
- **MedicineVerified**: Medicine verified for record
- **AuditLogged**: Audit trail entry created

## 🚀 Best Practices

### For Administrators
1. ✅ Grant access with reasonable expiry times
2. ✅ Regularly review audit logs for suspicious activity
3. ✅ Use pause function only in emergencies
4. ✅ Grant roles judiciously

### For Doctors
1. ✅ Always verify patient consent before accessing records
2. ✅ Use proper medicine verification procedures
3. ✅ Document all access in audit logs
4. ✅ Report suspicious activity

### For Patients
1. ✅ Review who has access to your records
2. ✅ Request revocation if access is no longer needed
3. ✅ Monitor audit logs regularly
4. ✅ Provide CIDs for encrypted data only

## ⚙️ Configuration

### Network Configuration (hardhat.config.js)

```javascript
networks: {
  localhost: {
    url: "http://127.0.0.1:8545"
  },
  polygonMumbai: {
    url: process.env.POLYGON_MUMBAI_RPC,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

### Solidity Version
- **Version**: 0.8.20
- **Optimizer**: Enabled with 200 runs

## 📚 Dependencies

### Production
- `@openzeppelin/contracts`: ^5.0.0 - Security libraries

### Development
- `hardhat`: ^2.17.0 - Development environment
- `@nomicfoundation/hardhat-toolbox`: ^4.0.0 - Testing & compilation
- `ethers`: ^6.7.0 - Ethereum library
- `chai`: ^4.3.7 - Testing framework

## 🔍 Verification

### Contract Verification Steps

1. **Flatten contract** (if needed):
```bash
npx hardhat flatten contracts/MedicalRecords.sol > Flattened.sol
```

2. **Verify on Polygonscan**:
```bash
npx hardhat verify --network polygonMumbai <ADDRESS> --constructor-args args.js
```

## 📖 File Structure

```
blockchain-ass3/
├── contracts/
│   └── MedicalRecords.sol       # Main smart contract
├── scripts/
│   ├── deploy.js                # Deployment script
│   └── extract-abi.js           # ABI extraction
├── test/
│   ├── MedicalRecords.test.js           # Core tests
│   └── MedicalRecords.security.test.js  # Security tests
├── frontend/                    # Generated frontend files
│   ├── MedicalRecords.abi.json
│   ├── MedicalRecords.abi.ts
│   ├── MedicalRecords.abi.js
│   └── INTEGRATION_GUIDE.md
├── artifacts/                   # Compiled contracts (generated)
├── cache/                       # Hardhat cache (generated)
├── hardhat.config.js            # Hardhat configuration
├── package.json                 # Dependencies
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

## 🤝 Contributing

1. Create a feature branch
2. Write tests for new functionality
3. Ensure all tests pass: `npm test`
4. Follow code style conventions
5. Submit pull request

## ⚠️ Security Audit Checklist

- [x] Reentrancy protection (nonReentrant)
- [x] Access control (roles & permissions)
- [x] Input validation
- [x] Safe math (Solidity ^0.8.0)
- [x] Pausable for emergencies
- [x] Expiry-based access control
- [x] Event logging for audit trail
- [x] No exposed private keys in code

## 📜 License

MIT License - See LICENSE file for details

## 🆘 Troubleshooting

### Compilation Errors
```bash
npm run compile
```

### Network Connection Issues
- Verify RPC endpoint in .env
- Check network status
- Ensure sufficient gas

### Test Failures
- Clear cache: `npm run clean`
- Reinstall: `rm -rf node_modules && npm install`
- Recompile: `npm run compile && npm test`

## 📞 Support

For issues or questions:
1. Check test files for usage examples
2. Review INTEGRATION_GUIDE.md for frontend integration
3. Check Solidity documentation
4. Review OpenZeppelin docs for used libraries

---

**Last Updated**: May 2026
**Solidity Version**: ^0.8.20
**Network Support**: Ethereum, Polygon (Mumbai Testnet)
