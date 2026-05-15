const MedicalRecord = require("../models/MedicalRecord");
const AuditLog = require("../models/AuditLog");

const { encryptBuffer } = require("../utils/encryption");
const pinata = require("../utils/pinata");

/**
 * =========================
 * UPLOAD MEDICAL FILE
 * =========================
 */
exports.uploadFile = async (req, res) => {
  try {
    const file = req.file;
    const { title, hospital, description, recordType, uploaderAddress } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: "Record title is required",
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
      patientWallet: uploaderAddress || null,
      fileName: file.originalname,
      fileType: file.mimetype,
      title,
      hospital,
      description,
      recordType,
      ipfsHash,
      encrypted: true,
      createdAt: new Date(),
      encryptedKey: key.toString("hex"),
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
    });

    // =========================
    // 4. AUDIT LOG
    // =========================
    await AuditLog.create({
      action: "RecordUploaded",
      performedBy: uploaderAddress || "anonymous",
      txHash: null,
      ipfsHash,
      recordId: record._id.toString(),
      metadata: {
        title,
        hospital,
        recordType,
      },
    });

    // =========================
    // 5. RESPONSE
    // =========================
    return res.status(200).json({
      success: true,
      recordId: record._id,
      ipfsHash,
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
