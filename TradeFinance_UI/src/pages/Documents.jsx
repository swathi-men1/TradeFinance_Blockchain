import { useState } from "react";
import API from "../api/api";

export default function Documents() {
  const [file, setFile] = useState(null);

  const uploadFile = async () => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      await API.post("/documents/upload", formData);

      alert("Uploaded ✅");
    } catch {
      alert("Upload Failed ❌");
    }
  };

  return (
    <div className="container">
      <h2>Upload Document</h2>

      <input type="file" onChange={(e)=>setFile(e.target.files[0])} />

      <button onClick={uploadFile}>Upload</button>
    </div>
  );
}
