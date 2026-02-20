export default function TradeTable({ trades }) {
  return (
    <div className="card">
      <h3>Recent Trades</h3>

      <table width="100%">
        <thead>
          <tr>
            <th>ID</th>
            <th>Seller</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id}>
              <td>{trade.id}</td>
              <td>{trade.seller}</td>
              <td>${trade.amount}</td>
              <td>{trade.status || "Created"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}