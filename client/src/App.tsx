import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import DocumentsPage from "./pages/DocumentsPage";
import TransactionsPage from "./pages/TransactionsPage";
import RiskPage from "./pages/RiskPage";
import LogsPage from "./pages/LogsPage";
import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <nav
        style={{
          width: "200px",
          borderRight: "1px solid #ccc",
          padding: "1rem",
        }}
      >
        <h3>Menu</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li>
            <Link to="/">Dashboard</Link>
          </li>
          <li>
            <Link to="/documents">Documents</Link>
          </li>
          <li>
            <Link to="/transactions">Transactions</Link>
          </li>
          <li>
            <Link to="/risk">Risk Analysis</Link>
          </li>
          <li>
            <Link to="/logs">System Logs</Link>
          </li>
        </ul>
        <button
          onClick={() => {
            localStorage.removeItem("access_token");
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </nav>
      <main style={{ flex: 1, padding: "2rem" }}>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/risk" element={<RiskPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}
