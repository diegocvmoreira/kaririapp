import { apiClient, simulateNetworkDelay, USE_MOCK_DATA, ApiError } from './config';
import { User, UserStatus } from '../../types';
import { mockUser } from '../../mocks/mockUser';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  birth_city_id?: number | null;
  birth_city_name?: string | null;
  current_city_id?: number | null;
  current_city_name?: string | null;
  cariri_city_id?: number | null;
  city_preference?: string;
  marketing_consent?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  requires_verification?: boolean;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

export interface PasswordActionResponse {
  message: string;
}

// Controle de tentativas para rate limiting local contra automação
let authAttemptTimestamps: number[] = [];

function checkClientRateLimit(): boolean {
  const now = Date.now();
  // Limpa tentativas mais velhas que 60 segundos
  authAttemptTimestamps = authAttemptTimestamps.filter((t) => now - t < 60000);
  if (authAttemptTimestamps.length >= 10) {
    return false;
  }
  authAttemptTimestamps.push(now);
  return true;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (!checkClientRateLimit()) {
      throw new ApiError(
        429,
        'Muitas tentativas em curto período. Por favor, aguarde alguns instantes antes de tentar novamente.',
        { rate_limit: true },
        '/login'
      );
    }

    if (USE_MOCK_DATA) {
      return this.mockLogin(credentials);
    }

    try {
      const data = await apiClient<AuthResponse>('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (data.user?.status === 'suspended') {
        throw new ApiError(
          403,
          'Sua conta foi temporariamente suspensa por motivos de moderação. Entre em contato com o suporte.',
          { status: 'suspended' },
          '/login'
        );
      }

      localStorage.setItem('kariri_auth_token', data.token);
      localStorage.setItem('kariri_user_profile', JSON.stringify(data.user));
      return data;
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 422) {
        // Mensagem genérica para evitar enumeração de contas
        throw new ApiError(401, 'Credenciais inválidas. Verifique os dados informados.', {}, '/login');
      }
      throw err;
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    if (!checkClientRateLimit()) {
      throw new ApiError(
        429,
        'Muitas tentativas em curto período. Por favor, aguarde alguns instantes antes de cadastrar.',
        { rate_limit: true },
        '/register'
      );
    }

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
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 422) {
        const errorData = err.data as { errors?: Record<string, string[]> } | undefined;
        if (errorData?.errors?.email) {
          // Mensagem protegida contra enumeração invasiva de emails
          throw new ApiError(
            422,
            'Não foi possível concluir o cadastro com este e-mail. Se já possui cadastro, recupere sua senha ou utilize outro e-mail.',
            err.data,
            '/register'
          );
        }
      }
      throw err;
    }
  },

  async forgotPassword(email: string): Promise<PasswordActionResponse> {
    if (!checkClientRateLimit()) {
      throw new ApiError(
        429,
        'Muitas tentativas em curto período. Por favor, aguarde alguns instantes antes de tentar novamente.',
        { rate_limit: true },
        '/forgot-password'
      );
    }

    if (USE_MOCK_DATA) {
      return this.mockForgotPassword(email);
    }

    try {
      const res = await apiClient<PasswordActionResponse>('/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // Mensagem genérica padronizada para evitar enumeração de contas
      return {
        message: 'Se o e-mail informado estiver cadastrado, você receberá um link com instruções para redefinir sua senha.',
      };
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 429) {
        throw new ApiError(
          429,
          'Muitas tentativas em curto período. Por favor, aguarde alguns instantes antes de tentar novamente.',
          err.data,
          '/forgot-password'
        );
      }
      // Sempre retorna a mesma mensagem para evitar enumeração, a menos que seja 429
      return {
        message: 'Se o e-mail informado estiver cadastrado, você receberá um link com instruções para redefinir sua senha.',
      };
    }
  },

  async resetPassword(data: ResetPasswordData): Promise<PasswordActionResponse> {
    if (!checkClientRateLimit()) {
      throw new ApiError(
        429,
        'Muitas tentativas em curto período. Por favor, aguarde alguns instantes antes de tentar novamente.',
        { rate_limit: true },
        '/reset-password'
      );
    }

    if (USE_MOCK_DATA) {
      return this.mockResetPassword(data);
    }

    try {
      const res = await apiClient<PasswordActionResponse>('/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          token: data.token,
          password: data.password,
          password_confirmation: data.password_confirmation,
        }),
      });
      return {
        message: res.message || 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.',
      };
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          throw new ApiError(
            429,
            'Muitas tentativas em curto período. Por favor, aguarde alguns instantes antes de tentar novamente.',
            err.data,
            '/reset-password'
          );
        }
        if (err.status === 400 || err.status === 422) {
          const errData = err.data as { errors?: Record<string, string[]>; message?: string } | undefined;
          const msg = errData?.message || (errData?.errors ? Object.values(errData.errors).flat().join(', ') : '');
          if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('expir') || msg.toLowerCase().includes('inválid')) {
            throw new ApiError(
              400,
              'O token de recuperação é inválido ou expirou. Por favor, solicite um novo link.',
              err.data,
              '/reset-password'
            );
          }
        }
      }
      throw err;
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
      localStorage.setItem('kariri_user_profile', JSON.stringify(user));
      return user;
    } catch {
      localStorage.removeItem('kariri_auth_token');
      localStorage.removeItem('kariri_user_profile');
      return null;
    }
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const current = await this.getCurrentUser();
    if (!current) {
      throw new Error('Usuário não autenticado.');
    }

    if (USE_MOCK_DATA) {
      const updatedUser: User = {
        ...current,
        ...updates,
      };
      localStorage.setItem('kariri_user_profile', JSON.stringify(updatedUser));
      return simulateNetworkDelay(updatedUser, 100);
    }

    const updatedUser = await apiClient<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    localStorage.setItem('kariri_user_profile', JSON.stringify(updatedUser));
    return updatedUser;
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
    // Simula bloqueio de conta suspensa caso especificado no email
    if (credentials.email.toLowerCase().includes('suspenso')) {
      throw new ApiError(
        403,
        'Esta conta está suspensa por moderação. Entre em contato com o suporte do Kariri.app.',
        { status: 'suspended' },
        '/login'
      );
    }

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
    const nowIso = new Date().toISOString();
    const newUser: User = {
      id: Math.floor(Math.random() * 1000) + 10,
      name: data.name,
      email: data.email,
      role: 'user',
      status: 'active' as UserStatus,
      birth_city_id: data.birth_city_id ?? null,
      birth_city_name: data.birth_city_name ?? null,
      current_city_id: data.current_city_id ?? null,
      current_city_name: data.current_city_name ?? null,
      cariri_city_id: data.cariri_city_id ?? null,
      city_preference: data.city_preference || (data.cariri_city_id ? undefined : 'Todo o Cariri'),
      marketing_consent: Boolean(data.marketing_consent),
      marketing_consent_at: data.marketing_consent ? nowIso : null,
      email_verified_at: null, // Conta recém-criada, pendente de confirmação por email
      created_at: nowIso,
    };
    const token = 'mock_jwt_token_' + Date.now();
    localStorage.setItem('kariri_auth_token', token);
    localStorage.setItem('kariri_user_profile', JSON.stringify(newUser));
    return { user: newUser, token, requires_verification: true };
  },

  async mockForgotPassword(email: string): Promise<PasswordActionResponse> {
    await simulateNetworkDelay(null, 400);

    // Salva token simulado no localStorage para permitir teste local completo de redefinição
    const demoToken = 'mock_valid_token_' + Math.random().toString(36).substring(2, 9);
    try {
      localStorage.setItem('kariri_mock_reset_token', JSON.stringify({ token: demoToken, email }));
      console.info(
        `[MOCK RECUPERAÇÃO DE SENHA] Link gerado para testes:\n/redefinir-senha?token=${demoToken}&email=${encodeURIComponent(email)}`
      );
    } catch {
      // ignore
    }

    return {
      message: 'Se o e-mail informado estiver cadastrado, você receberá um link com instruções para redefinir sua senha.',
    };
  },

  async mockResetPassword(data: ResetPasswordData): Promise<PasswordActionResponse> {
    await simulateNetworkDelay(null, 400);

    // Permite testar estado de token expirado com a palavra 'expirado' ou 'invalido'
    if (data.token.includes('expirado') || data.token.includes('invalido')) {
      throw new ApiError(
        400,
        'O token de recuperação é inválido ou expirou. Por favor, solicite um novo link.',
        { token: 'invalid_or_expired' },
        '/reset-password'
      );
    }

    if (data.password.length < 8) {
      throw new ApiError(
        422,
        'A senha deve conter no mínimo 8 caracteres para sua segurança.',
        { password: ['Mínimo 8 caracteres'] },
        '/reset-password'
      );
    }

    if (data.password !== data.password_confirmation) {
      throw new ApiError(
        422,
        'A confirmação de senha não coincide com a senha informada.',
        { password_confirmation: ['Não coincide'] },
        '/reset-password'
      );
    }

    // Limpa token mockado se existir
    try {
      localStorage.removeItem('kariri_mock_reset_token');
    } catch {
      // ignore
    }

    return {
      message: 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.',
    };
  },
};
