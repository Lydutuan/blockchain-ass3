import { useState } from "react";

const PURPLE = "#6d28d9";
const PURPLE_DARK = "linear-gradient(135deg, rgb(84, 39, 124))";
const PURPLE_SOFT = "#f3e8ff";

type AccessStatus = "active" | "expired" | "revoked";

interface Permission {
  id: string;
  provider: string;
  recordId: string;
  grantedDate: string;
  expiry: string;
  status: AccessStatus;
}

const INITIAL: Permission[] = [
  { id: "P-001", provider: "0x3d2F...8aB1", recordId: "REC-0x4F2A", grantedDate: "2025-04-20", expiry: "2025-07-20", status: "active" },
  { id: "P-002", provider: "0x7c4E...2dF9", recordId: "REC-0x8C1D", grantedDate: "2025-03-15", expiry: "2025-06-15", status: "active" },
  { id: "P-003", provider: "0x1a8B...5eC3", recordId: "REC-0x2E9B", grantedDate: "2025-01-10", expiry: "2025-04-10", status: "expired" },
  { id: "P-004", provider: "0x5f2C...9dA4", recordId: "REC-0x6A3C", grantedDate: "2025-02-22", expiry: "2025-05-22", status: "revoked" },
];

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: "#ffffff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", border: "1px solid #977aa5", ...style }}>
    {children}
  </div>
);

const Badge = ({ s }: { s: AccessStatus }) => {
  const map = {
    active:  { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Active" },
    expired: { bg: "rgba(107,114,128,0.15)", color: "#6b7280", label: "Expired" },
    revoked: { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: "Revoked" },
  }[s];
  return <span style={{ background: map.bg, color: map.color, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{map.label}</span>;
};

const Btn = ({ children, onClick, variant = "primary", style = {}, disabled }: any) => {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: PURPLE, color: "#fff", border: "none" },
    danger:  { background: "transparent", color: "#ef4444", border: "1px solid #ef4444" },
    outline: { background: "transparent", color: PURPLE, border: `1px solid ${PURPLE}` },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...styles[variant], borderRadius: 8, padding: "8px 16px", fontSize: 15, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style }}
    >
      {children}
    </button>
  );
};

export default function AccessControl() {
  const [permissions, setPermissions] = useState<Permission[]>(INITIAL);
  const [walletAddr, setWalletAddr] = useState("");
  const [recordId, setRecordId] = useState("");
  const [expiry, setExpiry] = useState("");

  const stats = {
    active:  permissions.filter((p) => p.status === "active").length,
    expired: permissions.filter((p) => p.status === "expired").length,
    revoked: permissions.filter((p) => p.status === "revoked").length,
    total:   permissions.length,
  };

  const grant = () => {
    if (!walletAddr.trim() || !recordId.trim() || !expiry) return;
    const newPerm: Permission = {
      id: `P-${String(permissions.length + 1).padStart(3, "0")}`,
      provider: walletAddr,
      recordId,
      grantedDate: new Date().toISOString().slice(0, 10),
      expiry,
      status: "active",
    };
    setPermissions([newPerm, ...permissions]);
    setWalletAddr(""); setRecordId(""); setExpiry("");
  };

  const revoke = (id: string) =>
    setPermissions((p) => p.map((x) => (x.id === id ? { ...x, status: "revoked" as const } : x)));

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#4e2b6b", margin: 0 }}>Access Control</h1>
        <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 18 }}>
          Manage blockchain-based permissions for healthcare providers and institutions.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Active Permissions", value: stats.active,  icon: "🔓", color: "#c7a6e2" },
          { label: "Expired Permissions", value: stats.expired, icon: "⏰", color: "#8e58a7" },
          { label: "Revoked Access",      value: stats.revoked, icon: "🚫", color: "#5b2363" },
          { label: "Total Shared Records",value: stats.total,   icon: "📚", color: "#280c3f" },
        ].map((s) => (
          <Card key={s.label} style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: PURPLE_SOFT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {s.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Grant access */}
      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px", color: "#785992" }}>Grant New Access</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Provider Wallet</label>
            <input
              value={walletAddr}
              onChange={(e) => setWalletAddr(e.target.value)}
              placeholder="0x..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", color: "#1e293b", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Record ID</label>
            <input
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
              placeholder="REC-0x..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", color: "#1e293b", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Expiry Date</label>
            <input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", color: "#1e293b", boxSizing: "border-box" }}
            />
          </div>
          <Btn variant="primary" onClick={grant} disabled={!walletAddr.trim() || !recordId.trim() || !expiry} style={{ height: 40 }}>
            Grant Access
          </Btn>
        </div>
      </Card>

      {/* Permissions table */}
      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 750, margin: "0 0 16px", color: "#785992" }}>Active Permissions</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Provider Address", "Record ID", "Granted", "Expiry", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((p, i) => (
                <tr key={p.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", color: PURPLE, fontWeight: 600 }}>{p.provider}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 500 }}>{p.recordId}</td>
                  <td style={{ padding: "10px 12px", color: "#64748b" }}>{p.grantedDate}</td>
                  <td style={{ padding: "10px 12px", color: "#64748b" }}>{p.expiry}</td>
                  <td style={{ padding: "10px 12px" }}><Badge s={p.status} /></td>
                  <td style={{ padding: "10px 12px" }}>
                    {p.status === "active" ? (
                      <Btn variant="danger" style={{ fontSize: 12, padding: "5px 12px" }} onClick={() => revoke(p.id)}>Revoke</Btn>
                    ) : (
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Security + wallet */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        <Card>
          <h2 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 16px", color:"#421c52" }}>Security Information</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 18, color: "#2c292e" }}>
            {[
              { title: "Patient-controlled consent", sub: "You decide who accesses your records, anytime." },
              { title: "Immutable permission tracking", sub: "Every grant and revoke is recorded on-chain." },
              { title: "Blockchain audit transparency", sub: "Full public verifiability with zero data leaks." },
            ].map((s) => (
              <div key={s.title} style={{ display: "flex", gap: 12, padding: "12px 14px", borderRadius: 10, background: PURPLE_SOFT }}>
                <div style={{ fontSize: 22 }}></div>
                <div>
                  <div style={{ fontWeight: 700, color: PURPLE_DARK, fontSize: 14 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ background: PURPLE_DARK, color: "#fff" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 18px", color: "#fff" }}>Wallet & Network</h2>
          <div style={{ fontSize: 14, color: "#ddd6fe", fontWeight: 750, textTransform: "uppercase", letterSpacing: 0.5 }}>Connected Wallet</div>
          <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, marginTop: 4, marginBottom: 14 }}>0x9f1A...3bC2</div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, marginBottom: 8 }}>
            <span style={{ color: "#ddd6fe" }}>Network</span>
            <span style={{ fontWeight: 600 }}>Polygon Amoy</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, marginBottom: 8 }}>
            <span style={{ color: "#ddd6fe" }}>Smart Contract</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
              Active
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
            <span style={{ color: "#ddd6fe" }}>Chain ID</span>
            <span style={{ fontWeight: 600 }}>80002</span>
          </div>
        </Card>
      </div>

    </>
  );
}