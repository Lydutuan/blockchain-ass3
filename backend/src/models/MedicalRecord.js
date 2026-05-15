const mongoose = require("mongoose");

const MedicalRecordSchema =
  new mongoose.Schema(
    {
      patientWallet: String,
      doctorWallet: String,
      fileName: String,
      fileType: String,
      title: String,
      hospital: String,
      description: String,
      recordType: String,
      ipfsHash: String,
      txHash: String,
      recordId: Number,
      encrypted: Boolean,
      encryptedKey: String,
      iv: String,
      authTag: String,
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "MedicalRecord",
  MedicalRecordSchema
);