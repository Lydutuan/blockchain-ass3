require("dotenv").config();

require("./src/listeners/medicalListener");
// Ensure Node uses reachable DNS servers for SRV lookups (fixes querySrv ECONNREFUSED)
const dns = require('dns');
try {
  const envServers = process.env.DNS_SERVERS;
  if (envServers) {
    const list = envServers.split(",").map(s => s.trim()).filter(Boolean);
    if (list.length) dns.setServers(list);
  } else {
    // fall back to public DNS which correctly supports SRV
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }
  console.log('DNS servers for Node resolver:', dns.getServers());
} catch (e) {
  console.warn('Could not set DNS servers:', e && e.message);
}
const mongoose = require("mongoose");
const app = require("./src/app");
const MedicineVerification = require("./src/models/MedicineVerification");
const AuditLog = require("./src/models/AuditLog");

const PORT = process.env.PORT || 5000;

const sampleMedicineData = [
  {
    batchId: "med-1001",
    recordId: 1,
    medicineName: "Aspirin 500mg",
    qrCode: "QR-1001",
    medicineHash: "0x6f1a8aa5a9c3ea2c8208dc5a70b761b07a137a4d37f7e9a3e0b1a9e73fbb01f7",
    ipfsCid: "QmYx12345Aspirin",
    status: "authentic",
    manufacturer: "MediPharma Ltd.",
    manufacturerAddr: "0x1111111111111111111111111111111111111111",
    expiryDate: "2026-12-31",
    verifiedBy: "0x0000000000000000000000000000000000000001",
    metadata: { lot: "A1001" },
  },
  {
    batchId: "med-1002",
    recordId: 2,
    medicineName: "Paracetamol 650mg",
    qrCode: "QR-1002",
    medicineHash: "0xa3f2b2ac4c6e5d0e9f8b3a2d1c4e5f6b7a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
    ipfsCid: "QmYx12345Para",
    status: "authentic",
    manufacturer: "HealthCore Inc.",
    manufacturerAddr: "0x2222222222222222222222222222222222222222",
    expiryDate: "2027-05-15",
    verifiedBy: "0x0000000000000000000000000000000000000002",
    metadata: { lot: "P2002" },
  },
  {
    batchId: "med-1003",
    recordId: 3,
    medicineName: "Amoxicillin 250mg",
    qrCode: "QR-1003",
    medicineHash: "0x8e3f2b4d6c7a5f9e4b3a2c1d0e9f8b7a6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f",
    ipfsCid: "QmYx12345Amox",
    status: "authentic",
    manufacturer: "BioMedix Labs",
    manufacturerAddr: "0x3333333333333333333333333333333333333333",
    expiryDate: "2026-08-10",
    verifiedBy: "0x0000000000000000000000000000000000000003",
    metadata: { lot: "A3003" },
  },
  {
    batchId: "med-1004",
    recordId: 4,
    medicineName: "Ibuprofen 400mg",
    qrCode: "QR-1004",
    medicineHash: "0x5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4",
    ipfsCid: "QmYx12345Ibu",
    status: "authentic",
    manufacturer: "Wellness Labs",
    manufacturerAddr: "0x4444444444444444444444444444444444444444",
    expiryDate: "2027-03-22",
    verifiedBy: "0x0000000000000000000000000000000000000004",
    metadata: { lot: "I4004" },
  },
  {
    batchId: "med-1005",
    recordId: 5,
    medicineName: "Metformin 500mg",
    qrCode: "QR-1005",
    medicineHash: "0x9a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8b7",
    ipfsCid: "QmYx12345Met",
    status: "authentic",
    manufacturer: "PharmaPlus Co.",
    manufacturerAddr: "0x5555555555555555555555555555555555555555",
    expiryDate: "2026-10-05",
    verifiedBy: "0x0000000000000000000000000000000000000005",
    metadata: { lot: "M5005" },
  },
  {
    batchId: "med-1006",
    recordId: 6,
    medicineName: "Omeprazole 20mg",
    qrCode: "QR-1006",
    medicineHash: "0xb5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c",
    ipfsCid: "QmYx12345Ome",
    status: "authentic",
    manufacturer: "Digestix Pharma",
    manufacturerAddr: "0x6666666666666666666666666666666666666666",
    expiryDate: "2027-01-18",
    verifiedBy: "0x0000000000000000000000000000000000000006",
    metadata: { lot: "O6006" },
  },
  {
    batchId: "med-1007",
    recordId: 7,
    medicineName: "Lisinopril 10mg",
    qrCode: "QR-1007",
    medicineHash: "0xc6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
    ipfsCid: "QmYx12345Lis",
    status: "authentic",
    manufacturer: "CardioGenix",
    manufacturerAddr: "0x7777777777777777777777777777777777777777",
    expiryDate: "2027-07-30",
    verifiedBy: "0x0000000000000000000000000000000000000007",
    metadata: { lot: "L7007" },
  },
  {
    batchId: "med-1008",
    recordId: 8,
    medicineName: "Atorvastatin 20mg",
    qrCode: "QR-1008",
    medicineHash: "0xd7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e",
    ipfsCid: "QmYx12345Ato",
    status: "authentic",
    manufacturer: "CardioPharm Solutions",
    manufacturerAddr: "0x8888888888888888888888888888888888888888",
    expiryDate: "2026-11-12",
    verifiedBy: "0x0000000000000000000000000000000000000008",
    metadata: { lot: "A8008" },
  },
  {
    batchId: "med-1009",
    recordId: 9,
    medicineName: "Citalopram 20mg",
    qrCode: "QR-1009",
    medicineHash: "0xe8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
    ipfsCid: "QmYx12345Cit",
    status: "authentic",
    manufacturer: "NeuroHealth Labs",
    manufacturerAddr: "0x9999999999999999999999999999999999999999",
    expiryDate: "2027-02-14",
    verifiedBy: "0x0000000000000000000000000000000000000009",
    metadata: { lot: "C9009" },
  },
  {
    batchId: "med-1010",
    recordId: 10,
    medicineName: "Simvastatin 40mg",
    qrCode: "QR-1010",
    medicineHash: "0xf9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
    ipfsCid: "QmYx12345Sim",
    status: "authentic",
    manufacturer: "LipidCare Pharmaceuticals",
    manufacturerAddr: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    expiryDate: "2026-09-01",
    verifiedBy: "0x000000000000000000000000000000000000000a",
    metadata: { lot: "S1010" },
  },
];

