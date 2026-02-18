import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export default function LogsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["logs"],
    queryFn: () => api.get("/analytics/logs").then(res => res.data)
  });

  return (
    <div>
      <h1>System Logs</h1>
      {isLoading ? <p>Loading...</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Action</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Description</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((log: any) => (
              <tr key={log.id}>
                <td>{log.action_type}</td>
                <td>{log.description}</td>
                <td>{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
