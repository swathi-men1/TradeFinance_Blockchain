import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import DocumentsPage from "./pages/DocumentsPage";
import TransactionsPage from "./pages/TransactionsPage";
import RiskPage from "./pages/RiskPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/risk" element={<RiskPage />} />
      </Routes>
    </BrowserRouter>
  );
}
