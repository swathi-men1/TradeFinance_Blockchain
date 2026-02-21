import { useEffect, useState } from "react";
import { useToast, ToastContainer } from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";
import Header from "../components/Header";
import Dropdown from "../components/Dropdown";
import API from "../api/axios";

export default function BankDashboard() {
  const [trades, setTrades] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [riskData, setRiskData] = useState({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { showToast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const tradeRes = await API.get("/trades/");
      const docRes = await API.get("/documents/");
      const ledgerRes = await API.get("/ledger/");

      setTrades(
        Array.isArray(tradeRes.data)
          ? tradeRes.data
          : tradeRes.data?.trades || []
      );

      setDocuments(
        Array.isArray(docRes.data)
          ? docRes.data
          : docRes.data?.documents || []
      );

      setLedger(ledgerRes.data?.entries || []);
    } catch {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     RISK EVALUATION
  =============================== */

  const handleEvaluateRisk = async (tradeId) => {
    try {
      const res = await API.get(`/trades/${tradeId}/risk`);
      setRiskData((prev) => ({
        ...prev,
        [tradeId]: res.data,
      }));
      showToast("Risk evaluated successfully", "success");
    } catch {
      showToast("Risk evaluation failed", "error");
    }
  };

  /* ===============================
     TRADE APPROVAL / REJECTION
  =============================== */

  const handleApproveTrade = async (tradeId) => {
    try {
      setProcessingId(tradeId);

      const risk = riskData[tradeId];
      if (!risk) {
        showToast("Please evaluate risk before approval", "error");
        return;
      }

      if (risk.risk_score > 80) {
        showToast("High risk trade cannot be approved", "error");
        return;
      }

      await API.put(`/trades/${tradeId}/approve`);
      showToast("Trade approved successfully", "success");
      fetchAllData();
    } catch {
      showToast("Trade approval failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectTrade = async (tradeId) => {
    try {
      setProcessingId(tradeId);
      await API.put(`/trades/${tradeId}/reject`);
      showToast("Trade rejected", "success");
      fetchAllData();
    } catch {
      showToast("Trade rejection failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  /* ===============================
     DOCUMENT ACTIONS
  =============================== */

  const handleApproveDocument = async (docId) => {
    try {
      setProcessingId(docId);
      await API.put(`/documents/${docId}/approve`);
      showToast("Document approved", "success");
      fetchAllData();
    } catch {
      showToast("Document approval failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectDocument = async (docId) => {
    try {
      setProcessingId(docId);
      await API.put(`/documents/${docId}/reject`);
      showToast("Document rejected", "success");
      fetchAllData();
    } catch {
      showToast("Document rejection failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleVerifyDocument = async (docId) => {
    try {
      await API.put(`/documents/${docId}/verify`);
      showToast("Document verified successfully", "success");
      fetchAllData();
    } catch {
      showToast("Document verification failed", "error");
    }
  };

  /* ===============================
     FILTERED TRADES
  =============================== */

  const filteredTrades = trades.filter((trade) => {
    const matchesStatus =
      statusFilter === "all" ||
      (trade.status || "pending").toLowerCase() === statusFilter;

    const matchesSearch =
      searchTerm === "" ||
      trade.id?.toString().toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ToastContainer />

      <div className="container mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Bank Dashboard</h1>
          <p className="text-gray-600">
            Evaluate risk before approving trade transactions
          </p>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <>
            {/* ===============================
                 TRADES SECTION
            =============================== */}
            <div className="card mb-10">
              <div className="card-header flex justify-between">
                <h2 className="text-xl font-bold">Trades</h2>

                <Dropdown
                  trigger="Filter"
                  items={[
                    { label: "All", onClick: () => setStatusFilter("all") },
                    { label: "Pending", onClick: () => setStatusFilter("pending") },
                    { label: "Approved", onClick: () => setStatusFilter("approved") },
                    { label: "Rejected", onClick: () => setStatusFilter("rejected") },
                  ]}
                />
              </div>

              <div className="p-4">
                <input
                  type="text"
                  placeholder="Search by Trade ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>Trade ID</th>
                    <th>Initiator</th>
                    <th>Counterparty</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Tampered</th>
                    <th>Risk</th>
                    <th>History</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTrades.map((trade) => {
                    const risk = riskData[trade.id];

                    return (
                      <tr key={trade.id}>
                        <td className="font-mono text-xs">{trade.id}</td>
                        <td>{trade.initiator_id}</td>
                        <td>{trade.counterparty_id}</td>
                        <td>{trade.amount} {trade.currency}</td>
                        <td>{trade.status}</td>
                        <td>{trade.is_tampered ? "YES" : "NO"}</td>

                        {/* Risk Column */}
                        <td>
                          {risk ? (
                            <span
                              className={`font-semibold ${
                                risk.risk_score > 70
                                  ? "text-red-600"
                                  : risk.risk_score > 40
                                  ? "text-yellow-600"
                                  : "text-green-600"
                              }`}
                            >
                              {risk.risk_score} ({risk.risk_level})
                            </span>
                          ) : (
                            <button
                              onClick={() => handleEvaluateRisk(trade.id)}
                              className="btn btn-secondary text-sm"
                            >
                              Evaluate
                            </button>
                          )}
                        </td>

                        {/* History */}
                        <td>
                          {risk ? (
                            <>
                              Trades: {risk.total_trades} <br />
                              Rejected: {risk.past_rejections}
                            </>
                          ) : (
                            "-"
                          )}
                        </td>

                        {/* Actions */}
                        <td>
                          {trade.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApproveTrade(trade.id)}
                                disabled={processingId === trade.id}
                                className="btn btn-success mr-2"
                              >
                                Approve
                              </button>

                              <button
                                onClick={() => handleRejectTrade(trade.id)}
                                disabled={processingId === trade.id}
                                className="btn btn-danger"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* DOCUMENTS + LEDGER remain unchanged */}
          </>
        )}
      </div>
    </div>
  );
}
