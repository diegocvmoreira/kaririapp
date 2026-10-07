import { apiClient, simulateNetworkDelay, USE_MOCK_DATA } from './config';
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
      const user: User = {
        ...mockUser,
        email: credentials.email || mockUser.email,
      };
      const token = 'mock_jwt_token_' + Date.now();
      localStorage.setItem('kariri_auth_token', token);
      localStorage.setItem('kariri_user_profile', JSON.stringify(user));
      return simulateNetworkDelay({ user, token }, 200);
    }

    const data = await apiClient<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    localStorage.setItem('kariri_auth_token', data.token);
    return data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    if (USE_MOCK_DATA) {
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
      return simulateNetworkDelay({ user: newUser, token }, 200);
    }

    const res = await apiClient<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localStorage.setItem('kariri_auth_token', res.token);
    return res;
  },

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('kariri_auth_token');
    if (!token) return null;

    if (USE_MOCK_DATA) {
      try {
        const stored = localStorage.getItem('kariri_user_profile');
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // ignore
      }
      return mockUser;
    }

    try {
      const user = await apiClient<User>('/me');
      return user;
    } catch {
      localStorage.removeItem('kariri_auth_token');
      return null;
    }
  },

  async logout(): Promise<void> {
    if (USE_MOCK_DATA) {
      localStorage.removeItem('kariri_auth_token');
      localStorage.removeItem('kariri_user_profile');
      return simulateNetworkDelay(undefined, 100);
    }

    try {
      await apiClient('/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('kariri_auth_token');
      localStorage.removeItem('kariri_user_profile');
    }
  },
};
