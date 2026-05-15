const express = require("express");
const router = express.Router();

const uploadController = require("../controllers/uploadController");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

// Upload file route
router.post(
  "/upload",
  upload.single("file"),
  uploadController.uploadFile
);

module.exports = router;