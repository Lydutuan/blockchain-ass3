import { useEffect, useState } from "react";
import type { PageKey } from "../App";
import { getContract, getTotalRecords } from "../blockchain/contract";

type Props = {
  setActivePage: (page: PageKey) => void;
};

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


// ── Helpers ────────────────────────────────────────────────────────────────
const shortAddr = (a: string) =>
  a && a.length > 10 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a;

const fmtTimestamp = (ts: bigint | number) => {
  const n = typeof ts === "bigint" ? Number(ts) : ts;
  if (!n) return "—";
  const d = new Date(n * 1000);
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ── Sub-components ─────────────────────────────────────────────────────────
const Badge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    verified: { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Verified" },
    pending: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Pending" },
    flagged: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", label: "Flagged" },
    active: { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Active" },
    expired: { bg: "rgba(107,114,128,0.15)", color: "#9ca3af", label: "Expired" },
    revoked: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", label: "Revoked" },
    upload: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6", label: "Upload" },
    grant: { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Grant" },
    revoke: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", label: "Revoke" },
    view: { bg: "rgba(139,92,246,0.15)", color: "#8b5cf6", label: "View" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
};

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", border: "1px solid #9773ac", ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", style = {} }: any) => {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "linear-gradient(90deg, rgb(107, 42, 110) 100%)", color: "#fff", border: "none" },
    success: { background: "linear-gradient(135deg, #ce90ce)", color: "#ffffff", border: "none" },
    danger: { background: "transparent", color: "#ef4444", border: "1px solid #ef4444" },
    ghost: { background: "transparent", color: "rgb(145, 72, 230)", border: "1px solid #88619b" },
    outline: { background: "transparent", color: "#6366f1", border: "1px solid #6366f1" },
  };
  return (
    <button
      onClick={onClick}
      style={{ ...styles[variant], borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "opacity .2s", ...style }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {children}
    </button>
  );
};

// ── Dashboard ──────────────────────────────────────────────────────────────
export default function Dashboard({ setActivePage }: Props) {
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [perms, setPerms] = useState<Permission[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string>("");

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract();

      // Current connected wallet
      try {
        const runner: any = contract.runner;
        if (runner?.getAddress) setWallet(await runner.getAddress());
      } catch { /* ignore */ }

      // Total records (recordCounter starts at 1)
      const total = await getTotalRecords(contract);

      const fetched: MedicalRecord[] = [];
      const auditLogs: AuditLog[] = [];
      const permList: Permission[] = [];
      const now = Math.floor(Date.now() / 1000);

      for (let i = 1; i <= total; i++) {
        try {
          const r: any = await contract.records(i);
          const recordId = (r.recordId ?? r[0]).toString();
          const owner: string = r.owner ?? r[1];
          const ipfsCid: string = r.ipfsCid ?? r[2];
          const createdAt = r.createdAt ?? r[3];
          const exists: boolean = r.exists ?? r[4];
          if (!exists) continue;

          fetched.push({
            id: `REC-${recordId}`,
            cid: ipfsCid,
            patient: shortAddr(owner),
            uploadedAt: fmtTimestamp(createdAt),
            status: "verified",
            type: "On-chain Record",
          });

          auditLogs.push({
            id: `L-${recordId}`,
            action: "Record Uploaded",
            actor: shortAddr(owner),
            target: `REC-${recordId}`,
            timestamp: fmtTimestamp(createdAt),
            type: "upload",
          });

          // Real grant count from contract
          let grantCount = 0;
          try {
            grantCount = Number(await contract.getAccessCount(i));
          } catch { grantCount = 0; }

          for (let g = 0; g < grantCount; g++) {
            try {
              const grant: any = await contract.accessGrants(i, g);
              const grantedTo: string = grant.grantedTo ?? grant[0];
              const grantedAt = grant.grantedAt ?? grant[1];
              const expiryTime = grant.expiryTime ?? grant[2];
              const isRevoked: boolean = grant.isRevoked ?? grant[3];
              // Skip the auto-grant the contract issues to the owner
              if (grantedTo.toLowerCase() === owner.toLowerCase()) continue;
              const expSec = Number(expiryTime);
              const access: Permission["access"] = isRevoked
                ? "revoked"
                : expSec > 0 && expSec < now
                  ? "expired"
                  : "active";
              permList.push({
                id: `P-${recordId}-${g}`,
                doctor: shortAddr(grantedTo),
                name: `Provider ${shortAddr(grantedTo)}`,
                granted: fmtTimestamp(grantedAt),
                expiry: expSec ? fmtTimestamp(expiryTime) : "—",
                access,
              });
              auditLogs.push({
                id: `LG-${recordId}-${g}`,
                action: isRevoked ? "Access Revoked" : "Access Granted",
                actor: shortAddr(owner),
                target: shortAddr(grantedTo),
                timestamp: fmtTimestamp(grantedAt),
                type: isRevoked ? "revoke" : "grant",
              });
            } catch { break; }
          }
        } catch (e) {
          console.warn("Failed to load record", i, e);
        }
      }

      setRecords(fetched);
      setPerms(permList);
      setLogs(auditLogs.slice(-5).reverse());
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load blockchain data");
    } finally {
      setLoading(false);
    }
  };

  const filtered = records.filter(
    (r) =>
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.patient.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase())
  );

  const revoke = (id: string) =>
    setPerms((p) => p.map((x) => (x.id === id ? { ...x, access: "revoked" as const } : x)));

  const activePerms = perms.filter((p) => p.access === "active").length;

  const STATS = [
    { label: "Total Records", value: loading ? "…" : String(records.length), icon: "🗂️", color: "#af8eb9", bg: "rgba(72, 5, 88, 0.1)" },
    { label: "Active Permissions", value: loading ? "…" : String(activePerms), icon: "🔐", color: "#9755bd", bg: "rgba(72, 5, 88, 0.1)" },
    { label: "IPFS Pinned", value: loading ? "…" : String(records.length), icon: "📌", color: "#592174", bg: "rgba(72, 5, 88, 0.1)" },
    { label: "Txns On-Chain", value: loading ? "…" : String(records.length + perms.length), icon: "⛓️", color: "#280635", bg: "rgba(72, 5, 88, 0.1)" },
  ];

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 27, fontWeight: 800, color: "#672a83", margin: 0 }}>MediLedger VN Dashboard</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 16 }}>Decentralized Electronic Medical Records on Polygon · IPFS Storage</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={loadRecords}>🔄 Refresh</Btn>
          <Btn variant="primary" onClick={() => setActivePage("upload")}>+ Upload Record</Btn>
        </div>
      </div>

      {error && (
        <Card style={{ marginBottom: 16, borderColor: "#ef4444", background: "rgba(239,68,68,0.05)" }}>
          <div style={{ color: "#ef4444", fontWeight: 600, fontSize: 13 }}>⚠ {error}</div>
        </Card>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16, marginBottom: 24 }}>
        {STATS.map((s) => (
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
      <Card style={{ marginBottom: 24, background: "linear-gradient(135deg, #54277c)", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Connected Wallet</div>
            <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700 }}>{wallet ? `${wallet.slice(0, 10)}...${wallet.slice(-9)}` : "Not connected"}</div>
            <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "#c7d2fe" }}>🌐 Polygon Amoy Testnet</span>
              <span style={{ fontSize: 13, color: "#c7d2fe" }}>💜 Chain ID: 80002</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: wallet ? "#10b981" : "#ef4444", display: "inline-block", boxShadow: `0 0 8px ${wallet ? "#10b981" : "#ef4444"}` }} />
              <span style={{ color: wallet ? "#10b981" : "#ef4444", fontWeight: 700, fontSize: 14 }}>{wallet ? "CONNECTED" : "DISCONNECTED"}</span>
            </div>
            <div style={{ color: "#6366f1", fontSize: 12, marginTop: 4 }}>0 MATIC balance</div>
            <Btn variant="ghost" style={{ marginTop: 8, color: "#a5b4fc", borderColor: "rgba(165,180,252,0.3)", fontSize: 12 }}>Disconnect</Btn>
          </div>
        </div>
      </Card>

      {/* Records */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: "#6b20a8" }}>Medical Records</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search records…"
              style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", width: 200, color: "#1e293b" }}
            />
            <Btn variant="outline" style={{ fontSize: 12 }}>Export</Btn>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Record ID", "IPFS CID", "Patient", "Type", "Uploaded", "Status", "Action"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>Loading records from blockchain…</td></tr>
              )}
              {!loading && filtered.map((r, i) => (
                <tr
                  key={r.id}
                  style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa")}
                >
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#6366f1", fontWeight: 600 }}>{r.id}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 11, color: "#64748b", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.cid}>{r.cid.slice(0, 18)}…</td>
                  <td style={{ padding: "10px 12px", fontWeight: 500 }}>{r.patient}</td>
                  <td style={{ padding: "10px 12px", color: "#475569" }}>{r.type}</td>
                  <td style={{ padding: "10px 12px", color: "#64748b", whiteSpace: "nowrap" }}>{r.uploadedAt}</td>
                  <td style={{ padding: "10px 12px" }}><Badge status={r.status} /></td>
                  <td style={{ padding: "10px 12px" }}>
                    <Btn
                      variant="ghost"
                      style={{ fontSize: 12, padding: "4px 10px" }}
                      onClick={async () => {
                        try {
                          if (!wallet) {
                            alert('Connect your wallet to request access');
                            return;
                          }
                          const recNum = Number(r.id.replace(/^REC-/, ''));
                          const contract = await getContract();
                          let has = false;
                          try {
                            has = await contract.checkAccess(BigInt(recNum), wallet);
                          } catch { has = false; }
                          if (has) {
                            // open IPFS viewer in new tab
                            window.open(`https://ipfs.io/ipfs/${r.cid}`, '_blank');
                            return;
                          }
                          // send request to backend
                          const res = await fetch((import.meta as any).env?.VITE_API_URL + '/api/audit/request', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ recordId: r.id, requester: wallet }),
                          });
                          if (!res.ok) {
                            const t = await res.text();
                            alert('Request failed: ' + t);
                            return;
                          }
                          alert('Access request sent to record owner');
                        } catch (e: any) {
                          alert('Request failed: ' + (e?.message || e));
                        }
                      }}
                    >👁 View</Btn>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Permissions + Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, marginBottom: 24, alignItems: "start" }}>
        <Card>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px", color: "#722496" }}>Active Permissions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {loading && <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading permissions…</div>}
            {!loading && perms.length === 0 && <div style={{ color: "#94a3b8", fontSize: 13 }}>No permissions found on-chain.</div>}
            {perms.map((p) => (
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

        <Card>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px", color: "#71318f" }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Upload New Record", v: "primary", page: "upload" },
              { label: "Grant Access", v: "success", page: "access" },
              { label: "View Audit Logs", v: "outline", page: "audit" },
              { label: "Verify Medicine", v: "ghost", page: "medicine" },
            ].map((a) => (
              <Btn
                key={a.label}
                variant={a.v}
                onClick={() => setActivePage(a.page as PageKey)}
                style={{ width: "100%", padding: "10px 16px", textAlign: "left", fontSize: 13 }}
              >
                {a.label}
              </Btn>
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
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#722496" }}>Recent Audit Logs</h2>
          <Btn variant="ghost" style={{ fontSize: 12 }} onClick={() => setActivePage("audit")}>View All →</Btn>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {loading && <div style={{ color: "#94a3b8", fontSize: 13, padding: "12px 0" }}>Loading audit trail…</div>}
          {!loading && logs.length === 0 && <div style={{ color: "#94a3b8", fontSize: 13, padding: "12px 0" }}>No on-chain activity yet.</div>}
          {logs.map((l, i) => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: i < logs.length - 1 ? "1px solid #f1f5f9" : "none", flexWrap: "wrap" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: l.type === "upload" ? "rgba(59,130,246,0.1)" : l.type === "grant" ? "rgba(16,185,129,0.1)" : l.type === "revoke" ? "rgba(239,68,68,0.1)" : "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
                {l.type === "upload" ? "📤" : l.type === "grant" ? "🔐" : l.type === "revoke" ? "❌" : "👁️"}
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
    </>
  );
}