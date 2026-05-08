import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface MedicalRecord {
  id: string; cid: string; patient: string;
  uploadedAt: string; status: "verified" | "pending" | "flagged"; type: string;
}
interface Permission {
  id: string; doctor: string; name: string;
  granted: string; expiry: string; access: "active" | "expired" | "revoked";
}
interface AuditLog {
  id: string; action: string; actor: string;
  target: string; timestamp: string; type: "upload" | "grant" | "revoke" | "view";
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const RECORDS: MedicalRecord[] = [
  { id: "REC-0x4F2A", cid: "QmX7kP9mNvR3wE2cL8sJ6tY1aB5dF0gH4iK", patient: "Nguyễn Văn An", uploadedAt: "2025-05-07 09:14", status: "verified", type: "Blood Test" },
  { id: "REC-0x8C1D", cid: "QmT3nM6rK0pA9wX4vL7sQ2dE5hG8jI1mN", patient: "Trần Thị Bích", uploadedAt: "2025-05-06 14:32", status: "verified", type: "X-Ray Report" },
  { id: "REC-0x2E9B", cid: "QmP5kL8nV2xR6cW9yT3jA7bD4eF1gH0iJ", patient: "Lê Minh Khoa", uploadedAt: "2025-05-05 11:08", status: "pending", type: "MRI Scan" },
  { id: "REC-0x6A3C", cid: "QmR9mN4kP7wX2vL5sQ8dE3hG6jI0aB1cD", patient: "Phạm Thị Lan", uploadedAt: "2025-05-04 16:45", status: "flagged", type: "Prescription" },
];

const PERMISSIONS: Permission[] = [
  { id: "P-001", doctor: "0x3d2F...8aB1", name: "BS. Nguyễn Hữu Phúc", granted: "2025-04-20", expiry: "2025-07-20", access: "active" },
  { id: "P-002", doctor: "0x7c4E...2dF9", name: "BS. Trần Thị Mai", granted: "2025-03-15", expiry: "2025-06-15", access: "active" },
  { id: "P-003", doctor: "0x1a8B...5eC3", name: "BS. Lê Quang Huy", granted: "2025-01-10", expiry: "2025-04-10", access: "expired" },
];

const LOGS: AuditLog[] = [
  { id: "L-001", action: "Record Uploaded", actor: "0x9f1A...3bC2", target: "REC-0x4F2A", timestamp: "2025-05-07 09:14", type: "upload" },
  { id: "L-002", action: "Access Granted", actor: "0x9f1A...3bC2", target: "BS. Nguyễn Hữu Phúc", timestamp: "2025-05-06 17:22", type: "grant" },
  { id: "L-003", action: "Record Viewed", actor: "0x3d2F...8aB1", target: "REC-0x8C1D", timestamp: "2025-05-06 10:05", type: "view" },
  { id: "L-004", action: "Access Revoked", actor: "0x9f1A...3bC2", target: "BS. Lê Quang Huy", timestamp: "2025-05-04 08:30", type: "revoke" },
  { id: "L-005", action: "Record Uploaded", actor: "0x9f1A...3bC2", target: "REC-0x6A3C", timestamp: "2025-05-04 16:45", type: "upload" },
];

const STATS = [
  { label: "Total Records", value: "24", icon: "🗂️", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  { label: "Active Permissions", value: "7", icon: "🔐", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  { label: "IPFS Pinned", value: "24", icon: "📌", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  { label: "Txns On-Chain", value: "58", icon: "⛓️", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
];

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "upload", label: "Upload Record", icon: "⬆" },
  { id: "access", label: "Access Control", icon: "🔑" },
  { id: "audit", label: "Audit Logs", icon: "📋" },
  { id: "medicine", label: "Medicine Verify", icon: "💊" },
];

// ── Sub-components ─────────────────────────────────────────────────────────
const Badge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    verified: { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Verified" },
    pending:  { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Pending" },
    flagged:  { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: "Flagged" },
    active:   { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Active" },
    expired:  { bg: "rgba(107,114,128,0.15)",color: "#9ca3af", label: "Expired" },
    revoked:  { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: "Revoked" },
    upload:   { bg: "rgba(59,130,246,0.15)", color: "#3b82f6", label: "Upload" },
    grant:    { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Grant" },
    revoke:   { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: "Revoke" },
    view:     { bg: "rgba(139,92,246,0.15)", color: "#8b5cf6", label: "View" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
};

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9", ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", style = {} }: any) => {
  const styles: Record<string, React.CSSProperties> = {
    primary:  { background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", border: "none" },
    success:  { background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none" },
    danger:   { background: "transparent", color: "#ef4444", border: "1px solid #ef4444" },
    ghost:    { background: "transparent", color: "#3b82f6", border: "1px solid #e2e8f0" },
    outline:  { background: "transparent", color: "#6366f1", border: "1px solid #6366f1" },
  };
  return (
    <button onClick={onClick} style={{ ...styles[variant], borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "opacity .2s", ...style }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
      {children}
    </button>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function MediLedgerDashboard() {
  const [active, setActive] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [perms, setPerms] = useState(PERMISSIONS);
  const [sideOpen, setSideOpen] = useState(false);

  const filtered = RECORDS.filter(r =>
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.patient.toLowerCase().includes(search.toLowerCase()) ||
    r.type.toLowerCase().includes(search.toLowerCase())
  );

  const revoke = (id: string) =>
    setPerms(p => p.map(x => x.id === id ? { ...x, access: "revoked" as const } : x));

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", background: "#f8fafc", color: "#1e293b" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 240, background: "linear-gradient(180deg,#0f172a 0%,#1e1b4b 100%)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚕</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, lineHeight: 1 }}>MediLedger</div>
              <div style={{ color: "#6366f1", fontSize: 11, fontWeight: 600 }}>VN · Polygon</div>
            </div>
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginTop: 14 }} />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 12px" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setActive(n.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 4, transition: "all .2s",
                background: active === n.id ? "rgba(99,102,241,0.25)" : "transparent",
                color: active === n.id ? "#a5b4fc" : "#94a3b8", fontWeight: active === n.id ? 600 : 400, fontSize: 14 }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>

        {/* Wallet pill */}
        <div style={{ padding: "16px 16px 24px" }}>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
              <span style={{ color: "#10b981", fontSize: 11, fontWeight: 600 }}>Connected</span>
            </div>
            <div style={{ color: "#e2e8f0", fontSize: 12, fontFamily: "monospace" }}>0x9f1A...3bC2</div>
            <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>Polygon Amoy Testnet</div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto", maxWidth: "calc(100vw - 240px)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>MediLedger VN Dashboard</h1>
            <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 14 }}>Decentralized Electronic Medical Records on Polygon · IPFS Storage</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost">🔔 Alerts</Btn>
            <Btn variant="primary">+ Upload Record</Btn>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16, marginBottom: 24 }}>
          {STATS.map(s => (
            <Card key={s.label} style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{s.icon}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Wallet Card */}
        <Card style={{ marginBottom: 24, background: "linear-gradient(135deg,#1e1b4b,#312e81)", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Connected Wallet</div>
              <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700 }}>0x9f1A8c3E...b7D2F3bC2</div>
              <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "#c7d2fe" }}>🌐 Polygon Amoy Testnet</span>
                <span style={{ fontSize: 13, color: "#c7d2fe" }}>💜 Chain ID: 80002</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 8px #10b981" }} />
                <span style={{ color: "#10b981", fontWeight: 700, fontSize: 14 }}>CONNECTED</span>
              </div>
              <div style={{ color: "#6366f1", fontSize: 12, marginTop: 4 }}>0 MATIC balance</div>
              <Btn variant="ghost" style={{ marginTop: 8, color: "#a5b4fc", borderColor: "rgba(165,180,252,0.3)", fontSize: 12 }}>Disconnect</Btn>
            </div>
          </div>
        </Card>

        {/* Records */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>📁 Medical Records</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records…"
                style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", width: 200, color: "#1e293b" }} />
              <Btn variant="outline" style={{ fontSize: 12 }}>⬇ Export</Btn>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Record ID","IPFS CID","Patient","Type","Uploaded","Status","Action"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa")}>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#6366f1", fontWeight: 600 }}>{r.id}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 11, color: "#64748b", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.cid}>{r.cid.slice(0, 18)}…</td>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>{r.patient}</td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{r.type}</td>
                    <td style={{ padding: "10px 12px", color: "#64748b", whiteSpace: "nowrap" }}>{r.uploadedAt}</td>
                    <td style={{ padding: "10px 12px" }}><Badge status={r.status} /></td>
                    <td style={{ padding: "10px 12px" }}><Btn variant="ghost" style={{ fontSize: 12, padding: "4px 10px" }}>👁 View</Btn></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Permissions + Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, marginBottom: 24, alignItems: "start" }}>
          {/* Permissions */}
          <Card>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>🔐 Active Permissions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {perms.map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f1f5f9", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: "#6366f1" }}>{p.doctor}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Granted: {p.granted} · Expires: {p.expiry}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge status={p.access} />
                    {p.access === "active" && <Btn variant="danger" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => revoke(p.id)}>Revoke</Btn>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>⚡ Quick Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "⬆ Upload New Record", v: "primary" },
                { label: "🔑 Grant Access", v: "success" },
                { label: "📋 View Audit Logs", v: "outline" },
                { label: "💊 Verify Medicine", v: "ghost" },
              ].map(a => (
                <Btn key={a.label} variant={a.v} style={{ width: "100%", padding: "10px 16px", textAlign: "left", fontSize: 13 }}>{a.label}</Btn>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 10, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)" }}>
              <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, marginBottom: 4 }}>⛓ Network Status</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b" }}><span>Gas Price</span><span style={{ color: "#10b981", fontWeight: 600 }}>31 Gwei</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginTop: 4 }}><span>Block Height</span><span style={{ fontWeight: 600 }}>#18,394,221</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginTop: 4 }}><span>TPS</span><span style={{ fontWeight: 600 }}>7,200</span></div>
            </div>
          </Card>
        </div>

        {/* Audit Logs */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>📋 Recent Audit Logs</h2>
            <Btn variant="ghost" style={{ fontSize: 12 }}>View All →</Btn>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {LOGS.map((l, i) => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: i < LOGS.length - 1 ? "1px solid #f1f5f9" : "none", flexWrap: "wrap" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: l.type === "upload" ? "rgba(59,130,246,0.1)" : l.type === "grant" ? "rgba(16,185,129,0.1)" : l.type === "revoke" ? "rgba(239,68,68,0.1)" : "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
                  {l.type === "upload" ? "⬆" : l.type === "grant" ? "✅" : l.type === "revoke" ? "🚫" : "👁"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{l.action}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Actor: <span style={{ fontFamily: "monospace", color: "#6366f1" }}>{l.actor}</span> · Target: <span style={{ fontWeight: 500 }}>{l.target}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Badge status={l.type} />
                  <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>{l.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 28, color: "#94a3b8", fontSize: 12 }}>
          MediLedger VN · Built on Polygon · IPFS Powered · 
          <span style={{ color: "#6366f1", fontWeight: 600 }}> v1.0.0-alpha</span>
        </div>
      </main>
    </div>
  );
}