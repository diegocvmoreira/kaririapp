import { apiClient, simulateNetworkDelay, USE_MOCK_DATA, ApiError } from './config';
import { Category } from '../../types';
import { mockCategories } from '../../mocks/mockCategories';
import { mapApiCategoryToCategory, ApiCategoryRaw } from './mappers/categoryMapper';

export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    // Fallback para mock somente quando VITE_USE_MOCK_DATA=true ou quando offline
    if (USE_MOCK_DATA) {
      return simulateNetworkDelay(mockCategories, 80);
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return mockCategories;
    }

    const response = await apiClient<unknown>('/categories');
    const list = Array.isArray(response)
      ? response
      : (response as { data?: unknown[] })?.data || [];

    return list.map((item) => mapApiCategoryToCategory(item as ApiCategoryRaw));
  },

  async getBySlug(slug: string): Promise<Category | null> {
    if (USE_MOCK_DATA) {
      const category = mockCategories.find((c) => c.slug === slug) || null;
      return simulateNetworkDelay(category, 80);
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return mockCategories.find((c) => c.slug === slug) || null;
    }

    try {
      const response = await apiClient<unknown>(`/categories/${slug}`);
      const raw = (response as { data?: ApiCategoryRaw })?.data || (response as ApiCategoryRaw);
      if (raw && raw.id) {
        return mapApiCategoryToCategory(raw);
      }
      return null;
    } catch (err: unknown) {
      // Se endpoint específico de slug não existir (404), busca na lista geral do endpoint /categories
      if (err instanceof ApiError && err.status === 404) {
        const all = await this.getAll();
        return all.find((c) => c.slug === slug) || null;
      }
      throw err;
    }
  },
};
