const mongoose = require("mongoose");

const MedicalRecordSchema = new mongoose.Schema(
  {
    patientWallet: {
      type: String,
      required: true,
      index: true,
    },

    doctorWallet: {
      type: String,
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    fileType: String,

    ipfsHash: {
      type: String,
      required: true,
    },

    transactionHash: {
      type: String,
    },

    encrypted: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicalRecord", MedicalRecordSchema);