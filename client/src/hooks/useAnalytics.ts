import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

// ------------------
// TYPES
// ------------------

export interface RiskScore {
  id: number;
  user_id: number;
  score: number;
  rationale: string;
  last_updated: string;
}

export interface DashboardStats {
  total_volume: number;
  active_trades: number;
  high_risk_entities: number;
}

// ------------------
// RISK SCORES
// ------------------

export function useRiskScores() {
  return useQuery<RiskScore[]>({
    queryKey: ["risk"],
    queryFn: async () => {
      const res = await api.get("/api/analytics/risk");
      return res.data;
    },
  });
}

// ------------------
// DASHBOARD STATS
// ------------------

export function useStats() {
  return useQuery<DashboardStats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await api.get("/api/analytics/stats");
      return res.data;
    },
  });
}
