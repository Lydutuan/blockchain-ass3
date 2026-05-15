const express = require("express");
const router = express.Router();

const contract = require("../blockchain/contract");

// ===========================
// GRANT ACCESS
// ===========================
router.post("/grant", async (req, res) => {
  try {
    const { recordId, user, expiryTime } = req.body;

    const tx = await contract.grantAccess(
      recordId,
      user,
      expiryTime || 0
    );

    await tx.wait();

    res.json({
      success: true,
      txHash: tx.hash,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ===========================
// REVOKE ACCESS
// ===========================
router.post("/revoke", async (req, res) => {
  try {
    const { recordId, user } = req.body;

    const tx = await contract.revokeAccess(
      recordId,
      user
    );

    await tx.wait();

    res.json({
      success: true,
      txHash: tx.hash,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ===========================
// CHECK ACCESS
// ===========================
router.get("/check", async (req, res) => {
  try {
    const { recordId, user } = req.query;

    const hasAccess = await contract.checkAccess(
      recordId,
      user
    );

    res.json({
      success: true,
      hasAccess,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
