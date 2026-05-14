const mongoose = require("mongoose");

const MedicalRecordSchema =
  new mongoose.Schema(
    {
      patientWallet: String,

      doctorWallet: String,

      fileName: String,

      fileType: String,

      ipfsHash: String,

      txHash: String,

      recordId: Number,

      encrypted: Boolean,
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "MedicalRecord",
  MedicalRecordSchema
);