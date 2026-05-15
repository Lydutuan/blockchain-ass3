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
    // Get file from multer - with .single("file"), it's in req.file
    const file = req.file;
    
    // Get form fields from req.body
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
    let ipfsHash;
    try {
      const ipfsResult = await pinata.uploadBuffer(encryptedData);
      ipfsHash = ipfsResult.IpfsHash;
    } catch (pinataErr) {
      console.error("PINATA ERROR:", pinataErr.message);
      return res.status(500).json({
        success: false,
        error: "Failed to upload to IPFS: " + pinataErr.message,
      });
    }

    // =========================
    // 3. SAVE TO MONGODB (optional if connected)
    // =========================
    let record = null;
    try {
      record = await MedicalRecord.create({
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
    } catch (dbErr) {
      console.warn("MongoDB save failed (continuing without DB):", dbErr.message);
    }

    // =========================
    // 4. AUDIT LOG (optional if connected)
    // =========================
    try {
      await AuditLog.create({
        action: "RecordUploaded",
        performedBy: uploaderAddress || "anonymous",
        txHash: null,
        ipfsHash,
        recordId: record?._id?.toString() || "unknown",
        metadata: {
          title,
          hospital,
          recordType,
        },
      });
    } catch (auditErr) {
      console.warn("Audit log failed:", auditErr.message);
    }

    // =========================
    // 5. RESPONSE - SUCCESS if IPFS upload worked
    // =========================
    return res.status(200).json({
      success: true,
      recordId: record?._id || "unknown",
      ipfsHash,
      message: "File uploaded to IPFS successfully" + (record ? " and saved to database" : " (database unavailable)"),
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
