import { useState } from "react";

const PURPLE = "#6d28d9";
const PURPLE_DARK = "linear-gradient(135deg, rgb(84, 39, 124))";
const PURPLE_SOFT = "#f3e8ff";

type AuthStatus = "authentic" | "suspicious" | "expired" | null;

interface VerificationResult {
  drugName: string;
  manufacturer: string;
  batchId: string;
  manufacturedDate: string;
  expiryDate: string;
  status: AuthStatus;
  hash: string;
}

const MOCK_RESULT: VerificationResult = {
  drugName: "Paracetamol 500mg",
  manufacturer: "Hau Giang Pharmaceutical JSC",
  batchId: "MED-VN-0042",
  manufacturedDate: "2024-11-12",
  expiryDate: "2026-11-11",
  status: "authentic",
  hash: "0x7f3a9c2e8b1d4f6a0c5e9b2d8f1a4c7e3b6d9f2a",
};

const TIMELINE = [
  { step: "Manufactured",      date: "2024-11-12", actor: "Hau Giang Pharma",   hash: "0xa1b2...c3d4" },
  { step: "Distributed",       date: "2024-12-03", actor: "VN Distribution Co", hash: "0xb2c3...d4e5" },
  { step: "Pharmacy Verified", date: "2025-01-15", actor: "Pharmacy Hanoi #12", hash: "0xc3d4...e5f6" },
  { step: "Patient Verified",  date: "2025-05-09", actor: "0x9f1A...3bC2",      hash: "0xd4e5...f6a7" },
];

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", border: "1px solid #593c6d", ...style }}>
    {children}
  </div>
);

const AuthBadge = ({ s }: { s: AuthStatus }) => {
  if (!s) return null;
  const map = {
    authentic:  { bg: "rgba(8, 182, 124, 0.15)", color: "#1edb9c", label: "Authentic" },
    suspicious: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Suspicious" },
    expired:    { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: "Expired" },
  }[s];
  return <span style={{ background: map.bg, color: map.color, borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 700 }}>{map.label}</span>;
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

export default function MedicineVerification() {
  const [batchId, setBatchId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    if (!batchId.trim()) return;
    setVerifying(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1200));
    setResult(MOCK_RESULT);
    setVerifying(false);
  };

  const handleScan = () => {
    setBatchId("MED-VN-0042");
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#371442", margin: 0 }}>Medicine Verification</h1>
        <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 17 }}>
          Verify pharmaceutical authenticity through blockchain-backed drug traceability.
        </p>
      </div>

      {/* Verification Input */}
      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 16px", color: "#361353" }}>Verify a Medicine</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Batch ID</label>
            <input
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="e.g. MED-VN-0042"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", color: "#1e293b", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Btn variant="outline" onClick={handleScan}>Scan QR</Btn>
              <Btn variant="primary" onClick={handleVerify} disabled={verifying || !batchId.trim()}>
                {verifying ? "Verifying…" : "Verify"}
              </Btn>
            </div>
          </div>

          <div
            style={{
              border: `2px dashed ${PURPLE}`,
              borderRadius: 12,
              background: PURPLE_SOFT,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 36 }}>📱</div>
            <div style={{ fontWeight: 700, color: PURPLE_DARK, marginTop: 8 }}>Upload QR Code</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>PNG, JPG, or scan with camera</div>
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
              ["Drug Name", result.drugName],
              ["Manufacturer", result.manufacturer],
              ["Batch ID", result.batchId],
              ["Manufactured", result.manufacturedDate],
              ["Expiry Date", result.expiryDate],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 10, background: PURPLE_SOFT, border: `1px solid ${PURPLE}33` }}>
            <div style={{ fontSize: 11, color: PURPLE_DARK, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Blockchain Verification Hash</div>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: PURPLE_DARK, wordBreak: "break-all" }}>{result.hash}</div>
          </div>
        </Card>
      )}

      {/* Timeline */}
      {result && (
        <Card style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 20px", color: "#3f2157" }}>Blockchain Traceability Timeline</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {TIMELINE.map((t, i) => (
              <div key={t.step} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: PURPLE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
                    {i + 1}
                  </div>
                  {i < TIMELINE.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 40, background: PURPLE_SOFT }} />}
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
