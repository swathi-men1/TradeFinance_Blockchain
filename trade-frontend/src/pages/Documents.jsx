import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import API from "../api/axios";

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await API.get("/documents/");

      setDocuments(Array.isArray(response.data) ? response.data : (response.data?.documents || []));
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">My Documents</h1>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : documents.length === 0 ? (
        <p className="text-gray-500">No documents found</p>
      ) : (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex justify-between border-b pb-2"
            >
              <span>{doc.original_filename}</span>
              <span className="text-sm text-gray-500">
                {doc.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
