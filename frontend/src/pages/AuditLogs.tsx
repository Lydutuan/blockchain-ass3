import { useState } from "react";

const PURPLE = "#6d28d9";
const PURPLE_DARK = "linear-gradient(135deg, rgb(84, 39, 124))";
const PURPLE_SOFT = "#f3e8ff";

type TxType = "upload" | "grant" | "revoke" | "verify";

interface LogEntry {
  id: string;
  type: TxType;
  wallet: string;
  recordId: string;
  timestamp: string;
  status: "success" | "pending" | "failed";
  txHash: string;
}

const LOGS: LogEntry[] = [
  { id: "1", type: "upload", wallet: "0x9f1A...3bC2", recordId: "REC-0x4F2A", timestamp: "2025-05-07 09:14", status: "success", txHash: "0xa1b2c3d4e5f6" },
  { id: "2", type: "grant",  wallet: "0x9f1A...3bC2", recordId: "REC-0x4F2A", timestamp: "2025-05-06 17:22", status: "success", txHash: "0xb2c3d4e5f6a7" },
  { id: "3", type: "verify", wallet: "0x3d2F...8aB1", recordId: "MED-VN-0017", timestamp: "2025-05-06 10:05", status: "success", txHash: "0xc3d4e5f6a7b8" },
  { id: "4", type: "revoke", wallet: "0x9f1A...3bC2", recordId: "REC-0x8C1D", timestamp: "2025-05-04 08:30", status: "success", txHash: "0xd4e5f6a7b8c9" },
  { id: "5", type: "upload", wallet: "0x9f1A...3bC2", recordId: "REC-0x6A3C", timestamp: "2025-05-04 16:45", status: "pending", txHash: "0xe5f6a7b8c9d0" },
  { id: "6", type: "verify", wallet: "0x7c4E...2dF9", recordId: "MED-VN-0042", timestamp: "2025-05-03 12:11", status: "success", txHash: "0xf6a7b8c9d0e1" },
  { id: "7", type: "grant",  wallet: "0x9f1A...3bC2", recordId: "REC-0x2E9B", timestamp: "2025-05-02 14:50", status: "failed",  txHash: "0xa7b8c9d0e1f2" },
];

const STATS = [
  { label: "Total Transactions",  value: "58", icon: "⛓️" },
  { label: "Records Uploaded",    value: "24", icon: "⬆" },
  { label: "Access Grants",       value: "12", icon: "🔑" },
  { label: "Revoked Permissions", value: "5",  icon: "🚫" },
];

const TYPE_LABEL: Record<TxType, string> = {
  upload: "Upload Record",
  grant: "Grant Access",
  revoke: "Revoke Access",
  verify: "Medicine Verification",
};

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: "#f8f8f8", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 8px rgba(55, 16, 63, 0.07)", border: "1px solid #593080", ...style }}>
    {children}
  </div>
);

const StatusBadge = ({ s }: { s: LogEntry["status"] }) => {
  const map = {
    success: { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Success" },
    pending: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Pending" },
    failed:  { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: "Failed" },
  }[s];
  return <span style={{ background: map.bg, color: map.color, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{map.label}</span>;
};

const TypeChip = ({ t }: { t: TxType }) => {
  const colors: Record<TxType, string> = { upload: "#3b82f6", grant: "#10b981", revoke: "#ef4444", verify: "#8b5cf6" };
  return (
    <span style={{ background: `${colors[t]}1a`, color: colors[t], borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      {TYPE_LABEL[t]}
    </span>
  );
};

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | TxType>("all");

  const filtered = LOGS.filter((l) => {
    const matchSearch = !search ||
      l.wallet.toLowerCase().includes(search.toLowerCase()) ||
      l.recordId.toLowerCase().includes(search.toLowerCase()) ||
      l.txHash.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || l.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#492a5a", margin: 0 }}>Audit Logs</h1>
        <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 17 }}>
          Immutable blockchain activity records for healthcare data access and transactions.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
        {STATS.map((s) => (
          <Card key={s.label} style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#492a5a" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "#424c5c", marginTop: 2 }}>{s.label}</div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: PURPLE_SOFT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {s.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Blockchain status */}
      <Card style={{ marginBottom: 24, background: PURPLE_DARK, color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#ddd6fe", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Network</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Polygon Amoy</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#ddd6fe", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Latest Block</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace" }}>#18,394,221</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#ddd6fe", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Gas Price</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>31 Gwei</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#ddd6fe", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Smart Contract</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Active</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters + Table */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 750, margin: 0, color: "#3f234d" }}>Activity Log</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search wallet, record, hash…"
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", width: 240, color: "#1e293b" }}
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff", color: "#1e293b", cursor: "pointer" }}
            >
              <option value="all">All Events</option>
              <option value="upload">Uploads</option>
              <option value="grant">Access Events</option>
              <option value="revoke">Revocations</option>
              <option value="verify">Verification</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Transaction Type", "Wallet Address", "Record ID", "Tx Hash", "Timestamp", "Status"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={l.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 12px" }}><TypeChip t={l.type} /></td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", color: PURPLE, fontWeight: 600 }}>{l.wallet}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 500 }}>{l.recordId}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, background: PURPLE_SOFT, color: PURPLE_DARK, padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>
                      {l.txHash}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#64748b", whiteSpace: "nowrap" }}>{l.timestamp}</td>
                  <td style={{ padding: "10px 12px" }}><StatusBadge s={l.status} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>No transactions match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>


    </>
  );
}