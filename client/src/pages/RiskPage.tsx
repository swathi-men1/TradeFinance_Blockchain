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
            <h1 className="text-2xl font-bold text-white">Risk Intelligence</h1>
            <p className="text-slate-400 text-sm mt-1">AI-driven risk assessment and entity monitoring</p>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Filter by User ID or Reason..." 
              className="input-field pl-10 w-full md:w-80"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card h-48 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="glass-card p-12 text-center">
            <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-white">Connection Error</h3>
            <p className="text-slate-400 mt-2">Failed to fetch intelligence data. Please try again later.</p>
          </div>
        ) : !filteredRisks || filteredRisks.length === 0 ? (
          <div className="glass-card p-12 text-center border-dashed border-white/10">
            <Info className="mx-auto text-slate-500 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-white">No Risk Profiles</h3>
            <p className="text-slate-400 mt-2">No active risk alerts match your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRisks.map((risk) => {
              const isHighRisk = risk.score > 70;
              const isMediumRisk = risk.score > 40;
              
              return (
                <div key={risk.id} className="glass-card glass-card-hover p-6 relative overflow-hidden flex flex-col">
                  {/* Status Indicator */}
                  <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 blur-2xl ${
                    isHighRisk ? 'bg-red-500' : isMediumRisk ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isHighRisk ? 'bg-red-500/10 text-red-400' : isMediumRisk ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'
                      }`}>
                        {isHighRisk ? <ShieldAlert size={18} /> : isMediumRisk ? <Info size={18} /> : <CheckCircle2 size={18} />}
                      </div>
                      <span className="text-sm font-semibold text-slate-300">USER-{risk.user_id}</span>
                    </div>
                    <div className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                       isHighRisk ? 'bg-red-500/10 text-red-500' : isMediumRisk ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'
                    }`}>
                      {isHighRisk ? 'Critical' : isMediumRisk ? 'Warning' : 'Healthy'}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-black ${
                        isHighRisk ? 'text-red-400' : isMediumRisk ? 'text-yellow-400' : 'text-green-400'
                      }`}>{risk.score}</span>
                      <span className="text-slate-500 font-medium">/ 100</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          isHighRisk ? 'bg-red-500' : isMediumRisk ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${risk.score}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-2">Rationale</h4>
                    <p className="text-slate-300 text-sm leading-relaxed italic">
                      "{risk.rationale}"
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      REF: {risk.id.toString().padStart(6, '0')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {new Date(risk.last_updated).toLocaleDateString()} {new Date(risk.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
