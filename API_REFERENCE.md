# Medical Records Smart Contract - API Reference

Complete API documentation for the MedicalRecords smart contract.

## Contract Address Format
```
0x[40 hexadecimal characters]
```

---

# Table of Contents

- [Record Management](#record-management)
- [Access Control](#access-control)
- [Medicine Verification](#medicine-verification)
- [Audit Functions](#audit-functions)
- [Role Management](#role-management)
- [Admin Functions](#admin-functions)
- [Query Functions](#query-functions)
- [Events](#events)
- [Data Structures](#data-structures)
- [Error Codes](#error-codes)

---

## Record Management

### addRecord

Creates a new patient medical record.

**Signature:**
```solidity
function addRecord(
    address _patient,
    string memory _ipfsCid
) external onlyRole(ADMIN_ROLE) nonReentrant whenNotPaused returns (uint256)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `_patient` | address | Patient's wallet address (non-zero) |
| `_ipfsCid` | string | IPFS CID containing encrypted patient data |

**Returns:**
| Type | Description |
|------|-------------|
| `uint256` | New record ID |

**Requirements:**
- Caller must have ADMIN_ROLE
- Contract must not be paused
- `_patient` cannot be zero address
- `_ipfsCid` cannot be empty

**Emits:**
```solidity
event RecordCreated(
    uint256 indexed recordId,
    address indexed patient,
    string ipfsCid,
    uint256 timestamp
)
```

**Example (Web3.js):**
```javascript
const recordId = await contract.methods.addRecord(
  '0x1234...',
  'QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
).send({ from: account });
```

**Example (Ethers.js):**
```javascript
const tx = await contract.addRecord(
  '0x1234...',
  'QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
);
const receipt = await tx.wait();
const recordId = receipt.events[0].args.recordId;
```

---

### getRecord

Retrieves a patient record (requires valid access).

**Signature:**
```solidity
function getRecord(uint256 _recordId)
    external
    view
    returns (PatientRecord memory)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `_recordId` | uint256 | ID of the record to retrieve |

**Returns:**
```solidity
struct PatientRecord {
    uint256 recordId;
    address patient;
    string ipfsCid;
    uint256 createdAt;
    uint256 updatedAt;
    bool isActive;
    uint256 version;
}
```

**Requirements:**
- Record must exist and be active
- Caller must have valid access (via grantAccess or be patient)

**Example:**
```javascript
const record = await contract.getRecord(1);
console.log(record.patient);      // Patient address
console.log(record.ipfsCid);      // Encrypted data CID
console.log(record.version);      // Current version
```

---

### updateRecord

Updates a patient record's IPFS CID.

**Signature:**
```solidity
function updateRecord(
    uint256 _recordId,
    string memory _newIpfsCid
) external onlyRole(ADMIN_ROLE) nonReentrant whenNotPaused
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `_recordId` | uint256 | ID of the record to update |
| `_newIpfsCid` | string | New IPFS CID |

**Requirements:**
- Caller must have ADMIN_ROLE
- Record must exist and be active
- New CID cannot be empty

**Side Effects:**
- Increments record version
- Updates `updatedAt` timestamp

**Emits:**
```solidity
event RecordUpdated(
    uint256 indexed recordId,
    string newIpfsCid,
    uint256 timestamp
)
```

**Example:**
```javascript
await contract.updateRecord(
  1,
  'QmYyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy'
);
```

---

## Access Control

### grantAccess

Grants access to a medical record with optional expiry time.

**Signature:**
```solidity
function grantAccess(
    uint256 _recordId,
    address _user,
    uint256 _expiryTime,
    string memory _accessLevel
) external onlyRole(ADMIN_ROLE) nonReentrant whenNotPaused
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `_recordId` | uint256 | Record ID |
| `_user` | address | User to grant access to |
| `_expiryTime` | uint256 | Unix timestamp when access expires (0 = never expires) |
| `_accessLevel` | string | "read" or "read-write" |

**Requirements:**
- Caller must have ADMIN_ROLE
- Record must exist and be active
- `_user` cannot be zero address
- `_expiryTime` must be 0 or in the future

**Example:**
```javascript
// Grant 30-day access
const expiryTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

await contract.grantAccess(
  1,                      // recordId
  '0xdoctor...',         // doctor's address
  expiryTime,            // expires in 30 days
  'read'                 // read-only access
);
```

---

### revokeAccess

Revokes access to a medical record.

**Signature:**
```solidity
function revokeAccess(
    uint256 _recordId,
    address _user
) external onlyRole(ADMIN_ROLE) nonReentrant whenNotPaused
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `_recordId` | uint256 | Record ID |
| `_user` | address | User to revoke access from |

**Requirements:**
- Caller must have ADMIN_ROLE
- Record must exist
- User must have active access grants

**Emits:**
```solidity
event AccessRevoked(
    uint256 indexed recordId,
    address indexed revokedFrom,
    uint256 timestamp
)
```

**Example:**
```javascript
await contract.revokeAccess(1, '0xdoctor...');
```

---

### hasValidAccess

Checks if a user has valid access to a record.

**Signature:**
```solidity
function hasValidAccess(uint256 _recordId, address _user)
    external
    view
    returns (bool)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `_recordId` | uint256 | Record ID |
| `_user` | address | User address to check |

**Returns:**
| Type | Description |
|------|-------------|
| `bool` | True if user has valid, non-expired, non-revoked access |

**Access Status:**
- ✅ Valid if: Not revoked AND (no expiry OR not expired)
- ❌ Invalid if: Revoked OR expired

**Example:**
```javascript
const hasAccess = await contract.hasValidAccess(1, '0xdoctor...');

if (hasAccess) {
  // Fetch and display record
} else {
  // Show access denied
}
```

---

### getAccessGrants

Retrieves all access grants for a record-user pair.

**Signature:**
```solidity
function getAccessGrants(
    uint256 _recordId,
    address _user
) external view returns (AccessGrant[] memory)
```

**Returns:**
```solidity
struct AccessGrant {
    address user;
    uint256 grantedAt;
    uint256 expiryTime;
    bool isRevoked;
    string accessLevel;
}
```

**Example:**
```javascript
const grants = await contract.getAccessGrants(1, '0xdoctor...');

grants.forEach(grant => {
  console.log('Granted:', new Date(grant.grantedAt * 1000));
  console.log('Expires:', new Date(grant.expiryTime * 1000));
  console.log('Revoked:', grant.isRevoked);
  console.log('Level:', grant.accessLevel);
});
```

---

## Medicine Verification

### verifyMedicine

Registers and verifies a medicine for a patient record.

**Signature:**
```solidity
function verifyMedicine(
    uint256 _recordId,
    string memory _medicineName,
    string memory _qrCode,
    bytes32 _medicineHash
) external onlyRole(DOCTOR_ROLE) nonReentrant whenNotPaused returns (uint256)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `_recordId` | uint256 | Record ID |
| `_medicineName` | string | Name of the medicine (non-empty) |
| `_qrCode` | string | QR code data (non-empty) |
| `_medicineHash` | bytes32 | Keccak256 hash for authenticity verification |

**Returns:**
| Type | Description |
|------|-------------|
| `uint256` | Medicine ID |

**Requirements:**
- Caller must have DOCTOR_ROLE
- Caller must have valid access to the record
- All string parameters must be non-empty
- `_medicineHash` cannot be zero

**Emits:**
```solidity
event MedicineVerified(
    uint256 indexed medicineId,
    uint256 indexed recordId,
    bool isValid
)
```

**Example:**
```javascript
const medicineName = 'Aspirin 500mg';
const qrCode = 'https://qr.example.com/aspirin-001';
const medicineHash = ethers.id('authentic-batch-001');

const tx = await contract.verifyMedicine(
  1,
  medicineName,
  qrCode,
  medicineHash
);

const receipt = await tx.wait();
const medicineId = receipt.events[0].args.medicineId;
```

---

### verifyMedicineHash

Verifies if a medicine hash matches the registered hash (authenticity check).

**Signature:**
```solidity
function verifyMedicineHash(
    uint256 _medicineId,
    bytes32 _providedHash
) external view returns (bool)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `_medicineId` | uint256 | Medicine ID to verify |
| `_providedHash` | bytes32 | Hash to verify against stored hash |

**Returns:**
| Type | Description |
|------|-------------|
| `bool` | True if hashes match (authentic) |

**Example:**
```javascript
// Verify authenticity
const providedHash = ethers.id('authentic-batch-001');
const isAuthentic = await contract.verifyMedicineHash(1, providedHash);

if (isAuthentic) {
  console.log('✅ Medicine is authentic');
} else {
  console.log('❌ Medicine may be counterfeit');
}
```

---

### getMedicinesForRecord

Retrieves all medicine IDs associated with a record.

**Signature:**
```solidity
function getMedicinesForRecord(uint256 _recordId)
    external
    view
    returns (uint256[] memory)
```

**Returns:**
| Type | Description |
|------|-------------|
| `uint256[]` | Array of medicine IDs |

**Example:**
```javascript
const medicineIds = await contract.getMedicinesForRecord(1);

medicineIds.forEach(async (id) => {
  const medicine = await contract.getMedicineDetails(id);
  console.log(medicine.medicineName);
});
```

---

### getMedicineDetails

Retrieves details of a specific medicine.

**Signature:**
```solidity
function getMedicineDetails(uint256 _medicineId)
    external
    view
    returns (MedicineRecord memory)
```

**Returns:**
```solidity
struct MedicineRecord {
    uint256 medicineId;
    address doctor;
    uint256 recordId;
    string medicineName;
    string qrCode;
    bytes32 medicineHash;
    uint256 prescribedAt;
    bool isVerified;
}
```

**Example:**
```javascript
const medicine = await contract.getMedicineDetails(1);

console.log('Medicine:', medicine.medicineName);
console.log('Doctor:', medicine.doctor);
console.log('Prescribed:', new Date(medicine.prescribedAt * 1000));
console.log('QR Code:', medicine.qrCode);
```

---

## Audit Functions

### getAuditTrail

Retrieves all audit entries for a specific record.

**Signature:**
```solidity
function getAuditTrail(uint256 _recordId)
    external
    view
    returns (AuditEntry[] memory)
```

**Returns:**
```solidity
struct AuditEntry {
    uint256 timestamp;
    address user;
    uint256 recordId;
    EventType eventType;
    string ipfsCid;
    string details;
}
```

**EventType enum:**
```solidity
enum EventType {
    RECORD_CREATED,      // 0
    RECORD_ACCESSED,     // 1
    RECORD_UPDATED,      // 2
    ACCESS_GRANTED,      // 3
    ACCESS_REVOKED,      // 4
    MEDICINE_VERIFIED,   // 5
    MEDICINE_FAILED      // 6
}
```

**Example:**
```javascript
const auditTrail = await contract.getAuditTrail(1);

auditTrail.forEach(entry => {
  const eventNames = [
    'Record Created',
    'Record Accessed',
    'Record Updated',
    'Access Granted',
    'Access Revoked',
    'Medicine Verified',
    'Medicine Failed'
  ];
  
  console.log(`${eventNames[entry.eventType]} by ${entry.user}`);
  console.log(`Timestamp: ${new Date(entry.timestamp * 1000)}`);
});
```

---

### getAuditTrailLength

Gets the total number of audit entries.

**Signature:**
```solidity
function getAuditTrailLength() external view returns (uint256)
```

**Returns:**
| Type | Description |
|------|-------------|
| `uint256` | Total audit entries across all records |

**Example:**
```javascript
const totalEntries = await contract.getAuditTrailLength();
console.log(`Total audit entries: ${totalEntries}`);
```

---

## Role Management

### getRoleID / Role Constants

```solidity
bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00...;
bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
bytes32 public constant PATIENT_ROLE = keccak256("PATIENT_ROLE");
```

---

### grantRole

Grants a role to an address.

**Signature:**
```solidity
function grantRole(
    bytes32 role,
    address account
) external onlyRole(getRoleAdmin(role))
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `role` | bytes32 | Role to grant (e.g., DOCTOR_ROLE) |
| `account` | address | Address to grant role to |

**Example:**
```javascript
const DOCTOR_ROLE = await contract.DOCTOR_ROLE();
await contract.grantRole(DOCTOR_ROLE, '0xdoctor...');
```

---

### revokeRole

Revokes a role from an address.

**Signature:**
```solidity
function revokeRole(
    bytes32 role,
    address account
) external onlyRole(getRoleAdmin(role))
```

**Example:**
```javascript
const DOCTOR_ROLE = await contract.DOCTOR_ROLE();
await contract.revokeRole(DOCTOR_ROLE, '0xdoctor...');
```

---

### hasRole

Checks if an address has a specific role.

**Signature:**
```solidity
function hasRole(bytes32 role, address account)
    external
    view
    returns (bool)
```

**Example:**
```javascript
const DOCTOR_ROLE = await contract.DOCTOR_ROLE();
const isDoctor = await contract.hasRole(DOCTOR_ROLE, '0xaddress...');
```

---

## Admin Functions

### pause

Emergency pause - blocks all state-modifying functions.

**Signature:**
```solidity
function pause() external onlyRole(ADMIN_ROLE)
```

**Blocked Functions:**
- addRecord
- updateRecord
- grantAccess
- revokeAccess
- verifyMedicine

**Example:**
```javascript
// Emergency pause
await contract.pause();
```

---

### unpause

Resume contract operations.

**Signature:**
```solidity
function unpause() external onlyRole(ADMIN_ROLE)
```

**Example:**
```javascript
await contract.unpause();
```

---

## Query Functions

### getRecordCount

Gets total number of records created.

**Signature:**
```solidity
function getRecordCount() external view returns (uint256)
```

**Example:**
```javascript
const totalRecords = await contract.getRecordCount();
console.log(`Total records: ${totalRecords}`);
```

---

### getMedicineCount

Gets total number of medicines registered.

**Signature:**
```solidity
function getMedicineCount() external view returns (uint256)
```

**Example:**
```javascript
const totalMedicines = await contract.getMedicineCount();
console.log(`Total medicines: ${totalMedicines}`);
```

---

## Events

### RecordCreated

Emitted when a new record is created.

**Signature:**
```solidity
event RecordCreated(
    uint256 indexed recordId,
    address indexed patient,
    string ipfsCid,
    uint256 timestamp
)
```

---

### RecordUpdated

Emitted when a record is updated.

**Signature:**
```solidity
event RecordUpdated(
    uint256 indexed recordId,
    string newIpfsCid,
    uint256 timestamp
)
```

---

### AccessGranted

Emitted when access is granted.

**Signature:**
```solidity
event AccessGranted(
    uint256 indexed recordId,
    address indexed grantedTo,
    uint256 expiryTime,
    string accessLevel
)
```

---

### AccessRevoked

Emitted when access is revoked.

**Signature:**
```solidity
event AccessRevoked(
    uint256 indexed recordId,
    address indexed revokedFrom,
    uint256 timestamp
)
```

---

### MedicineVerified

Emitted when medicine is verified.

**Signature:**
```solidity
event MedicineVerified(
    uint256 indexed medicineId,
    uint256 indexed recordId,
    bool isValid
)
```

---

### AuditLogged

Emitted for audit trail entries.

**Signature:**
```solidity
event AuditLogged(
    uint256 indexed recordId,
    address indexed user,
    EventType eventType,
    uint256 timestamp,
    string ipfsCid
)
```

---

## Data Structures

### PatientRecord

```solidity
struct PatientRecord {
    uint256 recordId;           // Unique identifier
    address patient;            // Patient's address
    string ipfsCid;             // IPFS CID of encrypted data
    uint256 createdAt;          // Unix timestamp
    uint256 updatedAt;          // Unix timestamp
    bool isActive;              // Active/inactive status
    uint256 version;            // Version number for tracking
}
```

### AccessGrant

```solidity
struct AccessGrant {
    address user;               // User granted access
    uint256 grantedAt;          // Unix timestamp
    uint256 expiryTime;         // 0 = no expiry
    bool isRevoked;             // Revocation status
    string accessLevel;         // "read" or "read-write"
}
```

### MedicineRecord

```solidity
struct MedicineRecord {
    uint256 medicineId;         // Unique identifier
    address doctor;             // Prescribing doctor
    uint256 recordId;           // Associated record
    string medicineName;        // Medicine name
    string qrCode;              // QR code data
    bytes32 medicineHash;       // Authenticity hash
    uint256 prescribedAt;       // Unix timestamp
    bool isVerified;            // Verification status
}
```

### AuditEntry

```solidity
struct AuditEntry {
    uint256 timestamp;          // Unix timestamp
    address user;               // User performing action
    uint256 recordId;           // Affected record
    EventType eventType;        // Type of event
    string ipfsCid;             // Associated CID
    string details;             // Additional details
}
```

---

## Error Codes

| Error | Meaning |
|-------|---------|
| `AccessControlUnauthorizedAccount` | Caller lacks required role |
| `EnforcedPause` | Contract is paused |
| `Invalid patient address` | Zero address provided |
| `IPFS CID cannot be empty` | Empty string for CID |
| `Record does not exist` | Record not found or inactive |
| `No access to this record` | Caller lacks access |
| `Invalid user address` | Zero address for user |
| `Invalid expiry time` | Expiry time is in past |
| `No active access grants` | User has no access to revoke |
| `Medicine name required` | Empty medicine name |
| `QR code required` | Empty QR code |
| `Invalid medicine hash` | Zero hash provided |
| `Medicine not found` | Medicine ID not found |

---

## Gas Considerations

**Typical Gas Costs (Ethereum):**

| Function | Gas Estimate |
|----------|-------------|
| addRecord | 85,000-95,000 |
| getRecord | 0 (view) |
| updateRecord | 45,000-55,000 |
| grantAccess | 65,000-75,000 |
| revokeAccess | 55,000-65,000 |
| verifyMedicine | 95,000-110,000 |
| getAuditTrail | 0 (view) |

---

**Last Updated**: May 2026
**Contract Version**: 1.0
**Solidity**: 0.8.20
