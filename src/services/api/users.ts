import { apiClient, simulateNetworkDelay, USE_MOCK_DATA, ApiError } from './config';
import { User, UserRole } from '../../types';
import { mockUser } from '../../mocks/mockUser';

const MOCK_USERS_LIST: User[] = [
  mockUser,
  {
    id: 2,
    name: 'Maria Cecília Silva',
    email: 'cecilia.cariri@example.com',
    role: 'business',
    status: 'active',
    city_preference: 'Juazeiro do Norte',
    created_at: '2026-02-10',
  },
  {
    id: 3,
    name: 'José Ferreira dos Santos',
    email: 'teste-mvp-20261009@example.com',
    role: 'user',
    status: 'active',
    city_preference: 'Barbalha',
    created_at: '2026-03-01',
  },
  {
    id: 4,
    name: 'Ana Beatriz Alencar',
    email: 'anabeatriz@chapada.org.br',
    role: 'user',
    status: 'inactive',
    city_preference: 'Crato',
    created_at: '2026-03-15',
  },
];

export interface UsersFilterParams {
  query?: string;
  role?: string;
  status?: string;
  page?: number;
}

export interface UsersListResult {
  users: User[];
  total: number;
}

export const usersApi = {
  async getAll(params?: UsersFilterParams): Promise<UsersListResult> {
    if (USE_MOCK_DATA) {
      let filtered = [...MOCK_USERS_LIST];
      if (params?.query) {
        const q = params.query.toLowerCase().trim();
        filtered = filtered.filter(
          (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        );
      }
      if (params?.role && params.role !== 'all') {
        filtered = filtered.filter((u) => u.role === params.role);
      }
      if (params?.status && params.status !== 'all') {
        filtered = filtered.filter((u) => u.status === params.status);
      }
      return simulateNetworkDelay({ users: filtered, total: filtered.length }, 100);
    }

    try {
      const searchParams = new URLSearchParams();
      if (params?.query) searchParams.set('q', params.query);
      if (params?.role && params.role !== 'all') searchParams.set('role', params.role);
      if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
      if (params?.page) searchParams.set('page', String(params.page));

      const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const response = await apiClient<unknown>(`/admin/users${queryStr}`);

      let list: User[] = [];
      let total = 0;

      if (Array.isArray(response)) {
        list = response as User[];
        total = list.length;
      } else if (response && typeof response === 'object') {
        const obj = response as { data?: User[]; meta?: { total?: number }; total?: number };
        if (Array.isArray(obj.data)) {
          list = obj.data;
          total = obj.meta?.total || obj.total || list.length;
        }
      }

      return { users: list, total };
    } catch (error: unknown) {
      throw error;
    }
  },

  async updateRole(id: number, role: UserRole): Promise<boolean> {
    if (USE_MOCK_DATA) {
      const user = MOCK_USERS_LIST.find((u) => u.id === id);
      if (user) user.role = role;
      return simulateNetworkDelay(true, 80);
    }

    await apiClient(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
    return true;
  },

  async updateStatus(id: number, status: 'active' | 'inactive'): Promise<boolean> {
    if (USE_MOCK_DATA) {
      const user = MOCK_USERS_LIST.find((u) => u.id === id);
      if (user) user.status = status;
      return simulateNetworkDelay(true, 80);
    }

    await apiClient(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return true;
  },
};
