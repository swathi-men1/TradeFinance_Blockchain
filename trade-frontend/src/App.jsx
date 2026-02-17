import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import BankDashboard from "./pages/BankDashboard";
import CorporateDashboard from "./pages/CorporateDashboard";
import AuditorDashboard from "./pages/AuditorDashboard";
import Trades from "./pages/Trades";
import Documents from "./pages/Documents";
import Ledger from "./pages/Ledger";
import Risk from "./pages/Risk";

/* ============================================================
   ROLE → DASHBOARD REDIRECT HELPER
============================================================ */
function getDashboardByRole(role) {
  switch (role?.toLowerCase()) {
    case "admin":
      return "/admin";
    case "bank":
      return "/bank";
    case "corporate":
      return "/corporate";
    case "auditor":
      return "/auditor";
    default:
      return "/login";
  }
}

/* ============================================================
   UNAUTHORIZED PAGE
============================================================ */
function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to access this page.
        </p>
        <a
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Go Back
        </a>
      </div>
    </div>
  );
}

/* ============================================================
   ROUTES WRAPPER
============================================================ */
function AppRoutes() {
  const { role, isAuthenticated } = useContext(AuthContext);

  return (
    <Routes>

      {/* ================= LOGIN ================= */}
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={getDashboardByRole(role)} replace />
            : <Login />
        }
      />

      {/* ================= ROOT REDIRECT ================= */}
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to={getDashboardByRole(role)} replace />
            : <Navigate to="/login" replace />
        }
      />

      {/* ================= ADMIN ================= */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* ================= BANK ================= */}
      <Route
        path="/bank"
        element={
          <ProtectedRoute allowedRoles={["bank"]}>
            <BankDashboard />
          </ProtectedRoute>
        }
      />

      {/* ================= CORPORATE ================= */}
      <Route
        path="/corporate"
        element={
          <ProtectedRoute allowedRoles={["corporate"]}>
            <CorporateDashboard />
          </ProtectedRoute>
        }
      />

      {/* ================= AUDITOR ================= */}
      <Route
        path="/auditor"
        element={
          <ProtectedRoute allowedRoles={["auditor"]}>
            <AuditorDashboard />
          </ProtectedRoute>
        }
      />

      {/* ================= TRADES ================= */}
      {/* Auditor removed — only Corporate, Bank, Admin */}
      <Route
        path="/trades"
        element={
          <ProtectedRoute allowedRoles={["corporate", "bank", "admin"]}>
            <Trades />
          </ProtectedRoute>
        }
      />

      {/* ================= DOCUMENTS ================= */}
      <Route
        path="/documents"
        element={
          <ProtectedRoute allowedRoles={["corporate", "bank", "admin", "auditor"]}>
            <Documents />
          </ProtectedRoute>
        }
      />

      {/* ================= LEDGER ================= */}
      <Route
        path="/ledger"
        element={
          <ProtectedRoute allowedRoles={["admin", "bank", "auditor"]}>
            <Ledger />
          </ProtectedRoute>
        }
      />

      {/* ================= RISK ================= */}
      {/* Corporate removed — Risk should be Bank + Admin */}
      <Route
        path="/risk"
        element={
          <ProtectedRoute allowedRoles={["bank", "admin"]}>
            <Risk />
          </ProtectedRoute>
        }
      />

      {/* ================= UNAUTHORIZED ================= */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ================= FALLBACK ================= */}
      <Route
        path="*"
        element={
          isAuthenticated
            ? <Navigate to={getDashboardByRole(role)} replace />
            : <Navigate to="/login" replace />
        }
      />

    </Routes>
  );
}

/* ============================================================
   MAIN APP
============================================================ */
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
