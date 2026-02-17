import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../api/axios";

export default function Risk() {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRisk();
  }, []);

  const fetchRisk = async () => {
    try {
      setLoading(true);
      const response = await API.get("/risk/overview");
      setRiskData(response.data);
    } catch (err) {
      console.error("Error fetching risk:", err);
      setError("Failed to load risk overview");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-gray-500">Loading risk overview...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 text-red-600">{error}</div>
      </DashboardLayout>
    );
  }

  if (!riskData) {
    return (
      <DashboardLayout>
        <div className="p-6 text-gray-500">No risk data available</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Risk Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            System-wide trade risk analysis overview
          </p>
        </div>

        {/* Risk Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

          <div className="bg-white rounded-xl shadow p-5 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {riskData.total_trades}
            </div>
            <div className="text-gray-500 mt-1">Total Trades</div>
          </div>

          <div className="bg-white rounded-xl shadow p-5 text-center">
            <div className="text-3xl font-bold text-red-600">
              {riskData.high_risk}
            </div>
            <div className="text-gray-500 mt-1">High Risk</div>
          </div>

          <div className="bg-white rounded-xl shadow p-5 text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {riskData.medium_risk}
            </div>
            <div className="text-gray-500 mt-1">Medium Risk</div>
          </div>

          <div className="bg-white rounded-xl shadow p-5 text-center">
            <div className="text-3xl font-bold text-green-600">
              {riskData.low_risk}
            </div>
            <div className="text-gray-500 mt-1">Low Risk</div>
          </div>

          <div className="bg-white rounded-xl shadow p-5 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {riskData.average_risk_score}
            </div>
            <div className="text-gray-500 mt-1">Avg Risk Score</div>
          </div>
        </div>

        {/* High Risk Trades Table */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            High Risk Trades
          </h2>

          {riskData.top_high_risk_trades?.length === 0 ? (
            <p className="text-gray-500">No high-risk trades found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-100">
                    <th className="p-3 text-left text-sm font-semibold">Trade ID</th>
                    <th className="p-3 text-left text-sm font-semibold">Counterparty</th>
                    <th className="p-3 text-left text-sm font-semibold">Amount</th>
                    <th className="p-3 text-left text-sm font-semibold">Risk Score</th>
                  </tr>
                </thead>
                <tbody>
                  {riskData.top_high_risk_trades.map((trade) => (
                    <tr key={trade.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-sm font-mono">
                        {trade.id?.substring(0, 10)}...
                      </td>
                      <td className="p-3 text-sm">
                        {trade.counterparty_id}
                      </td>
                      <td className="p-3 text-sm">
                        {trade.amount}
                      </td>
                      <td className="p-3 text-sm font-bold text-red-600">
                        {trade.risk_score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
