import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { role, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-6 flex flex-col">
      
      {/* Title */}
      <h1 className="text-xl font-bold mb-6">
        Trade Explorer
      </h1>

      {/* Role Display */}
      <p className="text-sm mb-8 bg-gray-800 px-3 py-1 rounded">
        Role: {role?.toUpperCase()}
      </p>

      {/* Navigation Links */}
      <ul className="space-y-4 flex-1">
        <li>
          <Link to="/trades" className="hover:text-blue-400">
            Trades
          </Link>
        </li>
        <li>
          <Link to="/documents" className="hover:text-blue-400">
            Documents
          </Link>
        </li>
        <li>
          <Link to="/ledger" className="hover:text-blue-400">
            Ledger
          </Link>
        </li>
        <li>
          <Link to="/risk" className="hover:text-blue-400">
            Risk
          </Link>
        </li>
      </ul>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="mt-6 bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
      >
        Logout
      </button>

    </div>
  );
}
