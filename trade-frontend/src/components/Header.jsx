import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/* ============================================================
   HEADER COMPONENT
============================================================ */
export default function Header() {
  const { role, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  /* ============================================================
     HANDLE LOGOUT
  ============================================================ */
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  /* ============================================================
     ROLE CONFIGURATION
  ============================================================ */
  const roleConfig = {
    bank: { label: "Bank", color: "bg-blue-600" },
    corporate: { label: "Corporate", color: "bg-purple-600" },
    auditor: { label: "Auditor", color: "bg-yellow-600" },
    admin: { label: "Admin", color: "bg-red-600" },
  };

  const normalizedRole = role?.toLowerCase();

  const config =
    roleConfig[normalizedRole] || {
      label: "User",
      color: "bg-gray-600",
    };

  /* ============================================================
     NAVIGATION HANDLER (ROLE BASED)
  ============================================================ */
  const goToDashboard = () => {
    switch (normalizedRole) {
      case "admin":
        navigate("/admin");
        break;
      case "bank":
        navigate("/bank");
        break;
      case "corporate":
        navigate("/corporate");
        break;
      case "auditor":
        navigate("/auditor");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* ================= LEFT SECTION ================= */}
        <div
          className="cursor-pointer"
          onClick={goToDashboard}
        >
          <h1 className="text-lg font-bold text-gray-800">
            Trade Finance
          </h1>
          <p className="text-xs text-gray-500">
            Blockchain Platform
          </p>
        </div>

        {/* ================= RIGHT SECTION ================= */}
        {isAuthenticated && (
          <div className="flex items-center gap-4">

            {/* Role Badge */}
            {role && (
              <div
                className={`px-3 py-1 rounded-full text-white text-sm font-medium ${config.color}`}
              >
                {config.label}
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
