const MedicalRecord = require("../models/MedicalRecord");
const AuditLog = require("../models/AuditLog");

const { encryptBuffer } = require("../utils/encryption");
const pinata = require("../utils/pinata");
const blockchain = require("../blockchain/contract");

/**
 * =========================
 * UPLOAD MEDICAL FILE
 * =========================
 */
exports.uploadFile = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    // =========================
    // 1. ENCRYPT FILE
    // =========================
    const { encryptedData, key, iv, authTag } = encryptBuffer(file.buffer);

    // =========================
    // 2. UPLOAD TO IPFS (PINATA)
    // =========================
    const ipfsResult = await pinata.uploadBuffer(encryptedData);
    const ipfsHash = ipfsResult.IpfsHash;

    // =========================
    // 3. SAVE TO MONGODB
    // =========================
    const record = await MedicalRecord.create({
      ipfsHash,
      encryptedKey: key.toString("hex"),
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
      createdAt: new Date(),
    });

    // =========================
    // 4. WRITE TO BLOCKCHAIN
    // =========================
    const tx = await blockchain.addRecord(ipfsHash);
    const receipt = await tx.wait();

    const blockchainRecordId =
      receipt?.logs?.[0]?.args?.recordId?.toString() || "0";

    // =========================
    // 5. AUDIT LOG
    // =========================
    await AuditLog.create({
      action: "RecordCreated",
      performedBy: req.user?.address || "system",
      txHash: receipt.hash,

      medicalRecordId: record._id.toString(),
      blockchainRecordId,
      ipfsHash,
    });

    // =========================
    // 6. RESPONSE
    // =========================
    return res.status(200).json({
      success: true,
      recordId: record._id, // IMPORTANT: use this for decrypt
      ipfsHash,
      txHash: receipt.hash,
      blockchainRecordId,
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
