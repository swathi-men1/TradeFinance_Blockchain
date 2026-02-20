import Sidebar from "../components/Sidebar";
import "../styles/dashboard.css";

export default function DashboardLayout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="content">{children}</div>
    </div>
  );
}