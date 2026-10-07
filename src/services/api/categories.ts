import { apiClient, simulateNetworkDelay, USE_MOCK_DATA } from './config';
import { Category } from '../../types';
import { mockCategories } from '../../mocks/mockCategories';

export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    if (USE_MOCK_DATA) {
      return simulateNetworkDelay(mockCategories, 80);
    }
    return apiClient<Category[]>('/categories');
  },

  async getBySlug(slug: string): Promise<Category | null> {
    if (USE_MOCK_DATA) {
      const category = mockCategories.find((c) => c.slug === slug) || null;
      return simulateNetworkDelay(category, 80);
    }
    return apiClient<Category>(`/categories/${slug}`);
  },
};
