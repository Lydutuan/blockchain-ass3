const express = require("express");

const router = express.Router();

const AuditLog = require(
  "../models/AuditLog"
);

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