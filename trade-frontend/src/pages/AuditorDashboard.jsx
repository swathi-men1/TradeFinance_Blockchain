import { useEffect, useState } from "react";
import { useToast, ToastContainer } from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";
import Header from "../components/Header";
import API from "../api/axios";

export default function AuditorDashboard() {
  const [trades, setTrades] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [tradeRes, docRes, ledgerRes] = await Promise.all([
        API.get("/trades/"),
        API.get("/documents/"),
        API.get("/ledger/"),
      ]);

      setTrades(Array.isArray(tradeRes.data) ? tradeRes.data : (tradeRes.data?.trades || []));
      setDocuments(Array.isArray(docRes.data) ? docRes.data : (docRes.data?.documents || []));
      setLedger(ledgerRes.data?.entries || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load audit data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTrade = async (id) => {
    try {
      await API.get(`/integrity/verify-trade/${id}`);
      showToast("Trade integrity verified", "success");
    } catch {
      showToast("Verification failed", "error");
    }
  };

  const handleOpenDocument = async (docId) => {
    try {
      const res = await API.get(`/documents/${docId}/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "document");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      showToast("Unable to open document", "error");
    }
  };

  const tamperedDocs = documents.filter(
    (doc) => (doc.status || "").toLowerCase() === "tampered"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ToastContainer />

      <div className="max-w-7xl mx-auto px-6 py-8">

        <h1 className="text-3xl font-bold mb-6">Auditor Dashboard</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* ================= TRADES ================= */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Trade Transactions</h2>

              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 border">Trade ID</th>
                      <th className="p-3 border">Initiator</th>
                      <th className="p-3 border">Counterparty</th>
                      <th className="p-3 border">Amount</th>
                      <th className="p-3 border">Status</th>
                      <th className="p-3 border">Tampered</th>
                      <th className="p-3 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => (
                      <tr key={trade.id} className="hover:bg-gray-50">
                        <td className="p-3 border font-mono break-all">
                          {trade.id}
                        </td>
                        <td className="p-3 border">{trade.initiator_id}</td>
                        <td className="p-3 border">{trade.counterparty_id}</td>
                        <td className="p-3 border">
                          {trade.amount} {trade.currency}
                        </td>
                        <td className="p-3 border">{trade.status}</td>
                        <td className="p-3 border">
                          {trade.is_tampered ? (
                            <span className="text-red-600 font-semibold">
                              Tampered
                            </span>
                          ) : (
                            <span className="text-green-600 font-semibold">
                              Valid
                            </span>
                          )}
                        </td>
                        <td className="p-3 border space-x-2">
                          <button
                            onClick={() => handleVerifyTrade(trade.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                          >
                            Verify
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ================= DOCUMENTS ================= */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">
                Documents ({documents.length})
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 border">File Name</th>
                      <th className="p-3 border">Type</th>
                      <th className="p-3 border">Status</th>
                      <th className="p-3 border">Verified</th>
                      <th className="p-3 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="p-3 border">{doc.original_filename}</td>
                        <td className="p-3 border">{doc.document_type}</td>
                        <td className="p-3 border">
                          {doc.status === "tampered" ? (
                            <span className="text-red-600 font-semibold">
                              Tampered
                            </span>
                          ) : (
                            <span className="text-green-600 font-semibold">
                              Valid
                            </span>
                          )}
                        </td>
                        <td className="p-3 border">
                          {doc.is_verified ? "Yes" : "Pending"}
                        </td>
                        <td className="p-3 border">
                          <button
                            onClick={() => handleOpenDocument(doc.id)}
                            className="px-3 py-1 bg-gray-700 text-white rounded text-xs"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ================= LEDGER ================= */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Blockchain Ledger
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full border text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 border">#</th>
                      <th className="p-3 border">Trade ID</th>
                      <th className="p-3 border">Action</th>
                      <th className="p-3 border">Created At</th>
                      <th className="p-3 border">Current Hash</th>
                      <th className="p-3 border">Previous Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((entry, index) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="p-3 border">{index + 1}</td>
                        <td className="p-3 border font-mono break-all">
                          {entry.trade_id}
                        </td>
                        <td className="p-3 border">{entry.action}</td>
                        <td className="p-3 border">
                          {new Date(entry.created_at).toLocaleString()}
                        </td>
                        <td className="p-3 border font-mono break-all">
                          {entry.current_hash}
                        </td>
                        <td className="p-3 border font-mono break-all">
                          {entry.previous_hash || "GENESIS"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
