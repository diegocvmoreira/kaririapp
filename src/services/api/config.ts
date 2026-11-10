// Central API Configuration for Kariri.app
// Configurado para Laravel REST API em https://kariri.app.br/kariri-api-core/public/index.php/api

import { diagnoseApiIssue, ApiDiagnosticReport } from './diagnostics';
import { analytics } from '../analyticsService';

function resolveApiBaseUrl(): string {
  let url = import.meta.env.VITE_API_BASE_URL;

  if (!url || typeof url !== 'string' || url.trim() === '') {
    url = 'https://api.kariri.app.br/api';
  }

  // Se o ambiente ainda estiver injetando o caminho legado 'kariri-api', redireciona automaticamente para 'kariri-api-core'
  if (url.includes('/kariri-api/')) {
    url = url.replace('/kariri-api/', '/kariri-api-core/');
  } else if (url.endsWith('/kariri-api')) {
    url = url.replace(/\/kariri-api$/, '/kariri-api-core');
  }

  return url.replace(/\/+$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl();

// Toggle mock mode via VITE_USE_MOCK_DATA:
// Quando 'true', força dados mockados locais.
// Quando 'false' ou indefinido, realiza chamadas HTTP reais à API Laravel.
export const USE_MOCK_DATA =
  import.meta.env.VITE_USE_MOCK_DATA === 'true';

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

    // Dispara evento de analytics agregado por status (Sem PII)
    try {
      analytics.track('api_error', {
        http_status: status,
        endpoint_path: (endpoint || 'unknown').split('?')[0],
        diagnostic_category: this.diagnostic.category,
      });
    } catch {
      // Ignora falhas no track para não interromper fluxo de tratamento de erro
    }
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
  const headers = new Headers();
  headers.set('Accept', 'application/json');

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.headers) {
    const passedHeaders = new Headers(options.headers);
    passedHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

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

    // Tratamento prioritário e incondicional de 401 (token expirado ou não autorizado)
    if (response.status === 401) {
      if (token || (typeof localStorage !== 'undefined' && localStorage.getItem('kariri_auth_token'))) {
        localStorage.removeItem('kariri_auth_token');
        localStorage.removeItem('kariri_user_profile');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
      }
      if (!errorMessage || errorMessage.toLowerCase().includes('unauthenticated')) {
        errorMessage = 'Sessão não autorizada ou expirada (validade máxima de 30 dias).';
      }
    }

    if (!errorMessage) {
      if (typeof errorBody === 'string' && errorBody.trim().startsWith('<')) {
        errorMessage = `Servidor retornou resposta não-JSON (${response.status})`;
      } else {
        switch (response.status) {
          case 401:
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
