const express = require("express");

const router = express.Router();

const AuditLog = require(
  "../models/AuditLog"
);
const MedicalRecord = require("../models/MedicalRecord");
const contract = require("../blockchain/contract");

// Create a view request (from requester -> owner)
router.post('/request', async (req, res) => {
  try {
    const { recordId, requester } = req.body;
    if (!recordId || !requester) return res.status(400).json({ error: 'recordId and requester required' });

    // normalize recordId to string (support REC-1 or numeric)
    const rid = String(recordId).replace(/^REC-/, '');

    // create audit log entry for request
    const log = await AuditLog.create({
      action: 'ViewRequested',
      performedBy: requester,
      txHash: null,
      ipfsHash: null,
      recordId: rid,
      metadata: {},
    });

    return res.json({ success: true, log });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Respond to a view request (accept -> grant on-chain, reject -> log denial)
router.post('/respond', async (req, res) => {
  try {
    const { recordId, requester, responder, decision } = req.body;
    if (!recordId || !requester || !responder || !decision) return res.status(400).json({ error: 'missing fields' });

    const ridStr = String(recordId).replace(/^REC-/, '');
    const ridNum = BigInt(ridStr.replace(/\D/g, '') || '0');

    if (decision === 'accept') {
      // call contract to grant access
      const tx = await contract.grantAccess(ridNum, requester, 0n);
      await tx.wait();
      const log = await AuditLog.create({
        action: 'AccessGranted',
        performedBy: responder,
        txHash: tx.hash,
        ipfsHash: null,
        recordId: ridStr,
        metadata: { grantedTo: requester },
      });
      return res.json({ success: true, txHash: tx.hash, log });
    }

    // reject
    const log = await AuditLog.create({
      action: 'AccessDenied',
      performedBy: responder,
      txHash: null,
      ipfsHash: null,
      recordId: ridStr,
      metadata: { deniedTo: requester },
    });
    return res.json({ success: true, log });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// =====================================
// GET ALL AUDIT LOGS
// =====================================

router.get(
  "/",
  async (req, res) => {
    try {
      const logs =
        await AuditLog.find()
          .sort({
            createdAt: -1,
          });

      res.json({
        success: true,
        count: logs.length,
        logs,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// =====================================
// GET LOGS BY RECORD ID
// =====================================

router.get(
  "/record/:recordId",
  async (req, res) => {
    try {
      const logs =
        await AuditLog.find({
          recordId:
            req.params.recordId,
        }).sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        logs,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// =====================================
// GET LOGS BY WALLET
// =====================================

router.get(
  "/wallet/:wallet",
  async (req, res) => {
    try {
      const logs =
        await AuditLog.find({
          performedBy:
            req.params.wallet,
        }).sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        logs,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

module.exports = router;