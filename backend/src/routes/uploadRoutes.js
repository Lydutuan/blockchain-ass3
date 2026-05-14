const express = require("express");

const router = express.Router();

const upload = require(
  "../middleware/upload"
);

const {
  uploadMedicalRecord,
} = require(
  "../controllers/uploadController"
);

router.post(
  "/",
  upload.single("file"),
  uploadMedicalRecord
);

module.exports = router;
