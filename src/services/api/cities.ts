import { apiClient, simulateNetworkDelay, USE_MOCK_DATA } from './config';
import { City } from '../../types';
import { mockCities } from '../../mocks/mockCities';

export const citiesApi = {
  async getAll(): Promise<City[]> {
    if (USE_MOCK_DATA) {
      return simulateNetworkDelay(mockCities, 80);
    }
    return apiClient<City[]>('/cities');
  },

  async getActive(): Promise<City[]> {
    if (USE_MOCK_DATA) {
      const active = mockCities.filter((c) => c.is_active);
      return simulateNetworkDelay(active, 80);
    }
    return apiClient<City[]>('/cities?active=1');
  },

  async getBySlug(slug: string): Promise<City | null> {
    if (USE_MOCK_DATA) {
      const city = mockCities.find((c) => c.slug === slug) || null;
      return simulateNetworkDelay(city, 80);
    }
    return apiClient<City>(`/cities/${slug}`);
  },
};
