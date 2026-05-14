const MedicalRecord = require(
  "../models/MedicalRecord"
);

const {
  uploadToIPFS,
} = require(
  "../services/ipfsService"
);

const uploadMedicalRecord =
  async (req, res) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          error: "No file uploaded",
        });
      }

      console.log(
        "Uploading to IPFS..."
      );

      const ipfsHash =
        await uploadToIPFS(
          file.buffer,
          file.originalname
        );

      console.log(
        "IPFS SUCCESS:",
        ipfsHash
      );

      const record =
        await MedicalRecord.create({
          patientWallet:
            req.body.patientWallet,

          doctorWallet:
            req.body.doctorWallet,

          fileName:
            file.originalname,

          fileType:
            file.mimetype,

          ipfsHash,

          encrypted: false,
        });

      res.json({
        success: true,
        ipfsHash,
        record,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: err.message,
      });
    }
  };

module.exports = {
  uploadMedicalRecord,
};