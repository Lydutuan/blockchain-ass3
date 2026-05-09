# Medical Records Contract - Frontend Integration Guide

## Contract ABI

The contract ABI is available in multiple formats:
- `MedicalRecords.abi.json` - JSON format
- `MedicalRecords.abi.ts` - TypeScript export
- `MedicalRecords.abi.js` - JavaScript export

## Key Functions

### Write Functions (require transactions)
- `addRecord()`
- `grantAccess()`
- `revokeAccess()`

### View Functions (read-only, no gas cost)
- `accessGrants()`
- `checkAccess()`
- `getRecord()`
- `records()`

### Events
- `AccessGranted`
- `AccessRevoked`
- `RecordCreated`

## Usage Example (Web3.js)

```javascript
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
```

## Usage Example (Ethers.js v6)

```javascript
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
```

## Contract Events to Monitor

- `RecordCreated`: Fired when a new medical record is created
- `RecordUpdated`: Fired when a record's IPFS CID is updated
- `AccessGranted`: Fired when access is granted to a user
- `AccessRevoked`: Fired when access is revoked from a user
- `MedicineVerified`: Fired when medicine verification is completed
- `AuditLogged`: Fired for all audit trail entries

## Security Considerations

1. **Always verify on-chain access** before displaying patient data
2. **Use expiry times** for temporary access grants
3. **Monitor audit logs** for suspicious access patterns
4. **Validate IPFS CIDs** before accepting them
5. **Use HTTPS** for all API calls
6. **Store private keys securely** - never expose in frontend code
