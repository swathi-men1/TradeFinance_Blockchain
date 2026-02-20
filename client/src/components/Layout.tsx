import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { 
  LayoutDashboard, 
  FileText, 
  ArrowRightLeft, 
  ShieldAlert, 
  LogOut,
  User
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Documents", path: "/documents", icon: FileText },
    { name: "Transactions", path: "/transactions", icon: ArrowRightLeft },
    { name: "Risk Analysis", path: "/risk", icon: ShieldAlert },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white p-6 flex flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <ShieldAlert className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">TradeChain</h1>
        </div>

        <nav className="space-y-1 flex-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                <item.icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="nav-link w-full text-slate-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-20 border-b border-slate-200 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-800">
            {menuItems.find(m => m.path === location.pathname)?.name || "Trade Finance"}
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-bold text-slate-900">{user?.name}</span>
              <span className="text-xs text-slate-500 font-medium capitalize">{user?.role}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
              <User size={20} />
            </div>
          </div>
        </header>

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
