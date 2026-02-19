import { useStats } from "../hooks/useAnalytics";
import { useDocuments } from "../hooks/useDocuments";
import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  const { data: stats } = useStats();
  const { data: documents } = useDocuments();

  return (
    <Layout>
      <div className="min-h-screen text-white p-6 space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">
            Welcome, <span className="text-cyan-400">{user?.name}</span>
          </h1>
          <p className="text-slate-400 mt-2">
            Trade Finance Dashboard Overview
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <p className="text-slate-400 text-sm">Total Volume</p>
            <h2 className="text-2xl font-bold mt-2">
              ₹ {stats?.total_volume ?? 0}
            </h2>
          </div>

          <div className="card">
            <p className="text-slate-400 text-sm">Active Trades</p>
            <h2 className="text-2xl font-bold mt-2">
              {stats?.active_trades ?? 0}
            </h2>
          </div>

          <div className="card">
            <p className="text-slate-400 text-sm">Risk Alerts</p>
            <h2 className="text-2xl font-bold mt-2 text-red-400">
              {stats?.high_risk_entities ?? 0}
            </h2>
          </div>
        </div>

        {/* CHART */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Trade Volume History</h2>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#22d3ee"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DOCUMENT COUNT */}
        <div className="card">
          <h2 className="text-lg font-semibold">Total Documents</h2>
          <p className="text-2xl font-bold mt-2">{documents?.length ?? 0}</p>
        </div>
      </div>
    </Layout>
  );
}
