# Quick Start Guide

Get up and running with the Medical Records blockchain system in 5 minutes.

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
cd blockchain-ass3
npm install
```

### 2. Compile Contracts
```bash
npm run compile
```

### 3. Run Tests
```bash
npm test
```

Expected output:
```
MedicalRecords Contract - Core Functionality
  ✓ Should create a new patient record
  ✓ Should reject record creation with zero address
  ✓ Should grant access to a user
  ✓ Should revoke access to a user
  ... (50+ tests)

✓ All tests passing
```

---

## 🚀 Local Development

### Start Local Blockchain
```bash
npm run localnode
```

In another terminal:
```bash
npm run deploy:localhost
```

Gets you:
```
MedicalRecords deployed to: 0x5FbDB2315678afccb333f8a9c4662ce232609e0a
```

---

## 📋 Core Operations

### Create Patient Record
```javascript
const ipfsCid = "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const tx = await contract.addRecord(patientAddress, ipfsCid);
const receipt = await tx.wait();
```

### Grant Access to Doctor
```javascript
const expiryTime = Math.floor(Date.now() / 1000) + 86400; // 1 day
await contract.grantAccess(recordId, doctorAddress, expiryTime, "read");
```

### Verify Medicine
```javascript
const medicineHash = ethers.id("authentic-medicine-001");
await contract.verifyMedicine(
  recordId,
  "Aspirin 500mg",
  "QR-CODE-DATA",
  medicineHash
);
```

### Check Access
```javascript
const hasAccess = await contract.hasValidAccess(recordId, userAddress);
console.log(hasAccess); // true or false
```

### Get Audit Trail
```javascript
const auditTrail = await contract.getAuditTrail(recordId);
auditTrail.forEach(entry => {
  console.log(entry.eventType, entry.user, entry.timestamp);
});
```

---

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test
```bash
npx hardhat test --grep "grantAccess"
```

### Test Coverage
```bash
npm run test:coverage
```

---

## 📦 Deployment to Testnet

### 1. Setup Environment
```bash
cp .env.example .env
# Edit .env with your Mumbai RPC and private key
```

### 2. Get Mumbai ETH
- Visit: https://faucet.polygon.technology/
- Select Mumbai
- Paste your address

### 3. Deploy
```bash
npm run deploy:polygon
```

### 4. Verify Contract
```bash
npx hardhat verify --network polygonMumbai <CONTRACT_ADDRESS>
```

View on: https://mumbai.polygonscan.com/address/<CONTRACT_ADDRESS>

---

## 🎯 Extract ABI for Frontend

```bash
node scripts/extract-abi.js
```

Generated files in `frontend/`:
- `MedicalRecords.abi.json`
- `MedicalRecords.abi.ts`
- `INTEGRATION_GUIDE.md`

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | Full project documentation |
| `DEPLOYMENT_GUIDE.md` | Detailed deployment steps |
| `API_REFERENCE.md` | Complete API documentation |
| `frontend/INTEGRATION_GUIDE.md` | Frontend integration instructions |

---

## 🔑 Key Roles

```javascript
// Get role IDs
const ADMIN_ROLE = await contract.ADMIN_ROLE();
const DOCTOR_ROLE = await contract.DOCTOR_ROLE();
const PATIENT_ROLE = await contract.PATIENT_ROLE();

// Grant doctor role
await contract.grantRole(DOCTOR_ROLE, doctorAddress);
```

**ADMIN**: Create/update records, manage access, manage roles
**DOCTOR**: Access records, verify medicines
**PATIENT**: Access own records (automatic)

---

## 🛡️ Security Features

✅ **Reentrancy Protection**: All state-modifying functions protected
✅ **Access Control**: Role-based permissions
✅ **Input Validation**: Comprehensive validation
✅ **Time-based Expiry**: Access grants can expire
✅ **Audit Logs**: Complete event tracking
✅ **Pausable**: Emergency pause functionality

---

## 📞 Common Tasks

### Grant Perpetual Access (Never Expires)
```javascript
await contract.grantAccess(recordId, doctor, 0, "read");
```

### Check If User Has Access
```javascript
const access = await contract.hasValidAccess(recordId, user);
```

### View All Medicines for Record
```javascript
const medicineIds = await contract.getMedicinesForRecord(recordId);
```

### Verify Medicine Authenticity
```javascript
const isAuthentic = await contract.verifyMedicineHash(medicineId, hash);
```

### Get Record Count
```javascript
const count = await contract.getRecordCount();
```

### Emergency Pause
```javascript
await contract.pause(); // Only admin
await contract.unpause();
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Compilation fails | `npm run clean && npm run compile` |
| Tests fail | Clear cache, reinstall: `rm -rf node_modules && npm install` |
| Can't connect to Mumbai | Check RPC URL in .env |
| Low balance error | Get ETH from Mumbai faucet |
| Permission denied | Check you have correct role |

---

## 📊 Contract Stats

- **Lines of Code**: ~700 (Solidity)
- **Functions**: 20+
- **Events**: 6
- **Tests**: 50+
- **Test Coverage**: Core functionality + security

---

## 🎓 Example: Complete Flow

```javascript
// 1. Create record
const recordTx = await contract.addRecord(
  patientAddress,
  "QmXxxxx...xxx"
);

// 2. Grant access to doctor
await contract.grantAccess(
  1,
  doctorAddress,
  Math.floor(Date.now()/1000) + 86400,
  "read"
);

// 3. Doctor verifies medicine
await contract.grantRole(DOCTOR_ROLE, doctorAddress);
const medicineHash = ethers.id("batch-001");
await contract.verifyMedicine(
  1,
  "Aspirin",
  "QR-DATA",
  medicineHash
);

// 4. Verify authenticity
const isValid = await contract.verifyMedicineHash(1, medicineHash);

// 5. Check audit trail
const audits = await contract.getAuditTrail(1);
```

---

## ✅ What's Included

- ✅ Smart contract with all required features
- ✅ Comprehensive test suite (50+ tests)
- ✅ Deployment scripts for local and testnet
- ✅ ABI extraction for frontend
- ✅ Complete documentation
- ✅ API reference guide
- ✅ Deployment guide
- ✅ Security best practices

---

## 🚀 Next Steps

1. **Review**: Read `README.md` and contract code
2. **Test**: Run `npm test` - all should pass
3. **Deploy**: Try local deployment with `npm run deploy:localhost`
4. **Integrate**: Review `frontend/INTEGRATION_GUIDE.md` for frontend setup
5. **Testnet**: Deploy to Mumbai using `npm run deploy:polygon`

---

**More Help**: See `README.md`, `API_REFERENCE.md`, or `DEPLOYMENT_GUIDE.md`

Last Updated: May 2026
