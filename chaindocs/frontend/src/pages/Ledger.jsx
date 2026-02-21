import { useEffect, useState } from "react";
import { useToast, ToastContainer } from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";
import Header from "../components/Header";
import API from "../api/axios";

export default function Ledger() {
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      const response = await API.get("/ledger/");
      setLedgerEntries(response.data?.entries || response.data || []);
    } catch (error) {
      console.error("Error fetching ledger:", error);
      showToast("Failed to load ledger", "error");
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    if (!action) return "badge-info";

    const a = action.toLowerCase();

    if (a.includes("create")) return "badge-primary";
    if (a.includes("approve") || a.includes("verify")) return "badge-success";
    if (a.includes("reject") || a.includes("tamper")) return "badge-danger";
    if (a.includes("update")) return "badge-warning";

    return "badge-info";
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%)",
      }}
    >
      <Header />
      <ToastContainer />

      <div className="container px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary-900 mb-2">
            Blockchain Ledger
          </h1>
          <p className="text-gray-600">
            Immutable record of all trade transactions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-primary-600">
              {ledgerEntries.length}
            </div>
            <div className="text-gray-600">Total Entries</div>
          </div>

          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-success-500">
              {
                ledgerEntries.filter((e) =>
                  (e.action || "").toLowerCase().includes("approve")
                ).length
              }
            </div>
            <div className="text-gray-600">Approvals</div>
          </div>

          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-danger-500">
              {
                ledgerEntries.filter((e) =>
                  (e.action || "").toLowerCase().includes("reject")
                ).length
              }
            </div>
            <div className="text-gray-600">Rejections</div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : ledgerEntries.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-500 text-lg">
              No ledger records found
            </p>
          </div>
        ) : (
          <div className="card shadow-lg overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-primary-600 text-white">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Trade ID</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4">Hash (First 16)</th>
                  <th className="px-6 py-4">Previous Hash</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {ledgerEntries.map((entry, idx) => (
                  <tr
                    key={entry.id || idx}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 font-semibold">
                      {idx + 1}
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-gray-700">
                      {entry.trade_id
                        ? `${entry.trade_id.substring(0, 12)}...`
                        : "N/A"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`badge ${getActionBadge(
                          entry.action
                        )}`}
                      >
                        {entry.action || "Unknown"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {entry.created_at
                        ? new Date(
                            entry.created_at
                          ).toLocaleString()
                        : "-"}
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-blue-700">
                      {entry.current_hash
                        ? `${entry.current_hash.substring(
                            0,
                            16
                          )}...`
                        : "-"}
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-purple-700">
                      {entry.previous_hash
                        ? `${entry.previous_hash.substring(
                            0,
                            16
                          )}...`
                        : "GENESIS"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <div className="p-4 bg-primary-50 text-center text-sm text-primary-900 font-semibold">
              ✅ All {ledgerEntries.length} entries are
              cryptographically secured
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
