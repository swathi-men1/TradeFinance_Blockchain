const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
  auth: {
    login: `${BASE_URL}/api/auth/login`,
    register: `${BASE_URL}/api/auth/register`,
    me: `${BASE_URL}/api/auth/me`,
  },

  documents: {
    list: `${BASE_URL}/api/documents/`,
    create: `${BASE_URL}/api/documents/`,
    ledger: (id: number) => `${BASE_URL}/api/ledger/${id}`,
  },

  transactions: {
    list: `${BASE_URL}/api/transactions/`,
    create: `${BASE_URL}/api/transactions/`,
  },

  analytics: {
    stats: `${BASE_URL}/api/analytics/stats`,
    risk: `${BASE_URL}/api/analytics/risk`,
    logs: `${BASE_URL}/api/analytics/logs`,
  },
};
