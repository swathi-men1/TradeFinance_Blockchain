import { useRiskScores } from "../hooks/useAnalytics";
import Layout from "../components/Layout";
import { ShieldAlert, Search, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useState } from "react";

export default function RiskPage() {
  const { data: risks, isLoading, error } = useRiskScores();
  const [search, setSearch] = useState("");

  const filteredRisks = risks?.filter(r => 
    r.user_id.toString().includes(search) || 
    r.rationale.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Risk Intelligence</h1>
            <p className="text-slate-500 text-sm mt-1">Real-time monitoring and threat assessment</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by User ID or Reason..." 
              className="input-field pl-10 w-full md:w-80"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="premium-card h-48 animate-pulse bg-slate-50" />
            ))}
          </div>
        ) : error ? (
          <div className="premium-card p-12 text-center">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-900">Data Fetch Error</h3>
            <p className="text-slate-500 mt-2">We couldn't retrieve the risk profiles. Please try again.</p>
          </div>
        ) : !filteredRisks || filteredRisks.length === 0 ? (
          <div className="premium-card p-12 text-center border-dashed">
            <Info className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-900">No Risk Matches</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRisks.map((risk) => {
              const isHighRisk = risk.score > 70;
              const isMediumRisk = risk.score > 40;
              
              return (
                <div key={risk.id} className="premium-card flex flex-col hover:border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isHighRisk ? 'bg-red-100 text-red-600' : isMediumRisk ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {isHighRisk ? <ShieldAlert size={18} /> : isMediumRisk ? <Info size={18} /> : <CheckCircle2 size={18} />}
                      </div>
                      <span className="text-sm font-bold text-slate-700">USER-{risk.user_id}</span>
                    </div>
                    <div className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                       isHighRisk ? 'bg-red-100 text-red-600' : isMediumRisk ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {isHighRisk ? 'Critical' : isMediumRisk ? 'Warning' : 'Low'}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-black ${
                        isHighRisk ? 'text-red-600' : isMediumRisk ? 'text-yellow-600' : 'text-green-600'
                      }`}>{risk.score}</span>
                      <span className="text-slate-400 font-bold">/ 100</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          isHighRisk ? 'bg-red-500' : isMediumRisk ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${risk.score}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Rationale</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {risk.rationale}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {risk.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(risk.last_updated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
