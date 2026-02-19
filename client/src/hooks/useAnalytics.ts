import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

// ------------------
// RISK SCORES
// ------------------

export function useRiskScores() {
  return useQuery<RiskScore[]>({
    queryKey: ["ri"],
    queryFn: async () => {
      const res = await axios.get(`${BASE_URL}/api/analytics/risk`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return res.data;
    },
  });
}

// ------------------
// DASHBOARD STATS
// ------------------

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await axios.get(`${BASE_URL}/api/analytics/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return res.data;
    },
  });
}
