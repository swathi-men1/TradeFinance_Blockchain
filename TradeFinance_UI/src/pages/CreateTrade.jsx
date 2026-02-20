import { useState } from "react";
import API from "../api/api";

export default function CreateTrade() {
  const [seller, setSeller] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [amount, setAmount] = useState("");

  const createTrade = async (e) => {
    e.preventDefault();

    try {
      await API.post("/trades/create", {
        seller: seller,
        document_id: Number(documentId),
        amount: Number(amount),
      });

      alert("Trade Created ✅");
    } catch {
      alert("Error creating trade ❌");
    }
  };

  return (
    <div className="container">
      <h2>Create Trade</h2>

      <form onSubmit={createTrade}>
        <input placeholder="Seller" onChange={(e)=>setSeller(e.target.value)} />
        <input placeholder="Document ID" onChange={(e)=>setDocumentId(e.target.value)} />
        <input placeholder="Amount" onChange={(e)=>setAmount(e.target.value)} />

        <button>Create Trade</button>
      </form>
    </div>
  );
}
