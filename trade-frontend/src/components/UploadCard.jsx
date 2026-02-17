import { useState } from "react";
import API from "../api/axios";

export default function UploadCard({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      // 🚨 DO NOT set Content-Type manually
      const response = await API.post(
        "/documents/upload",
        formData
      );

      console.log("Upload success:", response.data);

      alert("Document uploaded successfully ✅");

      setFile(null);

      if (onUploadSuccess) {
        onUploadSuccess();
      }

    } catch (error) {
      console.error("Upload failed:", error.response?.data);
      alert(
        error.response?.data?.detail ||
        "Upload failed. Check backend or authentication."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="font-semibold text-lg mb-2">
        Upload Document
      </h2>

      <p className="text-gray-600 mb-4">
        Upload trade finance documents securely.
      </p>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4 block w-full text-sm text-gray-700"
      />

      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
