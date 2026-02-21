import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function DashboardLayout({ children }) {
  const { role, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const linkClass = (path) =>
    `px-3 py-2 rounded transition ${
      location.pathname === path
        ? "bg-blue-600 text-white"
        : "hover:bg-gray-700 text-gray-300"
    }`;

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* ================= Sidebar ================= */}
      <div className="w-64 bg-gray-900 text-white p-6 flex flex-col">

        {/* Logo */}
        <h1 className="text-xl font-bold mb-8">
          Trade Explorer
        </h1>

        {/* Role Badge */}
        <div className="mb-8">
          <span className="text-xs uppercase tracking-wide text-gray-400">
            Logged in as
          </span>
          <div className="mt-1 bg-gray-800 px-3 py-2 rounded text-sm font-semibold">
            {role?.toUpperCase()}
          </div>
        </div>

        {/* ================= Navigation ================= */}
        <nav className="flex flex-col gap-3 flex-1 text-sm">

          {/* ================= ADMIN ================= */}
          {role === "admin" && (
            <>
              <Link to="/admin" className={linkClass("/admin")}>
                Admin Dashboard
              </Link>

              <Link to="/trades" className={linkClass("/trades")}>
                Trades
              </Link>

              <Link to="/documents" className={linkClass("/documents")}>
                Documents
              </Link>

              <Link to="/ledger" className={linkClass("/ledger")}>
                Ledger
              </Link>

              <Link to="/risk" className={linkClass("/risk")}>
                Risk Analytics
              </Link>
            </>
          )}

          {/* ================= CORPORATE ================= */}
          {role === "corporate" && (
            <>
              <Link to="/corporate" className={linkClass("/corporate")}>
                Dashboard
              </Link>

              <Link to="/trades" className={linkClass("/trades")}>
                Trades
              </Link>

              <Link to="/documents" className={linkClass("/documents")}>
                My Documents
              </Link>

              <Link to="/risk" className={linkClass("/risk")}>
                My Risk Score
              </Link>

              <Link to="/ledger" className={linkClass("/ledger")}>
                Ledger
              </Link>
            </>
          )}

          {/* ================= BANK ================= */}
          {role === "bank" && (
            <>
              <Link to="/bank" className={linkClass("/bank")}>
                Bank Operations
              </Link>

              <Link to="/trades" className={linkClass("/trades")}>
                Trades
              </Link>

              <Link to="/documents" className={linkClass("/documents")}>
                Documents
              </Link>

              <Link to="/ledger" className={linkClass("/ledger")}>
                Ledger
              </Link>

              <Link to="/risk" className={linkClass("/risk")}>
                Risk Analytics
              </Link>
            </>
          )}

          {/* ================= AUDITOR ================= */}
          {role === "auditor" && (
            <>
              <Link to="/auditor" className={linkClass("/auditor")}>
                Audit Panel
              </Link>

              <Link to="/trades" className={linkClass("/trades")}>
                Trades
              </Link>

              <Link to="/documents" className={linkClass("/documents")}>
                Documents
              </Link>

              <Link to="/ledger" className={linkClass("/ledger")}>
                Ledger
              </Link>
            </>
          )}

        </nav>

        {/* ================= Logout ================= */}
        <button
          onClick={handleLogout}
          className="mt-6 bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition text-sm"
        >
          Logout
        </button>

      </div>

      {/* ================= Main Content ================= */}
      <div className="flex-1 p-8 overflow-auto">
        {children}
      </div>

    </div>
  );
}
