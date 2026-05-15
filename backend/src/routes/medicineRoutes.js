const express = require("express");
const router = express.Router();

const AuditLog = require("../models/AuditLog");
const MedicineVerification = require("../models/MedicineVerification");

const normalizeBatchId = (value) => {
  if (!value) return "";
  return String(value).trim().toLowerCase();
};

// Fetch medicine verification data by batch ID and audit the lookup
router.get("/verify", async (req, res) => {
  try {
    const batchId = normalizeBatchId(req.query.batchId);
    const wallet = String(req.query.wallet || "unknown").toLowerCase();

    if (!batchId) {
      return res.status(400).json({ success: false, error: "batchId is required" });
    }

    const record = await MedicineVerification.findOne({ batchId });

    await AuditLog.create({
      action: "MedicineLookup",
      performedBy: wallet,
      txHash: null,
      ipfsHash: record?.ipfsCid || null,
      recordId: record?.recordId ? String(record.recordId) : null,
      metadata: { batchId },
    });

    if (!record) {
      return res.status(404).json({ success: false, error: "No medicine record found for that batch ID" });
    }

    res.json({ success: true, record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/batches", async (req, res) => {
  try {
    const records = await MedicineVerification.find({}, { batchId: 1, medicineName: 1, status: 1 }).sort({ batchId: 1 });
    res.json({ success: true, batches: records.map((item) => ({ batchId: item.batchId, medicineName: item.medicineName, status: item.status })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create or update a medicine verification record
router.post("/verify", async (req, res) => {
  try {
    const body = req.body || {};
    const batchId = normalizeBatchId(body.batchId);

    if (!batchId) {
      return res.status(400).json({ success: false, error: "batchId is required" });
    }

    const payload = {
      batchId,
      recordId: body.recordId ? Number(body.recordId) : undefined,
      medicineName: body.medicineName || body.drugName || "",
      qrCode: body.qrCode || "",
      medicineHash: body.medicineHash || "",
      ipfsCid: body.ipfsCid || "",
      status: body.status || "unknown",
      manufacturer: body.manufacturer || "",
      manufacturerAddr: body.manufacturerAddr || "",
      expiryDate: body.expiryDate || "",
      verifiedBy: body.verifiedBy || "",
      metadata: body.metadata || {},
    };

    const record = await MedicineVerification.findOneAndUpdate(
      { batchId },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await AuditLog.create({
      action: "MedicineVerified",
      performedBy: payload.verifiedBy || "system",
      txHash: null,
      ipfsHash: payload.ipfsCid || null,
      recordId: payload.recordId ? String(payload.recordId) : null,
      metadata: { batchId, status: payload.status },
    });

    res.json({ success: true, record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
