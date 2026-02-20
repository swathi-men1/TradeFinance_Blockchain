import { useStats } from "../hooks/useAnalytics";
import { useDocuments } from "../hooks/useDocuments";
import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout";
import { 
  TrendingUp, 
  Activity, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  FileText,
  Plus
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";

const mockChartData = [
  { name: "Jan", value: 4000 },
  { name: "Feb", value: 3000 },
  { name: "Mar", value: 2000 },
  { name: "Apr", value: 2780 },
  { name: "May", value: 1890 },
  { name: "Jun", value: 2390 },
  { name: "Jul", value: 3490 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: documents, isLoading: docsLoading } = useDocuments();

  const statCards = [
    {
      title: "Total Volume",
      value: stats?.total_volume ? `₹ ${stats.total_volume.toLocaleString()}` : "₹ 0",
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: "+12.5%",
      isUp: true
    },
    {
      title: "Active Trades",
      value: stats?.active_trades ?? 0,
      icon: Activity,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      trend: "+4",
      isUp: true
    },
    {
      title: "Risk Alerts",
      value: stats?.high_risk_entities ?? 0,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      trend: "-2",
      isUp: false
    }
  ];

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Welcome back, <span className="text-blue-600 font-semibold">{user?.name}</span>. Here's what's happening today.
            </p>
          </div>
          <Link to="/documents" className="btn-primary flex items-center gap-2 w-fit">
            <Plus size={18} />
            New Document
          </Link>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((card, i) => (
            <div key={i} className="premium-card relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                  <card.icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${card.isUp ? 'text-green-600' : 'text-red-600'}`}>
                  {card.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {card.trend}
                </div>
              </div>
              
              <p className="stat-label">{card.title}</p>
              <h2 className="stat-value mt-1">
                {statsLoading ? "..." : card.value}
              </h2>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CHART */}
          <div className="lg:col-span-2 premium-card flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="text-blue-600" size={20} />
                Trade Volume
              </h2>
              <div className="flex gap-2">
                {['7D', '1M', '1Y'].map(t => (
                  <button key={t} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${t === '1M' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[320px] w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RECENT ACTIVITY / DOCUMENTS */}
          <div className="premium-card">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FileText className="text-indigo-600" size={20} />
              Recent Documents
            </h2>
            
            <div className="space-y-4">
              {docsLoading ? (
                [1, 2, 3, 4].map(i => <div key={i} className="h-14 w-full bg-slate-50 animate-pulse rounded-xl" />)
              ) : documents && documents.length > 0 ? (
                documents.slice(0, 5).map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-blue-50 transition-all group cursor-pointer border border-transparent hover:border-blue-100">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{doc.doc_type}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate tracking-tight">{doc.doc_number}</p>
                    </div>
                    <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-600" />
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-40">
                  <FileText size={40} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-500">No documents found</p>
                </div>
              )}
            </div>

            <button className="w-full mt-6 py-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all">
              VIEW ALL DOCUMENTS
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
