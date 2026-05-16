const express = require("express");
const router = express.Router();

const AccessRequest = require("../models/AccessRequest");

const normalizeAddress = (value) => {
  if (!value) return "";
  return String(value).trim().toLowerCase();
};

const normalizeNumber = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
};

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const recordId = normalizeNumber(body.recordId);
    const requester = normalizeAddress(body.requester);
    const patient = normalizeAddress(body.patient);

    if (!recordId || !requester || !patient) {
      return res.status(400).json({ success: false, error: "recordId, requester, and patient are required" });
    }

    const request = await AccessRequest.create({
      recordId,
      requester,
      patient,
      message: body.message || "",
      expiryTime: normalizeNumber(body.expiryTime),
      metadata: body.metadata || {},
    });

    res.json({ success: true, request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const query = {};

    if (req.query.patient) query.patient = normalizeAddress(req.query.patient);
    if (req.query.requester) query.requester = normalizeAddress(req.query.requester);
    if (req.query.status) query.status = String(req.query.status).trim().toLowerCase();

    const requests = await AccessRequest.find(query).sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/:id/approve", async (req, res) => {
  try {
    const request = await AccessRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: "Access request not found" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ success: false, error: "Only pending requests can be approved" });
    }

    request.status = "approved";
    request.txHash = req.body.txHash || request.txHash || null;
    await request.save();

    res.json({ success: true, request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/:id/deny", async (req, res) => {
  try {
    const request = await AccessRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: "Access request not found" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ success: false, error: "Only pending requests can be denied" });
    }

    request.status = "denied";
    request.metadata = { ...request.metadata, deniedReason: req.body.reason || "Patient denied the request" };
    await request.save();

    res.json({ success: true, request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
