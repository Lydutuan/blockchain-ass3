import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import AccessControl from "./pages/AccessControl";
import AuditLogs from "./pages/AuditLogs";
import MedicineVerification from "./pages/MedicineVerification";
import UploadRecord from "./pages/UploadRecord";
import "./App.css";

export type PageKey = "dashboard" | "upload" | "access" | "audit" | "medicine";

const NAV = [
  { id: "dashboard" as PageKey, label: "Dashboard" },
  { id: "upload" as PageKey, label: "Upload Record"},
  { id: "access" as PageKey, label: "Access Control"},
  { id: "audit" as PageKey, label: "Audit Logs"},
  { id: "medicine" as PageKey, label: "Medicine Verify"},
];

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
  return (
    <Dashboard
      setActivePage={setActivePage}
    />
  );
      case "upload": return <UploadRecord />;
      case "access": return <AccessControl />;
      case "audit": return <AuditLogs />;
      case "medicine": return <MedicineVerification />;
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">⚕</div>
          <div>
            <div className="logo-title">MediLedger</div>
            <div className="logo-sub">VN · Polygon</div>
          </div>
        </div>

        <div className="sidebar-divider" />

        <nav className="sidebar-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${activePage === n.id ? "nav-item--active" : ""}`}
              onClick={() => setActivePage(n.id)}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-wallet">
          <div className="wallet-card">
            <div className="wallet-status">
              <span className="status-dot" />
              <span className="status-label">Connected</span>
            </div>
            <div className="wallet-address">0x9f1A...3bC2</div>
            <div className="wallet-network">Polygon Amoy Testnet</div>
          </div>
        </div>
      </aside>

      <main className="main-content">{renderPage()}</main>
    </div>
  );
}
