import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/* ============================================================
   PROTECTED ROUTE COMPONENT
============================================================ */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, role } = useContext(AuthContext);

  /* ============================================================
     NOT AUTHENTICATED → REDIRECT TO LOGIN PAGE ("/")
  ============================================================ */
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  /* ============================================================
     ROLE AUTHORIZATION CHECK
  ============================================================ */
  const normalizedRole = role?.toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());

  if (
    allowedRoles.length > 0 &&
    !normalizedAllowedRoles.includes(normalizedRole)
  ) {
    /* ============================================================
       REDIRECT USER TO THEIR OWN DASHBOARD
    ============================================================ */
    switch (normalizedRole) {
      case "admin":
        return <Navigate to="/admin" replace />;
      case "bank":
        return <Navigate to="/bank" replace />;
      case "corporate":
        return <Navigate to="/corporate" replace />;
      case "auditor":
        return <Navigate to="/auditor" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  /* ============================================================
     ACCESS GRANTED
  ============================================================ */
  return children;
}
