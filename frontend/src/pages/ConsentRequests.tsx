import { useEffect, useState } from "react";
import { getContract } from "../blockchain/contract";

const PURPLE = "#6d28d9";
const PURPLE_SOFT = "#f3e8ff";

interface AccessRequestItem {
  _id: string;
  recordId: number;
  requester: string;
  patient: string;
  status: "pending" | "approved" | "denied";
  message?: string;
  expiryTime?: number;
  txHash?: string;
  createdAt: string;
}

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)", border: "1px solid #d8c0f0", ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", style = {}, disabled }: any) => {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: PURPLE, color: "#fff", border: "none" },
    outline: { background: "transparent", color: PURPLE, border: `1px solid ${PURPLE}` },
    danger: { background: "#ef4444", color: "#fff", border: "none" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...styles[variant], borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style }}
    >
      {children}
    </button>
  );
};

const formatDate = (ts?: number) => {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString();
};

const parseJsonResponse = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    throw new Error(`Empty response from ${response.url} (status ${response.status})`);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON from ${response.url}: ${text}`);
  }
};

export default function ConsentRequests() {
  const [connectedWallet, setConnectedWallet] = useState("");
  const [recordId, setRecordId] = useState("");
  const [patientWallet, setPatientWallet] = useState("");
  const [message, setMessage] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [requests, setRequests] = useState<AccessRequestItem[]>([]);
  const [fetchRecordId, setFetchRecordId] = useState("");
  const [recordCid, setRecordCid] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const loadWallet = async () => {
      if (typeof window === "undefined" || !window.ethereum) return;
      try {
        const accounts: string[] = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts?.[0]) {
          setConnectedWallet(accounts[0].toLowerCase());
        }
      } catch {
        // ignore
      }
    };
    loadWallet();
  }, []);

  useEffect(() => {
    if (!connectedWallet) return;
    loadPendingRequests();
    const interval = setInterval(loadPendingRequests, 15000);
    return () => clearInterval(interval);
  }, [connectedWallet]);

  const loadPendingRequests = async () => {
    setLoadingRequests(true);
    setErrorMessage("");
    try {
      const response = await fetch(`/api/access-requests?patient=${connectedWallet}&status=pending`);
      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `Request failed with status ${response.status}`);
      }
      const data = await parseJsonResponse(response);
      if (!data.success) throw new Error(data.error || "Failed to load requests");
      setRequests(data.requests || []);
    } catch (err: any) {
      setErrorMessage(err?.message || "Unable to fetch pending requests");
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRequestAccess = async () => {
    setBusy(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      const body = {
        recordId: Number(recordId.replace(/\D/g, "") || 0),
        requester: connectedWallet,
        patient: patientWallet.trim().toLowerCase(),
        message: message.trim(),
        expiryTime: expiryDate ? Math.floor(new Date(expiryDate).getTime() / 1000) : undefined,
      };
      if (!body.recordId || !body.requester || !body.patient) {
        throw new Error("Record ID, patient wallet, and connected wallet are required.");
      }
      const response = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(bodyText || `Request failed with status ${response.status}`);
      }
      const data = await parseJsonResponse(response);
      if (!data.success) throw new Error(data.error || "Failed to create request");
      setStatusMessage("Access request created successfully.");
      setRecordId("");
      setPatientWallet("");
      setMessage("");
      setExpiryDate("");
    } catch (err: any) {
      setErrorMessage(err?.message || "Unable to create access request");
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async (request: AccessRequestItem) => {
    setBusy(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      if (!connectedWallet || connectedWallet !== request.patient) {
        throw new Error("You must connect the patient wallet to approve this request.");
      }
      const contract = await getContract();
      const tx = await contract.grantAccess(BigInt(request.recordId), request.requester, BigInt(request.expiryTime || 0));
      await tx.wait();

      const response = await fetch(`/api/access-requests/${request._id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: tx.hash }),
      });
      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(bodyText || `Request failed with status ${response.status}`);
      }
      const data = await parseJsonResponse(response);
      if (!data.success) throw new Error(data.error || "Failed to mark request approved");

      setStatusMessage(`Approved request and granted access on-chain (tx ${tx.hash.slice(0, 10)}...).`);
      await loadPendingRequests();
    } catch (err: any) {
      setErrorMessage(err?.message || "Approval failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDeny = async (request: AccessRequestItem) => {
    setBusy(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      const response = await fetch(`/api/access-requests/${request._id}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Patient denied the access request." }),
      });
      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(bodyText || `Request failed with status ${response.status}`);
      }
      const data = await parseJsonResponse(response);
      if (!data.success) throw new Error(data.error || "Failed to deny request");
      setStatusMessage("Access request denied.");
      await loadPendingRequests();
    } catch (err: any) {
      setErrorMessage(err?.message || "Deny failed");
    } finally {
      setBusy(false);
    }
  };

  const handleFetchRecordCid = async () => {
    setBusy(true);
    setRecordCid("");
    setStatusMessage("");
    setErrorMessage("");
    try {
      if (!fetchRecordId.trim()) throw new Error("Record ID is required.");
      const contract = await getContract();
      const record = await contract.getRecord(BigInt(fetchRecordId.replace(/\D/g, "") || 0));
      if (!record.exists) throw new Error("Record does not exist or you do not have access.");
      setRecordCid(record.ipfsCid ?? "");
      setStatusMessage("Record fetched successfully.");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to fetch record");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#4e2b6b", margin: 0 }}>Consent Requests</h1>
        <p style={{ color: "#475569", margin: "6px 0 0", fontSize: 18 }}>
          Doctors request patient consent. Patients approve or deny, then the on-chain access grant is executed.
        </p>
      </div>

      {(statusMessage || errorMessage) && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: errorMessage ? "#fef2f2" : "#ecfdf5", color: errorMessage ? "#991b1b" : "#065f46", fontSize: 14, fontWeight: 600 }}>
          {errorMessage || statusMessage}
        </div>
      )}

      <Card style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px", color: "#4b2f6d" }}>Create an Access Request</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 600 }}>Record ID</label>
            <input value={recordId} onChange={(e) => setRecordId(e.target.value)} placeholder="e.g. 1" style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #d8d8d8", fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 600 }}>Patient Wallet</label>
            <input value={patientWallet} onChange={(e) => setPatientWallet(e.target.value)} placeholder="0x..." style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #d8d8d8", fontSize: 14 }} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 600 }}>Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Request reason or notes" rows={3} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #d8d8d8", fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 600 }}>Expires</label>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #d8d8d8", fontSize: 14 }} />
          </div>
          <div style={{ alignSelf: "end" }}>
            <Btn onClick={handleRequestAccess} disabled={busy || !connectedWallet || !patientWallet.trim() || !recordId.trim()}>
              {busy ? "Sending…" : "Send Request"}
            </Btn>
          </div>
        </div>
        <div style={{ marginTop: 14, color: "#475569", fontSize: 13 }}>
          Connected wallet: <strong>{connectedWallet || "Not connected"}</strong>
        </div>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#4b2f6d" }}>Pending Patient Requests</h2>
          <Btn variant="outline" onClick={loadPendingRequests} disabled={loadingRequests}>{loadingRequests ? "Refreshing…" : "Refresh"}</Btn>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {['Record', 'Requester', 'Message', 'Expires', 'Requested At', 'Actions'].map((heading) => (
                  <th key={heading} style={{ padding: "12px", color: "#64748b", textAlign: "left", fontWeight: 700, fontSize: 12 }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 18, color: "#64748b" }}>{loadingRequests ? "Loading requests…" : "No pending access requests."}</td></tr>
              ) : requests.map((item) => (
                <tr key={item._id} style={{ background: "#fff", borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 12 }}>REC-{item.recordId}</td>
                  <td style={{ padding: 12, fontFamily: "monospace" }}>{item.requester}</td>
                  <td style={{ padding: 12 }}>{item.message || "—"}</td>
                  <td style={{ padding: 12 }}>{formatDate(item.expiryTime)}</td>
                  <td style={{ padding: 12 }}>{new Date(item.createdAt).toLocaleString()}</td>
                  <td style={{ padding: 12, display: "flex", gap: 8 }}>
                    <Btn variant="primary" onClick={() => handleApprove(item)} disabled={busy || connectedWallet !== item.patient}>Approve</Btn>
                    <Btn variant="danger" onClick={() => handleDeny(item)} disabled={busy}>Deny</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, color: "#475569", fontSize: 13 }}>
          Patient approvals can only be completed by the wallet that owns the record.
        </div>
      </Card>

      <Card>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px", color: "#4b2f6d" }}>Doctor Record Lookup</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "end" }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 600 }}>Record ID</label>
            <input value={fetchRecordId} onChange={(e) => setFetchRecordId(e.target.value)} placeholder="e.g. 1" style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #d8d8d8", fontSize: 14 }} />
          </div>
          <Btn onClick={handleFetchRecordCid} disabled={busy || !fetchRecordId.trim()}>
            {busy ? "Checking…" : "Fetch CID"}
          </Btn>
        </div>
        {recordCid && (
          <div style={{ marginTop: 16, padding: "14px", borderRadius: 12, background: PURPLE_SOFT, color: "#2e1f53", fontFamily: "monospace" }}>
            <div><strong>IPFS CID:</strong></div>
            <div>{recordCid}</div>
          </div>
        )}
      </Card>
    </>
  );
}
