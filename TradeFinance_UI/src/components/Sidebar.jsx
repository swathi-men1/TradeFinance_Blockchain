import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h2>TF Blockchain</h2>

      <Link to="/dashboard">Dashboard</Link>
      <Link to="/create-trade">Create Trade</Link>
      <Link to="/documents">Documents</Link>
      <Link to="/ledger">Ledger</Link>
      <Link to="/risk">Risk</Link>
      <Link to="/analytics">Analytics</Link>

      <hr />

      <Link to="/login">Logout</Link>
    </div>
  );
}