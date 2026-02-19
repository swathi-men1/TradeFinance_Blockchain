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
    <div className="min-h-screen flex bg-[#0b1220] text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#080e1a] p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg glow-cyan flex items-center justify-center">
            <ShieldAlert className="text-[#0b1220] w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">TradeChain</h1>
        </div>

        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="nav-link w-full text-red-400/80 hover:text-red-400 hover:bg-red-400/5"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0b1220]/50 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-white">
            {menuItems.find(m => m.path === location.pathname)?.name || "Trade Finance"}
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-medium text-white">{user?.name}</span>
              <span className="text-xs text-slate-500 capitalize">{user?.role}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400">
              <User size={20} />
            </div>
          </div>
        </header>

        <main className="p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
