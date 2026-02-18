import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "../api/axios";

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [docType, setDocType] = useState("INVOICE");
  const [docNumber, setDocNumber] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.get("/documents/").then(res => res.data)
  });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => api.post("/documents/", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setDocNumber("");
      setIssuedAt("");
      setFile(null);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append("doc_type", docType);
    formData.append("doc_number", docNumber);
    formData.append("issued_at", issuedAt);
    formData.append("file", file);
    mutation.mutate(formData);
  };

  return (
    <div>
      <h1>Documents</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: "2rem", padding: "1rem", border: "1px solid #eee" }}>
        <h3>Upload Document</h3>
        <select value={docType} onChange={e => setDocType(e.target.value)}>
          <option value="INVOICE">Invoice</option>
          <option value="LOC">Letter of Credit</option>
          <option value="BILL_OF_LADING">Bill of Lading</option>
          <option value="PO">Purchase Order</option>
        </select>
        <input placeholder="Doc Number" value={docNumber} onChange={e => setDocNumber(e.target.value)} required />
        <input type="datetime-local" value={issuedAt} onChange={e => setIssuedAt(e.target.value)} required />
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} required />
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Uploading..." : "Upload"}
        </button>
      </form>

      {isLoading ? <p>Loading...</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Number</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Type</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Hash</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Issued At</th>
            </tr>
          </thead>
          <tbody>
            {documents?.map((doc: any) => (
              <tr key={doc.id}>
                <td>{doc.doc_number}</td>
                <td>{doc.doc_type}</td>
                <td style={{ fontSize: "0.8rem", color: "#666" }}>{doc.hash}</td>
                <td>{new Date(doc.issued_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
