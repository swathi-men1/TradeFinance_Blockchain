import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="navbar">
      <h3>Trade Finance Dashboard</h3>

      <div>
        <span>👤 {username}</span>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
}
