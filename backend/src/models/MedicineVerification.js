const mongoose = require("mongoose");

const MedicineVerificationSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    recordId: Number,
    medicineName: String,
    qrCode: String,
    medicineHash: String,
    ipfsCid: String,
    status: {
      type: String,
      enum: ["authentic", "suspicious", "expired", "unknown"],
      default: "unknown",
    },
    manufacturer: String,
    manufacturerAddr: String,
    expiryDate: String,
    verifiedBy: String,
    metadata: Object,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MedicineVerification", MedicineVerificationSchema);
