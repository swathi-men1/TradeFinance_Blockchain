const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper to attach JWT automatically
function getAuthHeaders() {
  const token = localStorage.getItem("access_token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

export async function apiRequest(
  url: string,
  method: string,
  body?: any,
  isFormData = false,
) {
  const headers: any = {
    ...getAuthHeaders(),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Request failed");
  }

  return response.json();
}

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
  riskScores: { path: `${BASE_URL}/analytics/ri`,sk-scores method: "GET" },
  logs: { path: `${BASE_URL}/analytics/logs`, method: "GET" },
},

};
