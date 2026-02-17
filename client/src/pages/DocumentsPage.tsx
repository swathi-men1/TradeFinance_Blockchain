import { useState } from "react";
import { useDocuments } from "../hooks/useDocuments";

export default function DocumentsPage() {
  const { documents, isLoading, createDocument } = useDocuments();

  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [issuedAt, setIssuedAt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createDocument.mutate({
      doc_type: docType,
      doc_number: docNumber,
      file_url: fileUrl,
      issued_at: issuedAt,
    });

    setDocType("");
    setDocNumber("");
    setFileUrl("");
    setIssuedAt("");
  };

  return (
    <div className="min-h-screen bg-[#0A1A3C] text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Documents</h1>

      {/* Create Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-md p-6 rounded-xl mb-8 space-y-4"
      >
        <input
          placeholder="Document Type"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="w-full p-2 bg-white/5 border border-white/10 rounded"
          required
        />

        <input
          placeholder="Document Number"
          value={docNumber}
          onChange={(e) => setDocNumber(e.target.value)}
          className="w-full p-2 bg-white/5 border border-white/10 rounded"
          required
        />

        <input
          placeholder="File URL"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          className="w-full p-2 bg-white/5 border border-white/10 rounded"
          required
        />

        <input
          type="datetime-local"
          value={issuedAt}
          onChange={(e) => setIssuedAt(e.target.value)}
          className="w-full p-2 bg-white/5 border border-white/10 rounded"
          required
        />

        <button
          type="submit"
          className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded font-semibold"
        >
          Create Document
        </button>
      </form>

      {/* Document List */}
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {documents?.map((doc) => (
            <div
              key={doc.id}
              className="bg-white/5 p-4 rounded border border-white/10"
            >
              <p>
                <strong>Type:</strong> {doc.doc_type}
              </p>
              <p>
                <strong>Number:</strong> {doc.doc_number}
              </p>
              <p className="text-sm text-cyan-400 break-all">
                <strong>Hash:</strong> {doc.hash}
              </p>
              <p className="text-sm text-gray-400">
                Created: {new Date(doc.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
