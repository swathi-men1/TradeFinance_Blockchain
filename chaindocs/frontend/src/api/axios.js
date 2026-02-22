import axios from "axios";

/* ============================================================
   CREATE AXIOS INSTANCE
============================================================ */

const API = axios.create({
  baseURL: "http://localhost:8000", // Change in production
  timeout: 15000,
  // ❌ DO NOT set Content-Type globally
});

/* ============================================================
   REQUEST INTERCEPTOR
   Automatically attach JWT token
============================================================ */

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ============================================================
   RESPONSE INTERCEPTOR
   Global error handling
============================================================ */

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        console.warn("Session expired. Redirecting to login.");

        localStorage.removeItem("access_token");
        localStorage.removeItem("role");

        if (
          window.location.pathname !== "/" &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/";
        }
      }

      if (status === 403) {
        console.warn("Access denied:", error.response.data?.detail);
      }

      if (status >= 500) {
        console.error("Server error:", error.response.data);
      }
    } else if (error.request) {
      console.error("Network error: Backend unreachable");
    } else {
      console.error("Axios error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default API;