const seedMedicineData = async () => {
  try {
    const existing = await MedicineVerification.countDocuments();
    if (existing > 0) {
      console.log(`✓ Medicine verification sample data already present (${existing} records)`);
      return;
    }

    await MedicineVerification.insertMany(sampleMedicineData);
    console.log("✓ Seeded 10 sample medicine verification records");

    const logItems = sampleMedicineData.map((item) => ({
      action: "MedicineVerified",
      performedBy: item.verifiedBy,
      txHash: null,
      ipfsHash: item.ipfsCid,
      recordId: item.recordId ? String(item.recordId) : null,
      metadata: { batchId: item.batchId, status: item.status },
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await AuditLog.insertMany(logItems);
    console.log("✓ Seeded corresponding MedicineVerified audit logs");
  } catch (err) {
    console.error("✗ Failed to seed medicine sample data", err.message || err);
  }
};

// Function to connect to MongoDB with retry logic
const connectDB = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
      console.log("✓ MongoDB Connected");
      await seedMedicineData();
    })
    .catch((err) => {
      console.error("✗ MongoDB connection failed:", err.message);
      console.log("Retrying in 5 seconds...");
      setTimeout(connectDB, 5000);
    });
};

// Start server immediately, MongoDB can connect in the background
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}`);
});

// Connect to MongoDB with retry
connectDB();