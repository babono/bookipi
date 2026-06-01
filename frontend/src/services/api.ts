const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface SaleConfig {
  startTime: string;
  endTime: string;
  totalStock: number;
}

export interface SaleStatus extends SaleConfig {
  status: string;
  stock: number;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  data: T;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${url}`, options);
  const data = await res.json();
  return { ok: res.ok, data };
}

export const api = {
  // Main status and purchase endpoints
  getSaleStatus: () => fetchJson<SaleStatus>('/api/sale/status'),
  
  purchase: (userId: string) => fetchJson<{ message?: string; error?: string }>('/api/sale/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  }),
  
  createSaleStream: () => new EventSource(`${API_BASE}/api/sale/stream`),

  // Dev Sandbox endpoints
  getConfig: () => fetchJson<SaleConfig>('/api/sale/config'),
  
  setConfig: (config: SaleConfig) => fetchJson<{ message?: string; error?: string }>('/api/sale/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  }),
  
  getBuyers: () => fetchJson<string[]>('/api/sale/buyers'),
};
