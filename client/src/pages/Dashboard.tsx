import { useStats, useRiskScores } from "../hooks/use-analytics";
import { LayoutShell } from "../components/layout-shell";
import { StatCard } from "../components/stat-card";
import { Activity, AlertTriangle, DollarSign, FileCheck, FileText } from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { useDocuments } from "../hooks/useDocuments";
import { Skeleton } from "../components/ui/skeleton";
import { useAuth } from "../hooks/useAuth";

const mockChartData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490 },
];

export default function Dashboard() {
  const { stats, isLoading: statsLoading } = useStats();
  const { documents, isLoading: docsLoading } = useDocuments();
  const { user } = useAuth();
  
  const recentDocs = documents?.slice(0, 5) || [];

  return (
    <LayoutShell>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your trade finance portfolio today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard 
              title="Total Volume" 
              value={stats?.totalVolume || "Rs. 0.00"} 
              icon={DollarSign}
              trend="up"
              trendValue="+12%"
            />
            <StatCard 
              title="Active Trades" 
              value={stats?.activeTrades || 0} 
              icon={Activity}
              trend="up"
              trendValue="+5"
            />
            <StatCard 
              title="Risk Alerts" 
              value={stats?.riskAlerts ?? 0} 
              icon={AlertTriangle}
              trend={(stats?.riskAlerts ?? 0) > 0 ? "down" : "neutral"}
              trendValue="Low"
              className={(stats?.riskAlerts ?? 0) > 0 ? "border-red-500/30 bg-red-50/50" : ""}
            />
            <StatCard 
              title="Verified Docs" 
              value={documents?.length || 0} 
              icon={FileCheck}
              trend="neutral"
              trendValue="Stable"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass-card border-none shadow-lg">
          <CardHeader>
            <CardTitle>Trade Volume History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E8FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00E8FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs.${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#0077B6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-lg">
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {docsLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                  </div>
                ))
              ) : recentDocs.length > 0 ? (
                recentDocs.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{doc.doc_type}</p>
                        <p className="text-xs text-muted-foreground">{doc.doc_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
                        {doc.hash?.substring(0, 6)}...
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No documents found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}
