// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MedicalRecords
 * @dev Core contract for managing patient medical records with access control
 */
contract MedicalRecords is ReentrancyGuard {
    /**
     * @dev Patient record structure
     */
    struct PatientRecord {
        uint256 recordId;
        address owner;
        string ipfsCid;
        uint256 createdAt;
        bool exists;
    }

    /**
     * @dev Access grant structure
     */
    struct Access {
        address grantedTo;
        uint256 grantedAt;
        uint256 expiryTime;
        bool isRevoked;
    }

    // State variables
    uint256 private recordCounter = 1;
    mapping(uint256 => PatientRecord) public records;
    mapping(uint256 => Access[]) public accessGrants;

    // Events
    event RecordCreated(
        uint256 indexed recordId,
        address indexed owner,
        string ipfsCid,
        uint256 timestamp
    );

    event AccessGranted(
        uint256 indexed recordId,
        address indexed grantedTo,
        uint256 expiryTime,
        uint256 timestamp
    );

    event AccessRevoked(
        uint256 indexed recordId,
        address indexed revokedFrom,
        uint256 timestamp
    );

    // ==================== CORE FUNCTIONS ====================

    /**
     * @dev Create a new medical record
     * @param _ipfsCid The IPFS CID containing the encrypted medical data
     * @return The new record ID
     */
    function addRecord(string memory _ipfsCid)
        external
        nonReentrant
        returns (uint256)
    {
        require(bytes(_ipfsCid).length > 0, "IPFS CID cannot be empty");

        uint256 newRecordId = recordCounter;
        recordCounter++;

        records[newRecordId] = PatientRecord({
            recordId: newRecordId,
            owner: msg.sender,
            ipfsCid: _ipfsCid,
            createdAt: block.timestamp,
            exists: true
        });

        // Auto-grant owner permanent access
        accessGrants[newRecordId].push(
            Access({
                grantedTo: msg.sender,
                grantedAt: block.timestamp,
                expiryTime: 0, // No expiry for owner
                isRevoked: false
            })
        );

        emit RecordCreated(newRecordId, msg.sender, _ipfsCid, block.timestamp);

        return newRecordId;
    }

    /**
     * @dev Grant access to a medical record
     * @param _recordId The record ID
     * @param _user The user to grant access to
     * @param _expiryTime The expiry timestamp (0 for no expiry)
     */
    function grantAccess(
        uint256 _recordId,
        address _user,
        uint256 _expiryTime
    ) external nonReentrant {
        require(records[_recordId].exists, "Record does not exist");
        require(msg.sender == records[_recordId].owner, "Only owner can grant access");
        require(_user != address(0), "Invalid user address");
        require(_expiryTime == 0 || _expiryTime > block.timestamp, "Invalid expiry time");

        accessGrants[_recordId].push(
            Access({
                grantedTo: _user,
                grantedAt: block.timestamp,
                expiryTime: _expiryTime,
                isRevoked: false
            })
        );

        emit AccessGranted(_recordId, _user, _expiryTime, block.timestamp);
    }

    /**
     * @dev Revoke access to a medical record
     * @param _recordId The record ID
     * @param _user The user to revoke access from
     */
    function revokeAccess(uint256 _recordId, address _user)
        external
        nonReentrant
    {
        require(records[_recordId].exists, "Record does not exist");
        require(msg.sender == records[_recordId].owner, "Only owner can revoke access");
        require(_user != address(0), "Invalid user address");

        Access[] storage grants = accessGrants[_recordId];
        require(grants.length > 0, "No access grants found");

        // Mark the latest access grant to this user as revoked
        for (uint256 i = grants.length; i > 0; i--) {
            if (grants[i - 1].grantedTo == _user && !grants[i - 1].isRevoked) {
                grants[i - 1].isRevoked = true;
                break;
            }
        }

        emit AccessRevoked(_recordId, _user, block.timestamp);
    }

    /**
     * @dev Get a patient record (with permission check)
     * @param _recordId The record ID
     * @return The patient record
     */
    function getRecord(uint256 _recordId)
        external
        view
        returns (PatientRecord memory)
    {
        require(records[_recordId].exists, "Record does not exist");
        require(checkAccess(_recordId, msg.sender), "No access to this record");

        return records[_recordId];
    }

    /**
     * @dev Check if a user has valid access to a record
     * @param _recordId The record ID
     * @param _user The user to check
     * @return True if user has valid access
     */
    function checkAccess(uint256 _recordId, address _user)
        public
        view
        returns (bool)
    {
        require(records[_recordId].exists, "Record does not exist");

        Access[] storage grants = accessGrants[_recordId];

        if (grants.length == 0) {
            return false;
        }

        // Check all grants in order (latest takes precedence)
        for (uint256 i = grants.length; i > 0; i--) {
            Access memory grant = grants[i - 1];

            if (grant.grantedTo == _user) {
                // Check if revoked
                if (grant.isRevoked) {
                    return false;
                }

                // Check if expired
                if (grant.expiryTime > 0 && grant.expiryTime < block.timestamp) {
                    return false;
                }

                return true;
            }
        }

        return false;
    }
}
