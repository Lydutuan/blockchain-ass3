import { useState } from "react";
import { getReadContract, queryFilterChunks } from "../blockchain/contract";

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
  manufacturedDate: string;
  expiryDate: string;
  status: AuthStatus;
  ipfsCid: string;
  hash: string;
}

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
const shortHash = (h: string) => (h && h.length > 14 ? `${h.slice(0, 10)}...${h.slice(-6)}` : h);
const fmtDate = (ts: bigint | number) => {
  const n = Number(ts);
  if (!n) return "—";
  return new Date(n * 1000).toISOString().slice(0, 10);
};
const fmtTime = (ts: number) => {
  const d = new Date(ts * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function MedicineVerification() {
  const [batchId, setBatchId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string>("");
  const [connectedWallet, setConnectedWallet] = useState<string>("");

  const handleVerify = async () => {
    if (!batchId.trim()) return;
    setVerifying(true);
    setResult(null);
    setTimeline([]);
    setError(null);
    setNotice(null);
    setTxHash("");

    try {
      let wallet = connectedWallet;
      if (!wallet && typeof window !== "undefined" && (window as any).ethereum) {
        const accounts: string[] = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        wallet = accounts?.[0] || "";
        setConnectedWallet(wallet);
      }

      const apiUrl = `${(import.meta as any).env.VITE_API_URL || ""}/api/medicine/verify?batchId=${encodeURIComponent(batchId)}&wallet=${encodeURIComponent(wallet || "unknown")}`;
      const dbResponse = await fetch(apiUrl);
      const dbBody = await dbResponse.json();

      if (dbResponse.ok && dbBody.success && dbBody.record) {
        const record = dbBody.record;
        const normalizedStatus = (record.status || "unknown") as AuthStatus;

        setNotice(`✓ Loaded medicine data for batch ${record.batchId} from database`);
        setResult({
          medicineId: record.recordId ? `REC-${record.recordId}` : record.batchId,
          drugName: record.medicineName || record.batchId,
          manufacturer: record.manufacturer || "MediLedger Network",
          manufacturerAddr: record.manufacturerAddr || "",
          batchId: record.batchId,
          manufacturedDate: record.createdAt ? new Date(record.createdAt).toISOString().slice(0, 10) : "—",
          expiryDate: record.expiryDate || "—",
          status: normalizedStatus,
          ipfsCid: record.ipfsCid || "",
          hash: record.medicineHash || record.ipfsCid || "",
        });

        const steps: TimelineStep[] = [];
        if (record.recordId) {
          try {
            const readContract = await getReadContract();
            const id = BigInt(record.recordId);
            const provider = readContract.runner?.provider;
            if (provider) {
              const current = await provider.getBlockNumber();
              const fromBlock = Math.max(0, current - 5000);
              const [created, granted, revoked] = await Promise.all([
                queryFilterChunks(readContract, readContract.filters.RecordCreated(id), fromBlock, current).catch(() => []),
                queryFilterChunks(readContract, readContract.filters.AccessGranted(id), fromBlock, current).catch(() => []),
                queryFilterChunks(readContract, readContract.filters.AccessRevoked(id), fromBlock, current).catch(() => []),
              ]);
              for (const e of created as any[]) {
                steps.push({
                  step: "Record Created",
                  date: fmtTime(Number(e.args?.timestamp ?? 0n)),
                  actor: shortAddr(e.args?.owner ?? ""),
                  hash: shortHash(e.transactionHash),
                });
              }
              for (const e of granted as any[]) {
                steps.push({
                  step: "Access Granted",
                  date: fmtTime(Number(e.args?.timestamp ?? 0n)),
                  actor: shortAddr(e.args?.grantedTo ?? ""),
                  hash: shortHash(e.transactionHash),
                });
              }
              for (const e of revoked as any[]) {
                steps.push({
                  step: "Access Revoked",
                  date: fmtTime(Number(e.args?.timestamp ?? 0n)),
                  actor: shortAddr(e.args?.revokedFrom ?? ""),
                  hash: shortHash(e.transactionHash),
                });
              }
              steps.sort((a, b) => a.date.localeCompare(b.date));
            }
          } catch { /* ignore timeline failure */ }
        }
        setTimeline(steps);
        return;
      }

      if (!dbResponse.ok) {
        throw new Error(dbBody.error || "No database record found for that batch ID");
      }

      // Fallback: attempt on-chain verification if no DB record exists
      const numericId = batchId.replace(/\D/g, "");
      if (!numericId) throw new Error("Enter a valid batch id or existing record id");
      const id = BigInt(numericId);

      const readContract = await getReadContract();
      const r: any = await readContract.records(id);
      const recordId: bigint = r.recordId ?? r[0];
      const owner: string = r.owner ?? r[1];
      const ipfsCid: string = r.ipfsCid ?? r[2];
      const createdAt: bigint = r.createdAt ?? r[3];
      const exists: boolean = r.exists ?? r[4];

      if (!exists || Number(recordId) === 0) {
        throw new Error(`Record #${numericId} does not exist on-chain.`);
      }

      setNotice(`✓ No DB entry found. Showing on-chain data for Record #${numericId}`);
      const status: AuthStatus = "authentic";

      const steps: TimelineStep[] = [];
      try {
        const provider = readContract.runner?.provider;
        if (provider) {
          const current = await provider.getBlockNumber();
          const fromBlock = Math.max(0, current - 5000);
          const [created, granted, revoked] = await Promise.all([
            queryFilterChunks(readContract, readContract.filters.RecordCreated(id), fromBlock, current).catch(() => []),
            queryFilterChunks(readContract, readContract.filters.AccessGranted(id), fromBlock, current).catch(() => []),
            queryFilterChunks(readContract, readContract.filters.AccessRevoked(id), fromBlock, current).catch(() => []),
          ]);
          for (const e of created as any[]) {
            steps.push({
              step: "Record Created",
              date: fmtTime(Number(e.args?.timestamp ?? createdAt)),
              actor: shortAddr(e.args?.owner ?? owner),
              hash: shortHash(e.transactionHash),
            });
          }
          for (const e of granted as any[]) {
            steps.push({
              step: "Access Granted",
              date: fmtTime(Number(e.args?.timestamp ?? 0n)),
              actor: shortAddr(e.args?.grantedTo ?? ""),
              hash: shortHash(e.transactionHash),
            });
          }
          for (const e of revoked as any[]) {
            steps.push({
              step: "Access Revoked",
              date: fmtTime(Number(e.args?.timestamp ?? 0n)),
              actor: shortAddr(e.args?.revokedFrom ?? ""),
              hash: shortHash(e.transactionHash),
            });
          }
          steps.sort((a, b) => a.date.localeCompare(b.date));
        }
      } catch { /* ignore timeline failure */ }

      setTimeline(steps);
      setResult({
        medicineId: `REC-${recordId.toString()}`,
        drugName: `Record #${recordId.toString()}`,
        manufacturer: "MediLedger Network",
        manufacturerAddr: owner,
        batchId: ipfsCid.slice(0, 12),
        manufacturedDate: fmtDate(createdAt),
        expiryDate: "—",
        status,
        ipfsCid,
        hash: ipfsCid,
      });
    } catch (e: any) {
      setError(e?.shortMessage ?? e?.message ?? "Record not found");
    } finally {
      setVerifying(false);
    }
  };

  const handleScan = () => {
    setBatchId("1");
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
              ["Medicine ID", result.medicineId],
              ["Manufacturer", result.manufacturer || "—"],
              ["Manufacturer Wallet", shortAddr(result.manufacturerAddr)],
              ["Batch Number", result.batchId || "—"],
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