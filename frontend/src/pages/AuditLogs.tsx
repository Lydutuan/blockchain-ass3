import { useEffect, useState, useCallback } from "react";
import { getReadContract, getTotalRecords, queryFilterChunks } from "../blockchain/contract";

const PURPLE = "#6d28d9";
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
  blockNumber: number;
  // optional fields for DB entries
  rawAction?: string;
  recordOwner?: string;
}

const TYPE_LABEL: Record<TxType, string> = {
  upload: "Upload Record",
  grant: "Grant Access",
  revoke: "Revoke Access",
  verify: "Medicine Verification",
};

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: "#f8f8f8", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 8px rgba(55,16,63,0.07)", border: "1px solid #593080", ...style }}>
    {children}
  </div>
);

const shortAddr = (a: string) => (a && a.length > 10 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a);
const shortHash = (h: string) => (h && h.length > 14 ? `${h.slice(0, 10)}...${h.slice(-4)}` : h);
const fmtTime = (ts: number) => {
  const d = new Date(ts * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const StatusBadge = ({ s }: { s: LogEntry["status"] }) => {
  const map: any = {
    success: { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Success" },
    pending: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Pending" },
    failed: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", label: "Failed" },
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
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestBlock, setLatestBlock] = useState<string>("—");
  const [connectedWallet, setConnectedWallet] = useState<string>("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getReadContract();
      const provider = contract.runner?.provider;
      if (!provider) throw new Error("Provider unavailable");

      const current = await provider.getBlockNumber();
      setLatestBlock(`#${current.toLocaleString()}`);
      const fromBlock = Math.max(0, current - 200000);

      const [createdEv, grantedEv, revokedEv] = await Promise.all([
        queryFilterChunks(contract, contract.filters.RecordCreated(), fromBlock, current).catch(() => []),
        queryFilterChunks(contract, contract.filters.AccessGranted(), fromBlock, current).catch(() => []),
        queryFilterChunks(contract, contract.filters.AccessRevoked(), fromBlock, current).catch(() => []),
      ]);

      const all: LogEntry[] = [];

      for (const e of createdEv as any[]) {
        const a = e.args ?? {};
        all.push({
          id: `${e.transactionHash}-${e.logIndex}`,
          type: "upload",
          wallet: shortAddr(a.owner ?? ""),
          recordId: `REC-${(a.recordId ?? 0n).toString()}`,
          timestamp: fmtTime(Number(a.timestamp ?? 0n)),
          status: "success",
          txHash: e.transactionHash,
          blockNumber: e.blockNumber,
        });
      }

      for (const e of grantedEv as any[]) {
        const a = e.args ?? {};
        all.push({
          id: `${e.transactionHash}-${e.logIndex}`,
          type: "grant",
          wallet: shortAddr(a.grantedTo ?? ""),
          recordId: `REC-${(a.recordId ?? 0n).toString()}`,
          timestamp: fmtTime(Number(a.timestamp ?? 0n)),
          status: "success",
          txHash: e.transactionHash,
          blockNumber: e.blockNumber,
        });
      }

      for (const e of revokedEv as any[]) {
        const a = e.args ?? {};
        all.push({
          id: `${e.transactionHash}-${e.logIndex}`,
          type: "revoke",
          wallet: shortAddr(a.revokedFrom ?? ""),
          recordId: `REC-${(a.recordId ?? 0n).toString()}`,
          timestamp: fmtTime(Number(a.timestamp ?? 0n)),
          status: "success",
          txHash: e.transactionHash,
          blockNumber: e.blockNumber,
        });
      }

      if (all.length === 0) {
        const totalRecords = await getTotalRecords(contract);
        for (let i = 1; i <= totalRecords; i++) {
          try {
            const rec: any = await contract.records(i).catch(() => null);
            if (!rec) continue;
            const exists: boolean = rec.exists ?? rec[4];
            if (!exists) continue;
            const owner: string = rec.owner ?? rec[1];
            const createdAt: bigint = rec.createdAt ?? rec[3];
            all.push({
              id: `fallback-upload-${i}`,
              type: "upload",
              wallet: shortAddr(owner),
              recordId: `REC-${i}`,
              timestamp: fmtTime(Number(createdAt ?? 0n)),
              status: "success",
              txHash: "",
              blockNumber: 0,
            });

            const accessCount = Number(await contract.getAccessCount(i).catch(() => 0));
            for (let g = 0; g < accessCount; g++) {
              const grant: any = await contract.accessGrants(i, g).catch(() => null);
              if (!grant) continue;
              const grantedTo: string = grant.grantedTo ?? grant[0];
              const grantedAt = grant.grantedAt ?? grant[1];
              const isRevoked: boolean = grant.isRevoked ?? grant[3];
              if (grantedTo.toLowerCase() === owner.toLowerCase()) continue;
              all.push({
                id: `fallback-grant-${i}-${g}`,
                type: isRevoked ? "revoke" : "grant",
                wallet: shortAddr(grantedTo),
                recordId: `REC-${i}`,
                timestamp: fmtTime(Number(grantedAt ?? 0n)),
                status: "success",
                txHash: "",
                blockNumber: 0,
              });
            }
          } catch {
            continue;
          }
        }
      }

      // merge backend audit logs
      try {
        const baseUrl = (import.meta as any).env?.VITE_API_URL || "";
        const res = await fetch(`${baseUrl}/api/audit`);
        if (res.ok) {
          const body = await res.json();
          if (body.success && Array.isArray(body.logs)) {
            for (const db of body.logs) {
              const t = (db.action || "").toLowerCase();
              const type: TxType = t.includes("grant") ? "grant" : t.includes("revoke") ? "revoke" : t.includes("upload") ? "upload" : "verify";
              const entry: LogEntry & any = {
                id: `db-${db._id}`,
                type,
                wallet: shortAddr(db.performedBy || ''),
                recordId: db.recordId ? `REC-${db.recordId}` : (db.ipfsHash || ''),
                timestamp: fmtTime(Math.floor(new Date(db.createdAt).getTime() / 1000)),
                status: 'success',
                txHash: db.txHash || '',
                blockNumber: db.blockNumber || 0,
                rawAction: db.action,
              };

              // if this is a view request, try to fetch on-chain owner for response eligibility
              try {
                if ((db.action || '').toLowerCase().includes('view') && db.recordId) {
                  const rid = Number(db.recordId);
                  const rec: any = await contract.records(rid).catch(() => null);
                  if (rec) entry.recordOwner = (rec.owner ?? rec[1] ?? '') as string;
                }
              } catch { /* ignore */ }

              all.push(entry);
            }
          }
        }
      } catch (e) {
        // ignore
      }

      all.sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0));
      const seen = new Set<string>();
      const unique = all.filter((entry) => {
        const key = `${entry.type}|${entry.txHash || entry.id}|${entry.recordId}|${entry.wallet}|${entry.timestamp}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setLogs(unique.slice(0, 50));
    } catch (err: any) {
      setError(err?.message ?? "Failed to load blockchain logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
    (async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          const accs: string[] = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          if (accs?.[0]) setConnectedWallet(accs[0]);
        }
      } catch { }
    })();
  }, [loadLogs]);

  const respondToRequest = async (entry: any, decision: 'accept' | 'reject') => {
    try {
      if (!connectedWallet) { alert('Connect wallet to respond'); return; }
      const requester = entry.wallet || '';
      const recordId = entry.recordId;
      const res = await fetch((import.meta as any).env?.VITE_API_URL + '/api/audit/respond', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, requester: entry.walletRaw || requester, responder: connectedWallet, decision })
      });
      if (!res.ok) { alert('Respond failed'); return; }
      alert('Responded: ' + decision);
      loadLogs();
    } catch (e: any) { alert(e?.message || e); }
  };

  const stats = [
    { label: "Total Transactions", value: String(logs.length), icon: "⛓️" },
    { label: "Records Uploaded", value: String(logs.filter(l => l.type === 'upload').length), icon: "⬆" },
    { label: "Access Grants", value: String(logs.filter(l => l.type === 'grant').length), icon: "🔑" },
    { label: "Revocations", value: String(logs.filter(l => l.type === 'revoke').length), icon: "🚫" },
  ];

  const filtered = logs.filter((l) => {
    const matchSearch = !search || l.wallet.toLowerCase().includes(search.toLowerCase()) || l.recordId.toLowerCase().includes(search.toLowerCase()) || l.txHash.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || l.type === filter;
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
        {stats.map((s) => (
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
      <div style={{ marginBottom: 18, color: "#475569", fontSize: 13 }}>
        Current blockchain sync block: {latestBlock}
      </div>

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
            <button onClick={loadLogs} disabled={loading} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${PURPLE}`, background: PURPLE, color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {error && <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#991b1b", fontSize: 13 }}>{error}</div>}

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                { ["Transaction Type", "Wallet Address", "Record ID", "Tx Hash", "Timestamp", "Status"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 12, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                )) }
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={l.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 12px" }}><TypeChip t={l.type} /></td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", color: PURPLE, fontWeight: 600 }}>{l.wallet}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 500 }}>{l.recordId}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, background: PURPLE_SOFT, color: PURPLE, padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>{shortHash(l.txHash)}</span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#64748b", whiteSpace: "nowrap" }}>{l.timestamp}</td>
                  <td style={{ padding: "10px 12px", display: 'flex', gap: 8, alignItems: 'center' }}>
                    <StatusBadge s={l.status} />
                    { (l.rawAction || '').toLowerCase() === 'viewrequested' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        { l.recordOwner && connectedWallet && (l.recordOwner.toLowerCase() === connectedWallet.toLowerCase()) ? (
                          <>
                            <button onClick={() => respondToRequest(l, 'accept')} style={{ padding: '6px 10px', borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer' }}>Accept</button>
                            <button onClick={() => respondToRequest(l, 'reject')} style={{ padding: '6px 10px', borderRadius: 8, background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', cursor: 'pointer' }}>Reject</button>
                          </>
                        ) : (
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>Pending owner response</span>
                        )}
                      </div>
                    ) }
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>{loading ? "Loading blockchain events…" : "No transactions found on-chain."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
