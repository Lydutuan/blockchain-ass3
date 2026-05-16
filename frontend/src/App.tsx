import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import AccessControl from "./pages/AccessControl";
import AuditLogs from "./pages/AuditLogs";
import ConsentRequests from "./pages/ConsentRequests";
import MedicineVerification from "./pages/MedicineVerification";
import UploadRecord from "./pages/UploadRecord";
import "./App.css";

import { connectWallet } from "./blockchain/wallet";

export type PageKey =
  | "dashboard"
  | "upload"
  | "access"
  | "audit"
  | "consent"
  | "medicine";

const NAV = [
  { id: "dashboard" as PageKey, label: "Dashboard" },
  { id: "upload" as PageKey, label: "Upload Record" },
  { id: "access" as PageKey, label: "Access Control" },
  { id: "consent" as PageKey, label: "Consent Requests" },
  { id: "audit" as PageKey, label: "Audit Logs" },
  { id: "medicine" as PageKey, label: "Medicine Verify" },
];

export default function App() {
  const [activePage, setActivePage] =
    useState<PageKey>("dashboard");

  const [walletAddress, setWalletAddress] =
    useState("");

  // Connect wallet
  const handleConnectWallet = async () => {
    const wallet = await connectWallet();

    if (wallet) {
      setWalletAddress(wallet.address);
    }
  };

  // Render pages
  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard
            setActivePage={setActivePage}
          />
        );

      case "upload":
        return <UploadRecord />;

      case "access":
        return <AccessControl />;

      case "consent":
        return <ConsentRequests />;

      case "audit":
        return <AuditLogs />;

      case "medicine":
        return <MedicineVerification />;

      default:
        return <Dashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">⚕</div>

          <div>
            <div className="logo-title">
              MediLedger
            </div>

            <div className="logo-sub">
              VN · Polygon
            </div>
          </div>
        </div>

        <div className="sidebar-divider" />

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${
                activePage === n.id
                  ? "nav-item--active"
                  : ""
              }`}
              onClick={() => setActivePage(n.id)}
            >
              {n.label}
            </button>
          ))}
        </nav>

        {/* Wallet Section */}
        <div className="sidebar-wallet">
          <div className="wallet-card">

            {walletAddress ? (
              <>
                <div className="wallet-status">
                  <span className="status-dot" />

                  <span className="status-label">
                    Connected
                  </span>
                </div>

                <div className="wallet-address">
                  {walletAddress.slice(0, 6)}...
                  {walletAddress.slice(-4)}
                </div>

                <div className="wallet-network">
                  Polygon Amoy Testnet
                </div>
              </>
            ) : (
              <button
                className="connect-wallet-btn"
                onClick={handleConnectWallet}
              >
                Connect Wallet
              </button>
            )}

          </div>
        </div>

      </aside>

      {/* Main Content */}
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}