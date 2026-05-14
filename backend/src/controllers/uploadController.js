const MedicalRecord = require(
  "../models/MedicalRecord"
);

const {
  uploadToIPFS,
} = require(
  "../services/ipfsService"
);

const contract = require(
  "../blockchain/contract"
);

exports.uploadMedicalRecord =
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

      // STEP 1 — Upload to IPFS
      const ipfsHash =
        await uploadToIPFS(
          file.buffer,
          file.originalname
        );

      console.log(
        "IPFS SUCCESS:",
        ipfsHash
      );

      // STEP 2 — Save on blockchain
      console.log(
        "Sending blockchain transaction..."
      );

      const tx =
        await contract.addRecord(
          ipfsHash
        );

      console.log(
        "Waiting for confirmation..."
      );

      const receipt =
        await tx.wait();

      console.log(
        "BLOCKCHAIN SUCCESS:",
        tx.hash
      );

      // STEP 3 — Save metadata in MongoDB
      const record =
        await MedicalRecord.create({
          patientWallet:
            tx.from,

          doctorWallet:
            req.body.doctorWallet,

          fileName:
            file.originalname,

          fileType:
            file.mimetype,

          ipfsHash,

          txHash: tx.hash,

          encrypted: false,
        });

      res.json({
        success: true,

        ipfsHash,

        txHash: tx.hash,

        record,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: err.message,
      });
    }
  };
  