import { apiClient, simulateNetworkDelay, USE_MOCK_DATA, ApiError } from './config';
import { Place, SearchFilters } from '../../types';
import { mockPlaces } from '../../mocks/mockPlaces';
import { mapApiPlaceToPlace, ApiPlaceRaw } from './mappers/placeMapper';

export const placesApi = {
  /**
   * 1. placesApi.getAll
   * Busca a lista de locais. Trata 403, 404, 422 e erro de rede.
   * Não faz fallback silencioso para dados falsos quando VITE_USE_MOCK_DATA=false.
   */
  async getAll(filters?: SearchFilters): Promise<Place[]> {
    if (USE_MOCK_DATA) {
      return this.filterMockPlaces(filters);
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ApiError(
        0,
        'Sem conexão com a internet. Verifique sua rede e tente novamente.',
        { offline: true },
        '/places'
      );
    }

    // Chamada real à API
    const queryParams = new URLSearchParams();
    if (filters?.city_slug) queryParams.set('city', filters.city_slug);
    if (filters?.category_slug) queryParams.set('category', filters.category_slug);
    if (filters?.min_rating) queryParams.set('min_rating', String(filters.min_rating));
    if (filters?.open_now) queryParams.set('open_now', '1');
    if (filters?.query) queryParams.set('q', filters.query);

    const url = queryParams.toString() ? `/places?${queryParams.toString()}` : '/places';
    const response = await apiClient<unknown>(url);

    const list = Array.isArray(response)
      ? response
      : (response as { data?: unknown[] })?.data || [];

    let places = list.map((item) => mapApiPlaceToPlace(item as ApiPlaceRaw));

    // Aplica filtros em memória caso o backend ainda não suporte todos os query params
    if (filters?.city_slug) {
      places = places.filter((p) => p.city_slug === filters.city_slug);
    }
    if (filters?.category_slug) {
      places = places.filter((p) => p.category_slug === filters.category_slug);
    }
    if (filters?.min_rating) {
      places = places.filter((p) => p.rating >= (filters.min_rating || 0));
    }
    if (filters?.open_now) {
      places = places.filter((p) => p.is_open_now);
    }
    if (filters?.price_levels && filters.price_levels.length > 0) {
      places = places.filter((p) => filters.price_levels!.includes(p.price_level));
    }

    return places;
  },

  /**
   * 2. placesApi.getFeatured
   * Obtém locais destacados reais. Evita colisão com a rota /places/{slug}.
   * Trata 403, 404, 422 e erro de rede sem fallback falso.
   */
  async getFeatured(): Promise<Place[]> {
    if (USE_MOCK_DATA) {
      const featured = mockPlaces.filter((p) => p.is_featured);
      return simulateNetworkDelay(featured, 100);
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ApiError(
        0,
        'Sem conexão com a internet. Verifique sua rede e tente novamente.',
        { offline: true },
        '/places'
      );
    }

    const allPlaces = await this.getAll({ sort_by: 'featured' });
    const featuredOnly = allPlaces.filter((p) => p.is_featured);
    return featuredOnly.length > 0 ? featuredOnly : allPlaces.slice(0, 4);
  },

  /**
   * 3. placesApi.getNearby
   * Obtém locais próximos. Filtra por município se informado.
   * Trata 403, 404, 422 e erro de rede sem fallback falso.
   */
  async getNearby(citySlug?: string): Promise<Place[]> {
    if (USE_MOCK_DATA) {
      let places = [...mockPlaces];
      if (citySlug) {
        places = places.filter((p) => p.city_slug === citySlug);
      }
      places.sort((a, b) => (a.distance_km || 99) - (b.distance_km || 99));
      return simulateNetworkDelay(places.slice(0, 6), 100);
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ApiError(
        0,
        'Sem conexão com a internet. Verifique sua rede e tente novamente.',
        { offline: true },
        '/places'
      );
    }

    const allPlaces = await this.getAll({ city_slug: citySlug, sort_by: 'distance' });
    return allPlaces.slice(0, 6);
  },

  /**
   * 4. placesApi.getBySlug
   * Busca detalhes de um local específico por slug na API Laravel.
   * Trata 404 (não encontrado), 403 (não permitido), 422 e erros de rede.
   * Repassa o ApiError para permitir diagnóstico detalhado da rota/registro.
   */
  async getBySlug(slug: string): Promise<Place | null> {
    if (USE_MOCK_DATA) {
      const place = mockPlaces.find((p) => p.slug === slug) || null;
      return simulateNetworkDelay(place, 120);
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ApiError(
        0,
        'Sem conexão com a internet. Verifique sua rede e tente novamente.',
        { offline: true },
        `/places/${slug}`
      );
    }

    const response = await apiClient<unknown>(`/places/${slug}`);
    const raw = (response as { data?: ApiPlaceRaw })?.data || (response as ApiPlaceRaw);

    if (raw && raw.id) {
      return mapApiPlaceToPlace(raw);
    }
    return null;
  },

  /**
   * 5. placesApi.getSimilar
   * Obtém estabelecimentos semelhantes na mesma categoria a partir dos dados reais.
   * Trata 403, 404, 422 e erro de rede sem fallback falso.
   */
  async getSimilar(placeId: number, categorySlug: string): Promise<Place[]> {
    if (USE_MOCK_DATA) {
      const similar = mockPlaces.filter(
        (p) => p.id !== placeId && p.category_slug === categorySlug
      );
      return simulateNetworkDelay(similar.slice(0, 4), 100);
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ApiError(
        0,
        'Sem conexão com a internet. Verifique sua rede e tente novamente.',
        { offline: true },
        '/places'
      );
    }

    const all = await this.getAll({ category_slug: categorySlug });
    return all.filter((p) => p.id !== placeId).slice(0, 4);
  },

  filterMockPlaces(filters?: SearchFilters): Place[] {
    let result = [...mockPlaces];

    if (filters?.city_slug) {
      result = result.filter((p) => p.city_slug === filters.city_slug);
    }
    if (filters?.category_slug) {
      result = result.filter((p) => p.category_slug === filters.category_slug);
    }
    if (filters?.min_rating) {
      result = result.filter((p) => p.rating >= (filters.min_rating || 0));
    }
    if (filters?.open_now) {
      result = result.filter((p) => p.is_open_now);
    }
    if (filters?.price_levels && filters.price_levels.length > 0) {
      result = result.filter((p) => filters.price_levels!.includes(p.price_level));
    }

    if (filters?.sort_by === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (filters?.sort_by === 'distance') {
      result.sort((a, b) => (a.distance_km || 99) - (b.distance_km || 99));
    } else if (filters?.sort_by === 'reviews') {
      result.sort((a, b) => b.reviews_count - a.reviews_count);
    }

    return result;
  },
};
