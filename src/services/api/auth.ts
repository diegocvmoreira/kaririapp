import { apiClient, simulateNetworkDelay, USE_MOCK_DATA, ApiError } from './config';
import { User } from '../../types';
import { mockUser } from '../../mocks/mockUser';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  city_preference?: string;
  password?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (USE_MOCK_DATA) {
      return this.mockLogin(credentials);
    }

    try {
      const data = await apiClient<AuthResponse>('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      localStorage.setItem('kariri_auth_token', data.token);
      localStorage.setItem('kariri_user_profile', JSON.stringify(data.user));
      return data;
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 404) {
        console.warn('Endpoint /login não encontrado (404). Realizando autenticação simulada de desenvolvimento.');
        return this.mockLogin(credentials);
      }
      throw error;
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    if (USE_MOCK_DATA) {
      return this.mockRegister(data);
    }

    try {
      const res = await apiClient<AuthResponse>('/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      localStorage.setItem('kariri_auth_token', res.token);
      localStorage.setItem('kariri_user_profile', JSON.stringify(res.user));
      return res;
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 404) {
        console.warn('Endpoint /register não encontrado (404). Realizando cadastro simulado de desenvolvimento.');
        return this.mockRegister(data);
      }
      throw error;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('kariri_auth_token');
    if (!token) return null;

    if (USE_MOCK_DATA) {
      try {
        const stored = localStorage.getItem('kariri_user_profile');
        if (stored) return JSON.parse(stored);
      } catch {
        // ignore
      }
      return mockUser;
    }

    try {
      const user = await apiClient<User>('/me');
      return user;
    } catch {
      // Se /me retornar 404 ou 401, tenta restaurar o perfil armazenado localmente
      try {
        const stored = localStorage.getItem('kariri_user_profile');
        if (stored) return JSON.parse(stored);
      } catch {
        // ignore
      }
      return mockUser;
    }
  },

  async logout(): Promise<void> {
    try {
      if (!USE_MOCK_DATA) {
        await apiClient('/logout', { method: 'POST' }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('kariri_auth_token');
      localStorage.removeItem('kariri_user_profile');
    }
  },

  mockLogin(credentials: LoginCredentials): AuthResponse {
    const user: User = {
      ...mockUser,
      email: credentials.email || mockUser.email,
    };
    const token = 'mock_jwt_token_' + Date.now();
    localStorage.setItem('kariri_auth_token', token);
    localStorage.setItem('kariri_user_profile', JSON.stringify(user));
    return { user, token };
  },

  mockRegister(data: RegisterData): AuthResponse {
    const newUser: User = {
      id: Math.floor(Math.random() * 1000) + 10,
      name: data.name,
      email: data.email,
      role: 'user',
      city_preference: data.city_preference || 'Crato',
      created_at: new Date().toISOString(),
    };
    const token = 'mock_jwt_token_' + Date.now();
    localStorage.setItem('kariri_auth_token', token);
    localStorage.setItem('kariri_user_profile', JSON.stringify(newUser));
    return { user: newUser, token };
  },
};
