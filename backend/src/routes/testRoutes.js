const express = require("express");
const router = express.Router();

const MedicalRecord = require("../models/MedicalRecord");

router.get("/seed", async (req, res) => {
  try {
    const record = await MedicalRecord.create({
      patientWallet: "0x123",
      doctorWallet: "0x456",
      fileName: "test.pdf",
      fileType: "pdf",
      ipfsHash: "QmTest123",
    });

    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;