import { useState } from "react";

const PURPLE = "#6d28d9";
const PURPLE_DARK = "linear-gradient(135deg, rgb(84, 39, 124))";
const PURPLE_SOFT = "#f3e8ff";

type AuthStatus = "authentic" | "suspicious" | "expired" | "unknown" | null;

interface VerificationResult {
  medicineId: string;
  drugName: string;
  manufacturer: string;
  manufacturerAddr: string;
  batchId: string;
  amount: string;
  manufacturedDate: string;
  expiryDate: string;
  status: AuthStatus;
  ipfsCid: string;
  hash: string;
}

interface MedicineInventoryItem {
  batchId: string;
  medicineId: string;
  medicineName: string;
  manufacturer: string;
  manufacturerAddr: string;
  amount: string;
  status: AuthStatus;
  manufacturedDate: string;
  expiryDate: string;
  ipfsCid: string;
  medicineHash: string;
}

const MEDICINE_INVENTORY: MedicineInventoryItem[] = [
  {
    batchId: "MED-1001",
    medicineId: "MED-1001",
    medicineName: "Aspirin 500mg",
    manufacturer: "MediPharma Ltd.",
    manufacturerAddr: "0x1111111111111111111111111111111111111111",
    amount: "500 tablets",
    status: "authentic",
    manufacturedDate: "2024-04-10",
    expiryDate: "2026-12-31",
    ipfsCid: "QmYx12345Aspirin",
    medicineHash: "0x6f1a8aa5a9c3ea2c8208dc5a70b761b07a137a4d37f7e9a3e0b1a9e73fbb01f7",
  },
  {
    batchId: "MED-1002",
    medicineId: "MED-1002",
    medicineName: "Paracetamol 650mg",
    manufacturer: "HealthCore Inc.",
    manufacturerAddr: "0x2222222222222222222222222222222222222222",
    amount: "400 tablets",
    status: "authentic",
    manufacturedDate: "2024-05-18",
    expiryDate: "2027-05-15",
    ipfsCid: "QmYx12345Para",
    medicineHash: "0xa3f2b2ac4c6e5d0e9f8b3a2d1c4e5f6b7a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
  },
  {
    batchId: "MED-1003",
    medicineId: "MED-1003",
    medicineName: "Amoxicillin 250mg",
    manufacturer: "BioMedix Labs",
    manufacturerAddr: "0x3333333333333333333333333333333333333333",
    amount: "200 capsules",
    status: "authentic",
    manufacturedDate: "2024-03-22",
    expiryDate: "2026-08-10",
    ipfsCid: "QmYx12345Amox",
    medicineHash: "0x8e3f2b4d6c7a5f9e4b3a2c1d0e9f8b7a6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f",
  },
  {
    batchId: "MED-1004",
    medicineId: "MED-1004",
    medicineName: "Ibuprofen 400mg",
    manufacturer: "Wellness Labs",
    manufacturerAddr: "0x4444444444444444444444444444444444444444",
    amount: "300 tablets",
    status: "authentic",
    manufacturedDate: "2024-01-12",
    expiryDate: "2027-03-22",
    ipfsCid: "QmYx12345Ibu",
    medicineHash: "0x5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4",
  },
  {
    batchId: "MED-1005",
    medicineId: "MED-1005",
    medicineName: "Metformin 500mg",
    manufacturer: "PharmaPlus Co.",
    manufacturerAddr: "0x5555555555555555555555555555555555555555",
    amount: "250 tablets",
    status: "authentic",
    manufacturedDate: "2024-02-03",
    expiryDate: "2026-10-05",
    ipfsCid: "QmYx12345Met",
    medicineHash: "0x9a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8b7",
  },
  {
    batchId: "MED-1006",
    medicineId: "MED-1006",
    medicineName: "Omeprazole 20mg",
    manufacturer: "Digestix Pharma",
    manufacturerAddr: "0x6666666666666666666666666666666666666666",
    amount: "180 capsules",
    status: "authentic",
    manufacturedDate: "2024-06-10",
    expiryDate: "2027-01-18",
    ipfsCid: "QmYx12345Ome",
    medicineHash: "0xb5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c",
  },
  {
    batchId: "MED-1007",
    medicineId: "MED-1007",
    medicineName: "Lisinopril 10mg",
    manufacturer: "CardioGenix",
    manufacturerAddr: "0x7777777777777777777777777777777777777777",
    amount: "150 tablets",
    status: "authentic",
    manufacturedDate: "2024-03-30",
    expiryDate: "2027-07-30",
    ipfsCid: "QmYx12345Lis",
    medicineHash: "0xc6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
  },
  {
    batchId: "MED-1008",
    medicineId: "MED-1008",
    medicineName: "Atorvastatin 20mg",
    manufacturer: "CardioPharm Solutions",
    manufacturerAddr: "0x8888888888888888888888888888888888888888",
    amount: "220 tablets",
    status: "authentic",
    manufacturedDate: "2024-05-05",
    expiryDate: "2026-11-12",
    ipfsCid: "QmYx12345Ato",
    medicineHash: "0xd7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e",
  },
  {
    batchId: "MED-1009",
    medicineId: "MED-1009",
    medicineName: "Citalopram 20mg",
    manufacturer: "NeuroHealth Labs",
    manufacturerAddr: "0x9999999999999999999999999999999999999999",
    amount: "120 tablets",
    status: "suspicious",
    manufacturedDate: "2024-01-25",
    expiryDate: "2027-02-14",
    ipfsCid: "QmYx12345Cit",
    medicineHash: "0xe8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
  },
  {
    batchId: "MED-1010",
    medicineId: "MED-1010",
    medicineName: "Simvastatin 40mg",
    manufacturer: "LipidCare Pharmaceuticals",
    manufacturerAddr: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    amount: "100 tablets",
    status: "expired",
    manufacturedDate: "2023-11-15",
    expiryDate: "2026-09-01",
    ipfsCid: "QmYx12345Sim",
    medicineHash: "0xf9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
  },
];

