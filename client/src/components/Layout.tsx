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
    <div className="min-h-screen flex bg-transparent">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#e5e7eb] bg-white p-5 flex flex-col sticky top-0 h-screen shadow-sm">
        <div className="mb-10 px-2 flex items-center gap-3">
          <ShieldAlert className="text-blue-600" size={28} />
          <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">TradeChain</h1>
        </div>

        <nav className="space-y-4 flex-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 rounded-md px-3 py-2 font-semibold shadow-sm ring-1 ring-blue-100' 
                    : 'text-gray-600 hover:text-blue-600 px-3 py-2'
                }`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-gray-600 hover:text-red-600 transition-colors w-full px-3 py-2"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Simple Header */}
        <header className="h-16 border-b border-[#e5e7eb] bg-white/90 backdrop-blur-sm flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">
            {menuItems.find(m => m.path === location.pathname)?.name || "Trade Finance"}
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-gray-900">{user?.name}</span>
              <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600">
              <User size={18} />
            </div>
          </div>
        </header>

        <main className="p-[30px] bg-transparent flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
