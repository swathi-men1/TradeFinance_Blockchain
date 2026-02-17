import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await res.json();

      localStorage.setItem("token", data.access_token);

      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1A3C] relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-wide">
            Trade Finance Explorer
          </h1>
          <p className="text-blue-200 mt-2">
            Secure Blockchain Trade Monitoring
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm text-blue-200 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-blue-200 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-600 hover:to-blue-700 transition duration-200"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
