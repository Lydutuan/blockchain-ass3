import { useState, useRef } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { getContract } from "../blockchain/contract";

type RecordType = "lab" | "prescription" | "scan" | "insurance" | "other";

const PURPLE = "#6d28d9"; // solid main color (matches MediLedger logo) — no gradient
const PURPLE_DARK = "#5b21b6";
const PURPLE_SOFT = "#f3e8ff";

type UploadStage =
  | "idle"
  | "encrypting"
  | "ipfs"
  | "tx"
  | "done";

const STAGE_LABEL: Record<UploadStage, string> = {
  idle: "Upload through backend",
  encrypting: "Sending file to backend...",
  ipfs: "Backend storing on IPFS...",
  tx: "Writing transaction...",
  done: "Uploaded ✓",
};

export default function UploadRecord() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState("");
  const [hospital, setHospital] = useState("");
  const [description, setDescription] = useState("");
  const [recordType, setRecordType] = useState<RecordType>("lab");
  const [stage, setStage] = useState<UploadStage>("idle");
  const [cid, setCid] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isUploading = stage !== "idle" && stage !== "done";

  const handleFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const f = files[0];
    const ok = ["application/pdf", "image/png", "image/jpeg"].includes(f.type);
    if (!ok) {
      alert("Only PDF, PNG, JPG are accepted.");
      return;
    }
    setFile(f);
    setSuccess(false);
    setCid(null);
    setTxHash(null);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uploadToBackend = async (f: File): Promise<string> => {
    const apiUrl = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
    
    // Get current user address from wallet
    let uploaderAddress = null;
    try {
      const contract = await getContract();
      const signer = await contract.runner.provider.getSigner();
      uploaderAddress = await signer.getAddress();
    } catch (err) {
      console.warn("Could not get wallet address:", err);
    }

    const form = new FormData();
    form.append("file", f);
    form.append("title", title);
    form.append("hospital", hospital);
    form.append("description", description);
    form.append("recordType", recordType);
    if (uploaderAddress) {
      form.append("uploaderAddress", uploaderAddress);
    }

    const res = await fetch(`${apiUrl}/api/upload`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Backend upload failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Upload failed on backend.");
    }

    return data.ipfsHash as string;
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      alert("Please add a file and a record title.");
      return;
    }
    setSuccess(false);
    setErrorMessage(null);
    setCid(null);
    setTxHash(null);

    try {
      setStage("encrypting");

      setStage("ipfs");
      const ipfsCid = await uploadToBackend(file);
      setCid(ipfsCid);

      setStage("tx");
      const contract = await getContract();
      const tx = await contract.addRecord(ipfsCid);

      const receipt = await tx.wait();
      setTxHash(receipt?.hash ?? tx.hash);

      setStage("done");
      setSuccess(true);
      setTimeout(() => setStage("idle"), 600);
    } catch (err: any) {
      console.error("Upload failed:", err);
      setErrorMessage(err?.shortMessage || err?.message || "Upload failed.");
      setStage("idle");
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: 0 }}>
          Upload Medical Record
        </h1>
        <p style={{ color: "#64748b", marginTop: 6, fontSize: 14 }}>
          Securely send healthcare documents to the backend, encrypt them, and anchor the CID on Polygon.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Upload Card */}
          <Card title="Upload File" subtitle="Accepted: PDF, PNG, JPG · max 25MB">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? PURPLE : "#cbd5e1"}`,
                background: dragOver ? PURPLE_SOFT : "#f8fafc",
                borderRadius: 12,
                padding: "36px 20px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
              <div style={{ fontWeight: 600, color: "#0f172a" }}>
                {file ? file.name : "Drag & drop your file here"}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB · ${file.type}`
                  : "or click to browse"}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                hidden
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                style={{
                  marginTop: 14,
                  background: PURPLE,
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Choose File
              </button>
            </div>
          </Card>

          {/* Metadata Form */}
          <Card title="Record Metadata">
            <div style={{ display: "grid", gap: 14 }}>
              <Field label="Record Title">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Blood Test Result – April 2025"
                  style={inputStyle}
                />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Hospital / Clinic">
                  <input
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    placeholder="Bach Mai Hospital"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Record Type">
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value as RecordType)}
                    style={inputStyle}
                  >
                    <option value="lab">Lab Result</option>
                    <option value="prescription">Prescription</option>
                    <option value="scan">Scan / Image</option>
                    <option value="insurance">Insurance</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Short context about this record..."
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                />
              </Field>
            </div>
          </Card>

          {/* Upload Button */}
          <button
            disabled={isUploading}
            onClick={handleUpload}
            style={{
              width: "100%",
              background: isUploading ? PURPLE_DARK : PURPLE,
              color: "#fff",
              border: "none",
              padding: "16px 20px",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: isUploading ? "not-allowed" : "pointer",
              boxShadow: `0 6px 20px -8px ${PURPLE}`,
              transition: "all .15s",
            }}
          >
            {isUploading && <Spinner />}
            <span style={{ marginLeft: isUploading ? 10 : 0 }}>{STAGE_LABEL[stage]}</span>
          </button>

          {/* Success */}
          {success && (
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 700, color: "#065f46", marginBottom: 6 }}>
                ✅ Medical record uploaded successfully.
              </div>
              <div style={{ fontSize: 12, color: "#047857", fontFamily: "monospace" }}>
                CID: {cid}
                <br />
                Tx: {txHash}
              </div>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 12,
                padding: 16,
                color: "#991b1b",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Encryption Status */}
          <Card title="Encryption">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Badge color="#059669" bg="#d1fae5">🔒 Secure</Badge>
            </div>
            <p style={{ color: "#475569", fontSize: 13, marginTop: 12, lineHeight: 1.5 }}>
              Server-side <b>AES-256</b> encryption is applied by the backend before your file
              is stored on IPFS.
            </p>
          </Card>

          {/* Blockchain Status */}
          <Card title="Blockchain">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Row label="Wallet">
                <Badge color="#059669" bg="#d1fae5">● Connected</Badge>
              </Row>
              <Row label="Network">
                <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>
                  Polygon Amoy
                </span>
              </Row>
              <Row label="CID">
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: cid ? PURPLE : "#94a3b8",
                  }}
                >
                  {cid ? `${cid.slice(0, 10)}...` : "—"}
                </span>
              </Row>
              <Row label="Gas">
                <span style={{ fontSize: 13, color: "#0f172a" }}>~31 Gwei</span>
              </Row>
            </div>
          </Card>

          {/* Pipeline */}
          <Card title="Pipeline">
            <Step active={stage === "encrypting"} done={["ipfs", "tx", "done"].includes(stage)} label="Encrypt file" />
            <Step active={stage === "ipfs"} done={["tx", "done"].includes(stage)} label="Store on IPFS" />
            <Step active={stage === "tx"} done={stage === "done"} label="Anchor on Polygon" />
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  fontSize: 14,
  outline: "none",
  background: "#fff",
  color: "#0f172a",
  boxSizing: "border-box",
};

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 20,
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 2px rgba(15,23,42,.04)",
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, color: PURPLE, fontSize: 15 }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </label>
  );
}

function Badge({
  children,
  color,
  bg,
}: {
  children: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        background: bg,
        color,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
      {children}
    </div>
  );
}

function Step({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  const color = done ? "#059669" : active ? PURPLE : "#cbd5e1";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: color,
          color: "#fff",
          fontSize: 11,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
        }}
      >
        {done ? "✓" : active ? "•" : ""}
      </div>
      <span style={{ fontSize: 13, color: "#0f172a", fontWeight: active ? 600 : 400 }}>
        {label}
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        border: "2px solid rgba(255,255,255,.4)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        verticalAlign: "middle",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}