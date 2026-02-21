import { useEffect, useState } from "react";
import { useToast, ToastContainer } from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";
import Header from "../components/Header";
import API from "../api/axios";

export default function CorporateDashboard() {
  const [trades, setTrades] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [tradeData, setTradeData] = useState({
    counterparty_id: "",
    amount: "",
    currency: "USD",
  });

  const [uploadFile, setUploadFile] = useState(null);

  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  /* ===============================
     FETCH DASHBOARD DATA
  =============================== */
  const fetchData = async () => {
    try {
      setLoading(true);

      const tradeRes = await API.get("/trades/");
      const docRes = await API.get("/documents/");

      const tradesData =
        Array.isArray(tradeRes.data)
          ? tradeRes.data
          : tradeRes.data?.trades || [];

      const docsData =
        Array.isArray(docRes.data)
          ? docRes.data
          : docRes.data?.documents || [];

      setTrades(tradesData);
      setDocuments(docsData);
    } catch (error) {
      console.log("Dashboard fetch error:", error.response?.data || error);
      showToast("Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     CREATE TRADE
  =============================== */
  const handleCreateTrade = async (e) => {
    e.preventDefault();

    if (!tradeData.counterparty_id || !tradeData.amount) {
      showToast("Please fill all fields", "error");
      return;
    }

    try {
      setProcessingId("trade");

      await API.post("/trades/", {
        seller_id: parseInt(tradeData.counterparty_id), // ✅ FIXED
        amount: parseFloat(tradeData.amount),
        currency: tradeData.currency,
      });

      showToast("Trade created successfully", "success");

      setTradeData({
        counterparty_id: "",
        amount: "",
        currency: "USD",
      });

      setShowTradeForm(false);
      fetchData();
    } catch (error) {
      console.log("Trade creation error:", error.response?.data || error);
      showToast(
        error.response?.data?.detail || "Failed to create trade",
        "error"
      );
    } finally {
      setProcessingId(null);
    }
  };

  /* ===============================
     UPLOAD DOCUMENT
  =============================== */
  const handleUploadDocument = async (e) => {
    e.preventDefault();

    if (!uploadFile) {
      showToast("Please select a file", "error");
      return;
    }

    try {
      setProcessingId("upload");

      const formData = new FormData();
      formData.append("file", uploadFile);

      // backend API is /upload-document (expects file form field)
      await API.post("/upload-document", formData);

      showToast("Document uploaded successfully", "success");

      setUploadFile(null);
      setShowUploadForm(false);
      fetchData();
    } catch (error) {
      console.log("Upload error:", error.response?.data || error);
      showToast(
        error.response?.data?.detail || "Upload failed",
        "error"
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ToastContainer />

      <div className="container mx-auto px-6 py-8">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Corporate Dashboard</h1>
          <p className="text-gray-600">
            Create trade transactions and upload supporting documents
          </p>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <>
            {/* ACTION BUTTONS */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setShowTradeForm(!showTradeForm)}
                className="btn btn-primary"
              >
                {showTradeForm ? "Close Trade Form" : "Create Trade"}
              </button>

              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="btn btn-secondary"
              >
                {showUploadForm ? "Close Upload" : "Upload Document"}
              </button>
            </div>

            {/* TRADE FORM */}
            {showTradeForm && (
              <div className="card mb-8 p-6">
                <form
                  onSubmit={handleCreateTrade}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <input
                    type="number"
                    placeholder="Counterparty ID"
                    value={tradeData.counterparty_id}
                    onChange={(e) =>
                      setTradeData({
                        ...tradeData,
                        counterparty_id: e.target.value,
                      })
                    }
                    className="form-input"
                    required
                  />

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={tradeData.amount}
                    onChange={(e) =>
                      setTradeData({
                        ...tradeData,
                        amount: e.target.value,
                      })
                    }
                    className="form-input"
                    required
                  />

                  <select
                    value={tradeData.currency}
                    onChange={(e) =>
                      setTradeData({
                        ...tradeData,
                        currency: e.target.value,
                      })
                    }
                    className="form-select"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                  </select>

                  <button
                    type="submit"
                    className="btn btn-primary col-span-3"
                    disabled={processingId === "trade"}
                  >
                    {processingId === "trade"
                      ? "Creating..."
                      : "Submit Trade"}
                  </button>
                </form>
              </div>
            )}

            {/* UPLOAD FORM */}
            {showUploadForm && (
              <div className="card mb-8 p-6">
                <form onSubmit={handleUploadDocument} className="space-y-4">
                  <input
                    type="file"
                    onChange={(e) =>
                      setUploadFile(e.target.files?.[0])
                    }
                    className="form-input"
                    required
                  />

                  <button
                    type="submit"
                    className="btn btn-secondary"
                    disabled={processingId === "upload"}
                  >
                    {processingId === "upload"
                      ? "Uploading..."
                      : "Upload"}
                  </button>
                </form>
              </div>
            )}

            {/* TRADES TABLE */}
            <div className="card mb-10">
              <h2 className="text-xl font-bold p-4">My Trades</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Counterparty</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Tampered</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        No trades found
                      </td>
                    </tr>
                  ) : (
                    trades.map((trade) => (
                      <tr key={trade.id}>
                        <td className="font-mono text-xs">{trade.id}</td>
                        <td>{trade.counterparty_id}</td>
                        <td>{trade.amount} {trade.currency}</td>
                        <td>{trade.status || "pending"}</td>
                        <td>{trade.is_tampered ? "YES" : "NO"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* DOCUMENTS TABLE */}
            <div className="card">
              <h2 className="text-xl font-bold p-4">My Documents</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Status</th>
                    <th>Verified</th>
                    <th>Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4">
                        No documents found
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>{doc.original_filename}</td>
                        <td>{doc.status || "pending"}</td>
                        <td>{doc.is_verified ? "YES" : "NO"}</td>
                        <td>
                          {doc.created_at
                            ? new Date(doc.created_at).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </>
        )}
      </div>
    </div>
  );
}
