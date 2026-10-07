// Central API Configuration for Kariri.app
// Prepared for upcoming Laravel + MySQL REST API backend

export const API_BASE_URL =
  (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL ||
  'https://kariri.app.br/api';

// Toggle mock mode: when true, services return local mock data
// When false, services send real fetch calls to API_BASE_URL
export const USE_MOCK_DATA = false;

// Helper to simulate network latency for authentic UI feedback (loading spinners, skeletons)
export async function simulateNetworkDelay<T>(data: T, delayMs: number = 150): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delayMs);
  });
}

// Reusable fetch wrapper with standard headers for Laravel Sanctum / Passport
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('kariri_auth_token');
  const headers = new Headers({
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  });

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `API error: ${response.statusText}`);
  }

  return response.json();
}
