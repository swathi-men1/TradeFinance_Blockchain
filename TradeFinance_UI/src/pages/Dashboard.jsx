import { useEffect, useState } from "react";
import API from "../api/api";
import DashboardLayout from "../layout/DashboardLayout";
import AnalyticsChart from "../components/AnalyticsChart";
import TradeTable from "../components/TradeTable";

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState([]);
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Analytics
      const analytics = await API.get("/analytics/overview");
      setStats(analytics.data);

      // Example chart conversion
      setChartData([
        { name: "Trades", value: analytics.data.total_trades || 0 },
        { name: "Documents", value: analytics.data.documents || 0 },
        { name: "Verified", value: analytics.data.verified || 0 },
      ]);

      // Trades list (create GET endpoint if needed)
      const tradeRes = await API.get("/trades");
      setTrades(tradeRes.data);

    } catch (err) {
      console.log("Dashboard load error", err);
    }
  };

  return (
    <DashboardLayout>
      <h1>Dashboard</h1>

      {/* STAT CARDS */}
      <div className="cards">
        <div className="card">
          <h3>Total Trades</h3>
          <p>{stats.total_trades || 0}</p>
        </div>

        <div className="card">
          <h3>Documents</h3>
          <p>{stats.documents || 0}</p>
        </div>

        <div className="card">
          <h3>Verified</h3>
          <p>{stats.verified || 0}</p>
        </div>

        <div className="card">
          <h3>Risk Score</h3>
          <p>{stats.risk_score || 0}%</p>
        </div>
      </div>

      {/* CHART */}
      <div className="chart-container">
        <AnalyticsChart data={chartData} />
      </div>

      {/* TABLE */}
      <div className="chart-container">
        <TradeTable trades={trades} />
      </div>
    </DashboardLayout>
  );
}