const mongoose = require("mongoose");

const AuditLogSchema =
  new mongoose.Schema(
    {
      action: String,

      performedBy: String,

      txHash: String,

      ipfsHash: String,

      recordId: String,

      blockNumber: Number,

      metadata: Object,
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "AuditLog",
  AuditLogSchema
);