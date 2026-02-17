const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
  auth: {
    login: { path: `${BASE_URL}/auth/login`, method: "POST" },
    register: { path: `${BASE_URL}/auth/register`, method: "POST" },
    me: { path: `${BASE_URL}/auth/me`, method: "GET" },
  },

  documents: {
    list: { path: `${BASE_URL}/documents/`, method: "GET" },
    create: { path: `${BASE_URL}/documents/`, method: "POST" },
  },

  transactions: {
    list: { path: `${BASE_URL}/transactions/`, method: "GET" },
  },

  analytics: {
    stats: { path: `${BASE_URL}/analytics/stats`, method: "GET" },
    riskScores: { path: `${BASE_URL}/analytics/risk`, method: "GET" },
  },
};
