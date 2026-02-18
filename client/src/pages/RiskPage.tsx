import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export default function RiskPage() {
  const { data: riskScores, isLoading } = useQuery({
    queryKey: ["risk"],
    queryFn: () => api.get("/analytics/risk").then(res => res.data)
  });

  return (
    <div>
      <h1>Risk Analysis</h1>
      {isLoading ? <p>Loading...</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>User ID</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Score</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Rationale</th>
            </tr>
          </thead>
          <tbody>
            {riskScores?.map((r: any) => (
              <tr key={r.id}>
                <td>{r.user_id}</td>
                <td>{r.score}</td>
                <td>{r.rationale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
