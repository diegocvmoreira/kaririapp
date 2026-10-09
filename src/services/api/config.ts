// Central API Configuration for Kariri.app
// Configurado para Laravel REST API em https://kariri.app.br/kariri-api/public/index.php/api

import { diagnoseApiIssue, ApiDiagnosticReport } from './diagnostics';

export const API_BASE_URL =
  (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL ||
  'https://kariri.app.br/kariri-api/public/index.php/api';

// Toggle mock mode via VITE_USE_MOCK_DATA:
// Quando 'true', força dados mockados locais.
// Quando 'false' ou indefinido, realiza chamadas HTTP reais à API Laravel.
export const USE_MOCK_DATA =
  (import.meta as unknown as { env?: { VITE_USE_MOCK_DATA?: string } }).env?.VITE_USE_MOCK_DATA === 'true';

// Classe de erro customizada para tipar e diagnosticar status HTTP e erros de rede
export class ApiError extends Error {
  status: number;
  data: unknown;
  endpoint?: string;
  diagnostic: ApiDiagnosticReport;
  userFriendlyMessage: string;

  constructor(status: number, message: string, data?: unknown, endpoint?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.endpoint = endpoint;
    this.diagnostic = diagnoseApiIssue(status, message, data, endpoint);
    this.userFriendlyMessage = this.diagnostic.userMessage;
  }
}

// Helper to simulate network latency for authentic UI feedback when mock data is used
export async function simulateNetworkDelay<T>(data: T, delayMs: number = 120): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delayMs);
  });
}

// Reusable fetch wrapper with standard headers for Laravel REST API
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

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkError: unknown) {
    const errorMsg = networkError instanceof Error ? networkError.message : 'Falha de conexão com a API';
    throw new ApiError(0, errorMsg, networkError, endpoint);
  }

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    let errorBody: unknown = null;

    if (contentType.includes('application/json')) {
      errorBody = await response.json().catch(() => ({}));
    } else {
      errorBody = await response.text().catch(() => '');
    }

    let errorMessage = (errorBody as { message?: string })?.message;

    if (!errorMessage) {
      if (typeof errorBody === 'string' && errorBody.trim().startsWith('<')) {
        errorMessage = `Servidor retornou resposta não-JSON (${response.status})`;
      } else {
        switch (response.status) {
          case 401:
            localStorage.removeItem('kariri_auth_token');
            localStorage.removeItem('kariri_user_profile');
            errorMessage = 'Sessão não autorizada ou expirada.';
            break;
          case 403:
            errorMessage = 'Acesso não permitido a este recurso.';
            break;
          case 404:
            errorMessage = 'Recurso não encontrado.';
            break;
          case 422: {
            const errorsObj = (errorBody as { errors?: Record<string, string[]> })?.errors;
            if (errorsObj) {
              errorMessage = Object.values(errorsObj).flat().join(', ');
            } else {
              errorMessage = 'Dados inválidos fornecidos.';
            }
            break;
          }
          case 500:
            errorMessage = 'Instabilidade no servidor da API.';
            break;
          default:
            errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
      }
    }

    throw new ApiError(response.status, errorMessage, errorBody, endpoint);
  }

  return response.json();
}
