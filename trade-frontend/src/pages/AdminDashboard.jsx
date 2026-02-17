import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast, ToastContainer } from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";
import Header from "../components/Header";
import API from "../api/axios";

export default function AdminDashboard() {
  const [documents, setDocuments] = useState([]);
  const [trades, setTrades] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [docRes, tradeRes, orgRes] = await Promise.all([
        API.get("/documents/"),
        API.get("/trades/"),
        API.get("/organizations/secure"),
      ]);

      setDocuments(Array.isArray(docRes.data) ? docRes.data : (docRes.data?.documents || []));
      setTrades(Array.isArray(tradeRes.data) ? tradeRes.data : (tradeRes.data?.trades || []));
      setOrgs(orgRes.data || []);
    } catch (error) {
      showToast("Failed to load admin data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoc = async (id) => {
    try {
      await API.delete(`/documents/${id}`);
      setDocuments(documents.filter((doc) => doc.id !== id));
      showToast("Document deleted", "success");
    } catch {
      showToast("Delete failed", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ToastContainer />

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Admin Control Panel
          </h1>
          <p className="text-gray-500">
            System monitoring and blockchain compliance overview
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => navigate("/ledger")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            View Ledger
          </button>

          <button
            onClick={() => navigate("/auditor")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Auditor Dashboard
          </button>

          <button
            onClick={() => navigate("/bank")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Bank Dashboard
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Documents" value={documents.length} />
          <StatCard title="Trades" value={trades.length} />
          <StatCard title="Organizations" value={orgs.length} />
          <StatCard
            title="Tampered Docs"
            value={
              documents.filter(d =>
                (d.status || "").toLowerCase() === "tampered"
              ).length
            }
            color="text-red-600"
          />
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <>
            {/* DOCUMENT TABLE */}
            <SectionTitle title="All Documents" />
            <TableWrapper>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>File Name</Th>
                  <Th>Type</Th>
                  <Th>Status</Th>
                  <Th>Verified</Th>
                  <Th>Uploaded</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-t hover:bg-gray-50">
                    <Td className="font-mono break-all">{doc.id}</Td>
                    <Td>{doc.original_filename}</Td>
                    <Td>{doc.document_type}</Td>
                    <Td>
                      {doc.status === "tampered" ? (
                        <span className="text-red-600 font-semibold">
                          ⚠ Tampered
                        </span>
                      ) : (
                        <span className="text-green-600 font-semibold">
                          ✓ Valid
                        </span>
                      )}
                    </Td>
                    <Td>{doc.is_verified ? "Yes" : "Pending"}</Td>
                    <Td>
                      {doc.created_at
                        ? new Date(doc.created_at).toLocaleString()
                        : "-"}
                    </Td>
                    <Td>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>

            {/* TRADES TABLE */}
            <SectionTitle title="Recent Trades" />
            <TableWrapper>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Initiator</Th>
                  <Th>Counterparty</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Tampered</Th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <Td className="font-mono break-all">{t.id}</Td>
                    <Td>{t.initiator_id}</Td>
                    <Td>{t.counterparty_id}</Td>
                    <Td>{t.amount} {t.currency}</Td>
                    <Td>{t.status}</Td>
                    <Td>
                      {t.is_tampered ? (
                        <span className="text-red-600">YES</span>
                      ) : (
                        <span className="text-green-600">NO</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Small UI Helpers ---------- */

const StatCard = ({ title, value, color = "text-gray-800" }) => (
  <div className="bg-white p-6 rounded-xl shadow text-center">
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-gray-500">{title}</div>
  </div>
);

const SectionTitle = ({ title }) => (
  <h2 className="text-xl font-semibold mt-10 mb-4 text-gray-700">
    {title}
  </h2>
);

const TableWrapper = ({ children }) => (
  <div className="overflow-x-auto bg-white rounded-xl shadow mb-6">
    <table className="min-w-full text-sm text-left">
      {children}
    </table>
  </div>
);

const Th = ({ children }) => (
  <th className="px-6 py-3 bg-gray-100 font-semibold">{children}</th>
);

const Td = ({ children, className = "" }) => (
  <td className={`px-6 py-3 ${className}`}>{children}</td>
);
