const contract = require(
  "../blockchain/contract"
);

const AuditLog = require(
  "../models/AuditLog"
);

console.log(
  "Medical blockchain listener started..."
);

// =====================================
// RECORD CREATED EVENT
// =====================================

contract.on(
  "RecordCreated",
  async (
    recordId,
    owner,
    ipfsCid,
    timestamp,
    event
  ) => {
    try {
      console.log(
        "RecordCreated EVENT RECEIVED"
      );

      console.log({
        recordId:
          recordId.toString(),

        owner,

        ipfsCid,

        txHash:
          event.log.transactionHash,
      });

      await AuditLog.create({
        action:
          "RecordCreated",

        performedBy:
          owner,

        txHash:
          event.log.transactionHash,

        ipfsHash:
          ipfsCid,

        recordId:
          Number(recordId),

        blockNumber:
          event.log.blockNumber,

        metadata: {
          timestamp:
            timestamp.toString(),
        },
      });

      console.log(
        "Audit log saved"
      );
    } catch (err) {
      console.error(
        "Listener error:",
        err
      );
    }
  }
);

// =====================================
// ACCESS GRANTED EVENT
// =====================================

contract.on(
  "AccessGranted",
  async (
    recordId,
    grantedTo,
    expiryTime,
    timestamp,
    event
  ) => {
    try {
      console.log(
        "AccessGranted EVENT"
      );

      await AuditLog.create({
        action:
          "AccessGranted",

        performedBy:
          grantedTo,

        txHash:
          event.log.transactionHash,

        recordId:
          Number(recordId),

        blockNumber:
          event.log.blockNumber,

        metadata: {
          expiryTime:
            expiryTime.toString(),

          timestamp:
            timestamp.toString(),
        },
      });

      console.log(
        "AccessGranted saved"
      );
    } catch (err) {
      console.error(err);
    }
  }
);

// =====================================
// ACCESS REVOKED EVENT
// =====================================

contract.on(
  "AccessRevoked",
  async (
    recordId,
    revokedFrom,
    timestamp,
    event
  ) => {
    try {
      console.log(
        "AccessRevoked EVENT"
      );

      await AuditLog.create({
        action:
          "AccessRevoked",

        performedBy:
          revokedFrom,

        txHash:
          event.log.transactionHash,

        recordId:
          Number(recordId),

        blockNumber:
          event.log.blockNumber,

        metadata: {
          timestamp:
            timestamp.toString(),
        },
      });

      console.log(
        "AccessRevoked saved"
      );
    } catch (err) {
      console.error(err);
    }
  }
);