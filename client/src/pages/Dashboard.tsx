import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useAuth } from "../hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.get("/analytics/stats").then(res => res.data)
  });

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, <strong>{user?.name}</strong> ({user?.role})</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginTop: "2rem" }}>
        <div style={{ border: "1px solid #eee", padding: "1rem" }}>
          <h3>Total Volume</h3>
          <p>{isLoading ? "Loading..." : stats?.totalVolume}</p>
        </div>
        <div style={{ border: "1px solid #eee", padding: "1rem" }}>
          <h3>Active Trades</h3>
          <p>{isLoading ? "Loading..." : stats?.activeTrades}</p>
        </div>
        <div style={{ border: "1px solid #eee", padding: "1rem" }}>
          <h3>Risk Alerts</h3>
          <p>{isLoading ? "Loading..." : stats?.riskAlerts}</p>
        </div>
      </div>
    </div>
  );
}
