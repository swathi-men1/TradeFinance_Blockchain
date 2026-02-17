const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
  auth: {
    login: { path: `${BASE_URL}/auth/login`, method: "POST" },
    register: { path: `${BASE_URL}/auth/register`, method: "POST" },
    logout: { path: `${BASE_URL}/auth/logout`, method: "POST" },
    me: { path: `${BASE_URL}/auth/me`, method: "GET" },
  },

  documents: {
    list: { path: `${BASE_URL}/documents/`, method: "GET" },
    create: { path: `${BASE_URL}/documents/`, method: "POST" },
    ledger: (id: number) => ({
      path: `${BASE_URL}/ledger/${id}`,
      method: "GET",
    }),
  },

  transactions: {
    list: { path: `${BASE_URL}/transactions/`, method: "GET" },
    create: { path: `${BASE_URL}/transactions/`, method: "POST" },
  },

  analytics: {
    stats: { path: `${BASE_URL}/analytics/stats`, method: "GET" },
    riskScores: { path: `${BASE_URL}/analytics/ri`, method: "GET" },
    losk-scoresgs: { path: `${BASE_URL}/analytics/logs`, method: "GET" },
  },
};
