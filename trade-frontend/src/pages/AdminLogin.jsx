import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function AdminLogin() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Trim and normalize inputs
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      console.log("Attempting login with:", { email: trimmedEmail, password: "***" });

      const formData = new URLSearchParams();
      formData.append("username", trimmedEmail);
      formData.append("password", trimmedPassword);

      const res = await API.post("/auth/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      console.log("Login response:", res.data);

      const { access_token, user } = res.data;

      // Check if user is admin
      if (user.role.toUpperCase() !== "ADMIN") {
        setError("This account is not authorized as admin");
        setIsLoading(false);
        return;
      }

      login(access_token, user.role);
      navigate("/admin");
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      
      const errorMsg = err.response?.data?.detail || "Invalid email or password";
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-96">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-lg shadow-lg"
        >
          <h2 className="text-3xl font-bold mb-2 text-center text-red-600">
            Admin Login
          </h2>
          <p className="text-center text-gray-600 mb-6 text-sm">
            Administrators Only
          </p>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
              ❌ {error}
            </div>
          )}

          <input
            type="email"
            placeholder="Admin Email"
            className="w-full border border-gray-300 p-3 mb-4 rounded focus:outline-none focus:border-red-600"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 p-3 mb-6 rounded focus:outline-none focus:border-red-600"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold p-3 rounded transition"
          >
            {isLoading ? "Logging in..." : "Login as Admin"}
          </button>

          <div className="mt-4 text-center">
            <Link to="/" className="text-blue-600 hover:underline text-sm">
              Back to Normal Login
            </Link>
          </div>
        </form>

        {/* Debug info - remove in production */}
        <div className="mt-4 bg-gray-800 p-3 rounded text-white text-xs">
          <p className="font-bold mb-2">Test Credentials:</p>
          <p>Email: admin@tradefinance.com</p>
          <p>Password: Admin@123</p>
          <p className="mt-2 text-gray-400">Check browser console (F12) for errors</p>
        </div>
      </div>
    </div>
  );
}
