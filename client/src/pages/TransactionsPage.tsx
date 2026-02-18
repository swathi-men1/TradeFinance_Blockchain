import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "../api/axios";

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [buyerId, setBuyerId] = useState("");
  const [sellerId, setSellerId] = useState("");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => api.get("/transactions/").then(res => res.data)
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post("/transactions/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setAmount("");
      setBuyerId("");
      setSellerId("");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      amount: parseFloat(amount),
      currency,
      buyer_id: parseInt(buyerId),
      seller_id: parseInt(sellerId),
      status: "pending"
    });
  };

  return (
    <div>
      <h1>Transactions</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: "2rem", padding: "1rem", border: "1px solid #eee" }}>
        <h3>Create Transaction</h3>
        <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required />
        <select value={currency} onChange={e => setCurrency(e.target.value)}>
          <option value="INR">INR</option>
          <option value="USD">USD</option>
        </select>
        <input type="number" placeholder="Buyer ID" value={buyerId} onChange={e => setBuyerId(e.target.value)} required />
        <input type="number" placeholder="Seller ID" value={sellerId} onChange={e => setSellerId(e.target.value)} required />
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create"}
        </button>
      </form>

      {isLoading ? <p>Loading...</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>ID</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Amount</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Currency</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions?.map((tx: any) => (
              <tr key={tx.id}>
                <td>{tx.id}</td>
                <td>{tx.amount}</td>
                <td>{tx.currency}</td>
                <td>{tx.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
