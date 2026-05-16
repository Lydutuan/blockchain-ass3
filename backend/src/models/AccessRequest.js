const mongoose = require("mongoose");

const AccessRequestSchema = new mongoose.Schema(
  {
    recordId: {
      type: Number,
      required: true,
    },
    requester: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    patient: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "denied"],
      default: "pending",
    },
    message: String,
    expiryTime: Number,
    txHash: String,
    metadata: Object,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AccessRequest", AccessRequestSchema);
