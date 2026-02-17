import { useQuery } from "@tanstack/react-query";
import { api, type TradeTransaction, type RiskScore } from "../api";

// Helper to attach JWT automatically
function authorizedFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("access_token");

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

export function useTransactions() {
  return useQuery<TradeTransaction[]>({
    queryKey: [api.transactions.list.path],
    queryFn: async () => {
      const res = await authorizedFetch(api.transactions.list.path);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return await res.json();
    },
  });
}

export function useRiskScores() {
  return useQuery<RiskScore[]>({
    queryKey: [api.analytics.riskScores.path],
    queryFn: async () => {
      const res = await authorizedFetch(api.analytics.riskScores.path);
      if (!res.ok) throw new Error("Failed to fetch risk scores");
      return await res.json();
    },
  });
}

export function useStats() {
  return useQuery<{
    totalVolume: string;
    activeTrades: number;
    riskAlerts: number;
  }>({
    queryKey: [api.analytics.stats.path],
    queryFn: async () => {
      const res = await authorizedFetch(api.analytics.stats.path);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return await res.json();
    },
  });
}
