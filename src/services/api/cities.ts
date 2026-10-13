import { apiClient, simulateNetworkDelay, USE_MOCK_DATA, ApiError } from './config';
import { City } from '../../types';
import { mockCities } from '../../mocks/mockCities';
import { mapApiCityToCity, ApiCityRaw } from './mappers/cityMapper';

let inMemoryCities = [...mockCities];

export const citiesApi = {
  async getAll(): Promise<City[]> {
    if (USE_MOCK_DATA) {
      return simulateNetworkDelay(inMemoryCities, 80);
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
      const active = inMemoryCities.filter((c) => c.is_active);
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

  async getCaririCities(): Promise<City[]> {
    const all = await this.getAll();
    return all.filter((c) => c.is_cariri_region === true && c.is_active);
  },

  async getBySlug(slug: string): Promise<City | null> {
    if (USE_MOCK_DATA) {
      const city = inMemoryCities.find((c) => c.slug === slug) || null;
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

  /**
   * Busca cidades por termo (nome, estado ou país), permitindo desambiguação de homônimos.
   * Funciona tanto para cidades do Cariri quanto para qualquer cidade do Brasil e do exterior.
   */
  async search(query: string): Promise<City[]> {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) {
      return this.getActive();
    }

    if (USE_MOCK_DATA) {
      const filtered = inMemoryCities.filter((city) => {
        const nameMatch = city.name.toLowerCase().includes(normalizedQuery);
        const stateMatch = city.state.toLowerCase().includes(normalizedQuery);
        const countryMatch = (city.country || 'Brasil').toLowerCase().includes(normalizedQuery);
        const combined = `${city.name} ${city.state} ${city.country || ''}`.toLowerCase();
        return nameMatch || stateMatch || countryMatch || combined.includes(normalizedQuery);
      });
      return simulateNetworkDelay(filtered, 80);
    }

    try {
      const response = await apiClient<unknown>(`/cities/search?q=${encodeURIComponent(query)}`);
      const list = Array.isArray(response)
        ? response
        : (response as { data?: unknown[] })?.data || [];
      return list.map((item) => mapApiCityToCity(item as ApiCityRaw));
    } catch {
      const all = await this.getAll();
      return all.filter((city) => {
        const combined = `${city.name} ${city.state} ${city.country || ''}`.toLowerCase();
        return combined.includes(normalizedQuery);
      });
    }
  },

  /**
   * Criação administrativa de cidade
   */
  async create(data: Partial<City>): Promise<City> {
    if (USE_MOCK_DATA) {
      const newId = Math.max(...inMemoryCities.map((c) => c.id), 0) + 1;
      const slug = data.slug || data.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `cidade-${newId}`;
      const newCity: City = {
        id: newId,
        name: data.name || 'Nova Cidade',
        slug,
        state: (data.state || 'CE').toUpperCase(),
        country: data.country || 'Brasil',
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        image: data.image,
        status: data.status || 'active',
        is_active: data.is_active ?? true,
        is_cariri_region: data.is_cariri_region ?? false,
        places_count: 0,
        events_count: 0,
      };
      inMemoryCities.push(newCity);
      return simulateNetworkDelay(newCity, 100);
    }

    const response = await apiClient<unknown>('/admin/cities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const raw = (response as { data?: ApiCityRaw })?.data || (response as ApiCityRaw);
    return mapApiCityToCity(raw);
  },

  /**
   * Atualização administrativa de cidade
   */
  async update(id: number, data: Partial<City>): Promise<City> {
    if (USE_MOCK_DATA) {
      const index = inMemoryCities.findIndex((c) => c.id === id);
      if (index === -1) {
        throw new Error(`Cidade ID ${id} não encontrada.`);
      }
      const updated: City = {
        ...inMemoryCities[index],
        ...data,
        id,
      };
      inMemoryCities[index] = updated;
      return simulateNetworkDelay(updated, 100);
    }

    const response = await apiClient<unknown>(`/admin/cities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const raw = (response as { data?: ApiCityRaw })?.data || (response as ApiCityRaw);
    return mapApiCityToCity(raw);
  },

  /**
   * Exclusão ou desativação administrativa de cidade
   */
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    if (USE_MOCK_DATA) {
      inMemoryCities = inMemoryCities.filter((c) => c.id !== id);
      return simulateNetworkDelay({ success: true, message: 'Cidade excluída com sucesso.' }, 100);
    }

    await apiClient(`/admin/cities/${id}`, {
      method: 'DELETE',
    });
    return { success: true, message: 'Cidade removida do sistema.' };
  },
};
