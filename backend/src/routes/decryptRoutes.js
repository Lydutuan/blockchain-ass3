const express = require("express");
const router = express.Router();

const MedicalRecord = require("../models/MedicalRecord");
const { decryptBuffer } = require("../utils/decrypt");

// Node 18+ has fetch built-in
router.get("/:id", async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        error: "Record not found",
      });
    }

    // =========================
    // 1. FETCH FROM IPFS
    // =========================
    const ipfsUrl = `https://ipfs.io/ipfs/${record.ipfsHash}`;

    const response = await fetch(ipfsUrl);
    const encryptedBuffer = Buffer.from(
      await response.arrayBuffer()
    );

    // =========================
    // 2. DECRYPT FILE
    // =========================
    const decrypted = decryptBuffer(
      encryptedBuffer,
      record.encryptedKey,
      record.iv,
      record.authTag
    );

    // =========================
    // 3. RETURN FILE
    // =========================
    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.send(decrypted);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;