interface TimelineStep {
  step: string;
  date: string;
  actor: string;
  hash: string;
}

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", border: "1px solid #593c6d", ...style }}>
    {children}
  </div>
);

const AuthBadge = ({ s }: { s: AuthStatus }) => {
  if (!s || s === "unknown") return null;
  const map = {
    authentic:  { bg: "rgba(8, 182, 124, 0.15)", color: "#1edb9c", label: "Authentic" },
    suspicious: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Suspicious" },
    expired:    { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: "Expired" },
  } as const;
  const value = map[s as Exclude<AuthStatus, "unknown" | null>];
  if (!value) return null;
  return <span style={{ background: value.bg, color: value.color, borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 700 }}>{value.label}</span>;
};

const Btn = ({ children, onClick, variant = "primary", style = {}, disabled }: any) => {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: PURPLE, color: "#fff", border: "none", fontWeight: 700 },
    outline: { background: "transparent", color: PURPLE, border: `1px solid ${PURPLE}` },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...styles[variant], borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "opacity .2s", ...style }}
    >
      {children}
    </button>
  );
};

const shortAddr = (a: string) => (a && a.length > 10 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a);

export default function MedicineVerification() {
  const [batchId, setBatchId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string>("");

  const handleVerify = async () => {
    if (!batchId.trim()) return;
    setVerifying(true);
    setResult(null);
    setTimeline([]);
    setError(null);
    setNotice(null);
    setTxHash("");

    try {
      const normalizedBatch = batchId.trim().toUpperCase();
      const item = MEDICINE_INVENTORY.find((entry) => entry.batchId.toUpperCase() === normalizedBatch);

      if (!item) {
        throw new Error(`Batch ID ${batchId.trim()} not found in local inventory.`);
      }

      setNotice(`✓ Loaded medicine data for batch ${item.batchId} from local inventory`);
      setResult({
        medicineId: item.medicineId,
        drugName: item.medicineName,
        manufacturer: item.manufacturer,
        manufacturerAddr: item.manufacturerAddr,
        batchId: item.batchId,
        amount: item.amount,
        manufacturedDate: item.manufacturedDate,
        expiryDate: item.expiryDate,
        status: item.status,
        ipfsCid: item.ipfsCid,
        hash: item.medicineHash,
      });
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? "Batch not found");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#371442", margin: 0 }}>Medicine Verification</h1>
        <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 17 }}>
          Verify pharmaceutical authenticity through blockchain-backed drug traceability.
        </p>
      </div>

      {(notice || error) && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: error ? "#fef2f2" : "#ecfdf5", color: error ? "#991b1b" : "#065f46", fontSize: 13, fontWeight: 500 }}>
          {error ?? notice}
        </div>
      )}

      {/* Verification Input */}
      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 16px", color: "#361353" }}>Verify a Medicine</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Medicine ID / Batch Number</label>
            <input
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}

              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", color: "#1e293b", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              
              <Btn variant="primary" onClick={handleVerify} disabled={verifying || !batchId.trim()}>
                {verifying ? "Verifying…" : "Verify"}
              </Btn>
            </div>
          </div>

          
        </div>
      </Card>

      {/* Result */}
      {result && (
        <Card style={{ marginBottom: 24, border: `3px solid ${result.status === "authentic" ? "#08a571" : result.status === "suspicious" ? "#f59e0b" : "#ef4444"}33` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <h2 style={{ fontSize: 21, fontWeight: 700, margin: 0 , color: "#3f2157"}}>Verification Result</h2>
            <AuthBadge s={result.status} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
            {[
              ["Medicine ID", result.medicineId],
              ["Manufacturer", result.manufacturer || "—"],
              ["Manufacturer Wallet", shortAddr(result.manufacturerAddr)],
              ["Batch Number", result.batchId || "—"],
              ["Amount", result.amount || "—"],
              ["Manufactured", result.manufacturedDate],
              ["Expiry Date", result.expiryDate],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginTop: 4, wordBreak: "break-all" }}>{v}</div>
              </div>
            ))}
          </div>

          {(txHash || result.ipfsCid) && (
            <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 10, background: PURPLE_SOFT, border: `1px solid ${PURPLE}33` }}>
              <div style={{ fontSize: 11, color: PURPLE_DARK, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                {txHash ? "Verification Transaction Hash" : "IPFS CID"}
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: PURPLE_DARK, wordBreak: "break-all" }}>{txHash || result.ipfsCid}</div>
            </div>
          )}
        </Card>
      )}

      {/* Timeline */}
      {result && timeline.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 20px", color: "#3f2157" }}>Blockchain Traceability Timeline</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {timeline.map((t, i) => (
              <div key={`${t.step}-${i}`} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: PURPLE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
                    {i + 1}
                  </div>
                  {i < timeline.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 40, background: PURPLE_SOFT }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: 20 }}>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{t.step}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                    {t.date} · {t.actor}
                  </div>
                  <span style={{ display: "inline-block", marginTop: 6, fontFamily: "monospace", fontSize: 11, background: PURPLE_SOFT, color: PURPLE_DARK, padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                    {t.hash}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}