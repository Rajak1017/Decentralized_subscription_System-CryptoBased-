// Create a lightweight API client for Django backend
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type PlanDTO = {
  id: number;
  name: string;
  description: string;
  price: string;
  duration: number;
  currency: 'MATIC' | 'USDC' | 'ETH';
  features: string[];
  isActive: boolean;
};

export type SubscriptionDTO = {
  id: number;
  planId: number;
  planName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
  txHash: string;
  price: string;
  currency: string;
  wallet: string;
};

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = '';
    try { detail = JSON.stringify(await res.json()); } catch { detail = await res.text(); }
    throw new Error(`${res.status} ${res.statusText}${detail ? `: ${detail}` : ''}`);
  }
  return res.json();
}

export async function apiPatch<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = '';
    try { detail = JSON.stringify(await res.json()); } catch { detail = await res.text(); }
    throw new Error(`${res.status} ${res.statusText}${detail ? `: ${detail}` : ''}`);
  }
  return res.json();
}

export async function apiPut<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = '';
    try { detail = JSON.stringify(await res.json()); } catch { detail = await res.text(); }
    throw new Error(`${res.status} ${res.statusText}${detail ? `: ${detail}` : ''}`);
  }
  return res.json();
}

export const fetchPlans = () => apiGet<PlanDTO[]>(`/api/plans`);
type WithAdminWallet<T> = T & { wallet?: string; address?: string };
export const createPlan = (payload: WithAdminWallet<Partial<PlanDTO>>) => apiPost<PlanDTO>(`/api/plans/create`, payload);
export const updatePlan = (id: number, payload: WithAdminWallet<PlanDTO | Partial<PlanDTO>>) => apiPatch<PlanDTO>(`/api/plans/${id}`, payload);

export const fetchSubscriptions = (wallet?: string) => apiGet<SubscriptionDTO[]>(`/api/subscriptions${wallet ? `?wallet=${wallet}` : ''}`);
export const createSubscription = (payload: Partial<SubscriptionDTO>) => apiPost<SubscriptionDTO>(`/api/subscriptions/create`, payload);
export const cancelSubscriptionApi = (id: number) => apiPost<SubscriptionDTO>(`/api/subscriptions/${id}/cancel`, {});

export const fetchStats = () => apiGet<{ activeUsers: number; subscriptions: number; activeSubscriptions: number; activePlans: number; }>(`/api/stats`);

export const registerWallet = (address: string) => apiPost<{ address: string; createdAt: string; isAdmin: boolean }>(`/api/wallets/register`, { address });
export const getCurrentWallet = (address: string) => apiGet<{ address: string; isAdmin: boolean }>(`/api/wallets/me?address=${address}`);
