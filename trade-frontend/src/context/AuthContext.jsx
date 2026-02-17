import { createContext, useState, useEffect } from "react";

/* ============================================================
   CREATE CONTEXT
============================================================ */
export const AuthContext = createContext(null);

/* ============================================================
   AUTH PROVIDER
============================================================ */
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ============================================================
     LOAD AUTH STATE ON APP START
  ============================================================ */
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("access_token");
      const storedRole = localStorage.getItem("role");

      if (storedToken && storedRole) {
        setToken(storedToken);
        setRole(storedRole.toLowerCase()); // normalize role
      }
    } catch (error) {
      console.error("Auth load error:", error);

      // Clear corrupted data
      localStorage.removeItem("access_token");
      localStorage.removeItem("role");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ============================================================
     LOGIN
  ============================================================ */
  const login = (accessToken, userRole) => {
    if (!accessToken || !userRole) {
      console.warn("Login failed: Missing token or role");
      return;
    }

    const normalizedRole = userRole.toLowerCase();

    // Save to localStorage
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("role", normalizedRole);

    // Update state
    setToken(accessToken);
    setRole(normalizedRole);
  };

  /* ============================================================
     LOGOUT
  ============================================================ */
  const logout = () => {
    // Clear storage
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");

    // Clear state
    setToken(null);
    setRole(null);
  };

  /* ============================================================
     CONTEXT VALUE
  ============================================================ */
  const value = {
    token,
    role,
    login,
    logout,
    isAuthenticated: !!token, // clean boolean check
  };

  /* ============================================================
     PREVENT INITIAL UI FLICKER
  ============================================================ */
  if (loading) {
    return null; // or return a loader component
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
