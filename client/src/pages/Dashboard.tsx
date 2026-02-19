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
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
      trend: "+12.5%",
      isUp: true
    },
    {
      title: "Active Trades",
      value: stats?.active_trades ?? 0,
      icon: Activity,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      trend: "+4",
      isUp: true
    },
    {
      title: "Risk Alerts",
      value: stats?.high_risk_entities ?? 0,
      icon: AlertCircle,
      color: "text-red-400",
      bg: "bg-red-400/10",
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
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Pulse Dashboard
            </h1>
            <p className="text-slate-400 mt-1">
              Welcome back, <span className="text-cyan-400 font-semibold">{user?.name}</span>. Here's your portfolio summary.
            </p>
          </div>
          <Link to="/documents" className="btn-gradient flex items-center gap-2 w-fit">
            <Plus size={18} />
            New Document
          </Link>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((card, i) => (
            <div key={i} className="glass-card glass-card-hover p-6 relative overflow-hidden">
              <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 blur-xl ${card.bg}`} />
              
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                  <card.icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${card.isUp ? 'text-green-400' : 'text-red-400'}`}>
                  {card.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {card.trend}
                </div>
              </div>
              
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{card.title}</p>
              <h2 className="text-3xl font-black mt-1 text-white tabular-nums">
                {statsLoading ? "..." : card.value}
              </h2>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CHART */}
          <div className="lg:col-span-2 glass-card p-6 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="text-cyan-400" size={20} />
                Market Dynamics
              </h2>
              <div className="flex gap-2">
                {['7D', '1M', '1Y'].map(t => (
                  <button key={t} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${t === '1M' ? 'bg-cyan-500 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
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
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#ffffff08" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b' }}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#22d3ee' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#22d3ee"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RECENT ACTIVITY / DOCUMENTS */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="text-blue-400" size={20} />
              Recent Vault
            </h2>
            
            <div className="space-y-4">
              {docsLoading ? (
                [1, 2, 3, 4].map(i => <div key={i} className="h-14 w-full bg-white/5 animate-pulse rounded-xl" />)
              ) : documents && documents.length > 0 ? (
                documents.slice(0, 5).map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{doc.doc_type}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate tracking-tight">{doc.doc_number}</p>
                    </div>
                    <ArrowUpRight size={16} className="text-slate-600 group-hover:text-cyan-400" />
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-40">
                  <FileText size={40} className="mx-auto mb-2" />
                  <p className="text-xs">No documents uploaded yet</p>
                </div>
              )}
            </div>

            <button className="w-full mt-6 py-3 border border-white/5 rounded-xl text-xs font-bold text-slate-500 hover:text-white hover:border-white/10 transition-all">
              VIEW ALL ARCHIVES
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
