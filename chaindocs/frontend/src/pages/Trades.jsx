import { useEffect, useState, useContext } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { Plus, Search } from "lucide-react";

export default function Trades() {
  const { role } = useContext(AuthContext);

  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    counterparty_id: "",
    amount: "",
    currency: "USD",
  });

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const res = await API.get("/trades/");
      setTrades(Array.isArray(res.data) ? res.data : res.data.trades || []);
    } catch (err) {
      setError("Failed to load trades");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     CREATE TRADE (Corporate Only)
  =============================== */

  const handleCreateTrade = async (e) => {
    e.preventDefault();

    try {
      await API.post("/trades/", {
        counterparty_id: parseInt(formData.counterparty_id),
        amount: parseFloat(formData.amount),
        currency: formData.currency,
      });

      setShowCreateDialog(false);
      setFormData({ counterparty_id: "", amount: "", currency: "USD" });
      fetchTrades();
    } catch {
      setError("Failed to create trade");
    }
  };

  /* ===============================
     APPROVE / REJECT (Bank Only)
  =============================== */

  const handleApprove = async (id) => {
    await API.put(`/trades/${id}/approve`);
    fetchTrades();
  };

  const handleReject = async (id) => {
    await API.put(`/trades/${id}/reject`);
    fetchTrades();
  };

  const filteredTrades = trades.filter((trade) =>
    search === "" ||
    trade.id?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <p className="p-6">Loading trades...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Trade Transactions</h1>

          {role === "corporate" && (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" /> New Trade
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-100 text-red-600 rounded">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search trade ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>

        {/* Table */}
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Initiator</th>
                <th className="p-3 text-left">Counterparty</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Status</th>
                {role === "bank" && <th className="p-3 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade) => (
                <tr key={trade.id} className="border-t">
                  <td className="p-3">{trade.id?.substring(0, 8)}...</td>
                  <td className="p-3">{trade.initiator_id}</td>
                  <td className="p-3">{trade.counterparty_id}</td>
                  <td className="p-3">
                    {trade.amount} {trade.currency}
                  </td>
                  <td className="p-3">{trade.status || "pending"}</td>

                  {role === "bank" && (
                    <td className="p-3">
                      {trade.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(trade.id)}
                            className="mr-2 px-3 py-1 bg-green-600 text-white rounded text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(trade.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Trade Dialog (Corporate Only) */}
      {showCreateDialog && role === "corporate" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Trade</h2>

            <form onSubmit={handleCreateTrade} className="space-y-4">
              <input
                type="number"
                placeholder="Counterparty ID"
                value={formData.counterparty_id}
                onChange={(e) =>
                  setFormData({ ...formData, counterparty_id: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
                required
              />

              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
                required
              />

              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
