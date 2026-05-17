# Blockchain Medical Records System

A hybrid decentralized medical records platform combining on-chain record access control with off-chain encrypted IPFS storage and backend services.

## 📋 What this project actually does

- ✅ **On-chain record anchoring**: Store only IPFS CIDs in a Solidity smart contract (`MedicalRecords.sol`).
- ✅ **Owner-controlled access**: Patients own records and can grant/revoke access to other wallets.
- ✅ **Encrypted off-chain uploads**: Files are encrypted in the backend and pinned to IPFS via Pinata.
- ✅ **Audit logging**: Backend audit logs capture uploads, access requests, and access grants.
- ✅ **Medicine verification service**: Medicine lookup and authenticity data are handled in backend MongoDB.
- ✅ **React frontend with MetaMask**: A Vite/React app that connects to MetaMask and interacts with both contract and backend.

## 🏗️ Architecture

### Smart Contract

The core contract is `contracts/MedicalRecords.sol`.
It manages:
- `addRecord(string ipfsCid)` — create a new record and store the encrypted IPFS CID.
- `grantAccess(uint256 recordId, address user, uint256 expiryTime)` — allow a wallet to read the record.
- `revokeAccess(uint256 recordId, address user)` — revoke previously granted access.
- `getRecord(uint256 recordId)` — return record data only if caller has access.
- `checkAccess(uint256 recordId, address user)` — verify if a user currently has access.
- `getAccessCount(uint256 recordId)` — return the number of grant entries.

The smart contract does not store raw medical files, user roles, or medicine details; it stores record pointers and access grants.

### Backend

The backend lives in `backend/` and is built with:
- Express.js
- MongoDB / Mongoose
- Pinata IPFS integration
- AES-256-GCM encryption for uploaded files
- `backend/src/routes` for uploads, access management, audit logs, access requests, decryption helpers, and medicine verification.

Key backend behavior:
- Upload file data is encrypted and uploaded to IPFS.
- The backend returns the IPFS hash (`ipfsHash`) to the frontend.
- A MongoDB audit log records upload and access events.
- Medicine verification is implemented off-chain using a `MedicineVerification` collection.
- Contract interactions such as `grantAccess` may be driven by API endpoints.

### Frontend

The frontend lives in `frontend/` and uses:
- React + TypeScript
- Vite
- `ethers.js` v6 for MetaMask and contract interaction
- A wallet connect flow in `frontend/src/blockchain/wallet.ts`
- Contract helpers in `frontend/src/blockchain/contract.ts`
- Pages for dashboard, upload, access control, consent requests, audit logs, and medicine verification.

## 📦 Setup

### Install dependencies

1. Install contract tooling at repo root:
```bash
cd blockchain-ass3
npm install
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

### Environment

Copy and configure environment variables for backend and frontend as needed:
```bash
cd blockchain-ass3
cp .env.example .env
```

The backend expects:
- `MONGO_URI`
- `PINATA_API_KEY`
- `PINATA_SECRET_API_KEY`
- `FRONTEND_URL`

### Compile contracts

```bash
npm run compile
```

## 🚀 Running the project

### Start the backend

```bash
cd backend
npm run start
```

### Start the frontend

```bash
cd frontend
npm run dev
```

### Start a local Hardhat node

```bash
cd blockchain-ass3
npm run localnode
```

### Deploy contracts

```bash
npm run deploy:localhost
npm run deploy:polygon
```

## 🧪 Testing

### Run contract tests

```bash
npm test
```

### Coverage

```bash
npm run test:coverage
```

## 🧠 How the key flows work

### Patient upload flow

1. The user connects MetaMask in the frontend.
2. The frontend sends the medical file and metadata to the backend `/api/upload` endpoint.
3. The backend encrypts the file and pins it to IPFS with Pinata.
4. The backend returns the IPFS hash to the frontend.
5. The frontend calls `addRecord(ipfsCid)` on the smart contract with the connected MetaMask wallet.

### Access control flow

- Access grants are stored on-chain in `accessGrants[recordId]`.
- Only the record owner can call `grantAccess` or `revokeAccess`.
- `getRecord` requires a valid access grant for the caller.
- Access entries support expiration and revocation.

### Real-time consent flow

- Doctors can request access through the frontend.
- Requests are saved in backend audit records.
- Patients approve requests by signing MetaMask transactions to invoke `grantAccess`.
- The backend can also log approvals and denials in MongoDB.

### Medicine verification

Medicine verification is implemented in the backend using MongoDB `MedicineVerification` records. It is not stored in the Solidity contract in the current codebase.

## 📄 Smart contract API

### `addRecord(string _ipfsCid) → uint256`
Create a new medical record and auto-grant the owner permanent access.

### `grantAccess(uint256 _recordId, address _user, uint256 _expiryTime)`
Grant access to another wallet. Pass `0` for no expiry.

### `revokeAccess(uint256 _recordId, address _user)`
Revoke a previously granted access entry.

### `getRecord(uint256 _recordId)`
Returns the record only if the caller has valid access.

### `checkAccess(uint256 _recordId, address _user)`
Check whether a wallet can access a record.

### `getAccessCount(uint256 _recordId)`
Return the number of access grant entries for the record.

## 📌 Notes

- The contract is intentionally simple: it stores record metadata and access grants, not full documents.
- Sensitive files are encrypted and kept off-chain on IPFS.
- Audit logs and medicine verification are handled by the backend and MongoDB.
- The frontend expects MetaMask on the configured Polygon testnet and uses `ethers.js` for signing.
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
