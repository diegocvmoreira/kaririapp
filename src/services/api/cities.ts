import { apiClient, simulateNetworkDelay, USE_MOCK_DATA, ApiError } from './config';
import { City } from '../../types';
import { mockCities } from '../../mocks/mockCities';
import { mapApiCityToCity, ApiCityRaw } from './mappers/cityMapper';

export const citiesApi = {
  async getAll(): Promise<City[]> {
    if (USE_MOCK_DATA) {
      return simulateNetworkDelay(mockCities, 80);
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ApiError(0, 'Sem conexão com a internet.', { offline: true }, '/cities');
    }

    const response = await apiClient<unknown>('/cities');
    const list = Array.isArray(response)
      ? response
      : (response as { data?: unknown[] })?.data || [];

    return list.map((item) => mapApiCityToCity(item as ApiCityRaw));
  },

  async getActive(): Promise<City[]> {
    if (USE_MOCK_DATA) {
      const active = mockCities.filter((c) => c.is_active);
      return simulateNetworkDelay(active, 80);
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ApiError(0, 'Sem conexão com a internet.', { offline: true }, '/cities');
    }

    const response = await apiClient<unknown>('/cities');
    const list = Array.isArray(response)
      ? response
      : (response as { data?: unknown[] })?.data || [];

    const adapted = list.map((item) => mapApiCityToCity(item as ApiCityRaw));
    const activeOnly = adapted.filter((c) => c.is_active);
    return activeOnly.length > 0 ? activeOnly : adapted;
  },

  async getBySlug(slug: string): Promise<City | null> {
    if (USE_MOCK_DATA) {
      const city = mockCities.find((c) => c.slug === slug) || null;
      return simulateNetworkDelay(city, 80);
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ApiError(0, 'Sem conexão com a internet.', { offline: true }, `/cities/${slug}`);
    }

    try {
      const response = await apiClient<unknown>(`/cities/${slug}`);
      const raw = (response as { data?: ApiCityRaw })?.data || (response as ApiCityRaw);
      if (raw && raw.id) {
        return mapApiCityToCity(raw);
      }
      return null;
    } catch {
      // Se endpoint específico de slug não existir, busca na lista geral de /cities
      const all = await this.getAll();
      return all.find((c) => c.slug === slug) || null;
    }
  },
};
