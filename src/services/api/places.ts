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

  /**
   * 6. placesApi.create (Admin CRUD)
   * Cria um novo local via POST /admin/places
   */
  async create(data: Partial<Place>): Promise<Place> {
    if (USE_MOCK_DATA) {
      const newPlace: Place = {
        id: Date.now(),
        owner_id: null,
        name: data.name || 'Novo Local',
        slug: data.slug || (data.name ? data.name.toLowerCase().replace(/\s+/g, '-') : `local-${Date.now()}`),
        short_description: data.short_description || '',
        description: data.description || '',
        category_id: data.category_id || 1,
        category_name: data.category_name || 'Gastronomia',
        category_slug: data.category_slug || 'gastronomia',
        city_id: data.city_id || 1,
        city_name: data.city_name || 'Crato',
        city_slug: data.city_slug || 'crato',
        neighborhood: data.neighborhood || '',
        address: data.address || '',
        zipcode: data.zipcode,
        latitude: data.latitude || -7.2341,
        longitude: data.longitude || -39.4124,
        cover_image: data.cover_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
        images: data.images || [data.cover_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80'],
        rating: 5.0,
        reviews_count: 0,
        price_level: data.price_level || 2,
        is_featured: !!data.is_featured,
        is_open_now: true,
        opening_hours: data.opening_hours || '',
        phone: data.phone,
        whatsapp: data.whatsapp,
        instagram: data.instagram,
        facebook: data.facebook,
        website: data.website,
        status: data.status || 'published',
        tags: data.tags || [],
      };
      mockPlaces.unshift(newPlace);
      return simulateNetworkDelay(newPlace, 150);
    }

    const payload = {
      name: data.name,
      slug: data.slug,
      city_id: data.city_id,
      category_id: data.category_id,
      short_description: data.short_description,
      description: data.description,
      address: data.address,
      neighborhood: data.neighborhood,
      zipcode: data.zipcode,
      latitude: data.latitude,
      longitude: data.longitude,
      phone: data.phone,
      whatsapp: data.whatsapp,
      website: data.website,
      instagram: data.instagram,
      facebook: data.facebook,
      opening_hours: data.opening_hours,
      price_level: data.price_level,
      status: data.status,
      featured: data.is_featured ? 1 : 0,
      cover_image: data.cover_image,
      image: data.cover_image,
    };

    const response = await apiClient<unknown>('/admin/places', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const raw = (response as { data?: ApiPlaceRaw })?.data || (response as ApiPlaceRaw);
    return mapApiPlaceToPlace(raw);
  },

  /**
   * 7. placesApi.getById (Admin CRUD)
   * Busca um local por ID via GET /admin/places/{id}
   */
  async getById(id: number): Promise<Place> {
    if (USE_MOCK_DATA) {
      const match = mockPlaces.find((p) => p.id === id);
      if (!match) throw new Error('Local não encontrado');
      return simulateNetworkDelay(match, 100);
    }

    const response = await apiClient<unknown>(`/admin/places/${id}`);
    const raw = (response as { data?: ApiPlaceRaw })?.data || (response as ApiPlaceRaw);
    return mapApiPlaceToPlace(raw);
  },

  /**
   * 8. placesApi.update (Admin CRUD)
   * Atualiza um local existente via PUT /admin/places/{id}
   */
  async update(id: number, data: Partial<Place>): Promise<Place> {
    if (USE_MOCK_DATA) {
      const index = mockPlaces.findIndex((p) => p.id === id);
      if (index === -1) throw new Error('Local não encontrado');
      mockPlaces[index] = { ...mockPlaces[index], ...data };
      return simulateNetworkDelay(mockPlaces[index], 120);
    }

    const payload = {
      name: data.name,
      slug: data.slug,
      city_id: data.city_id,
      category_id: data.category_id,
      short_description: data.short_description,
      description: data.description,
      address: data.address,
      neighborhood: data.neighborhood,
      zipcode: data.zipcode,
      latitude: data.latitude,
      longitude: data.longitude,
      phone: data.phone,
      whatsapp: data.whatsapp,
      website: data.website,
      instagram: data.instagram,
      facebook: data.facebook,
      opening_hours: data.opening_hours,
      price_level: data.price_level,
      status: data.status,
      featured: data.is_featured !== undefined ? (data.is_featured ? 1 : 0) : undefined,
      cover_image: data.cover_image,
      image: data.cover_image,
    };

    const response = await apiClient<unknown>(`/admin/places/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    const raw = (response as { data?: ApiPlaceRaw })?.data || (response as ApiPlaceRaw);
    return mapApiPlaceToPlace(raw);
  },

  /**
   * 9. placesApi.delete (Admin CRUD)
   * Remove um local via DELETE /admin/places/{id}
   */
  async delete(id: number): Promise<boolean> {
    if (USE_MOCK_DATA) {
      const index = mockPlaces.findIndex((p) => p.id === id);
      if (index !== -1) {
        mockPlaces.splice(index, 1);
      }
      return simulateNetworkDelay(true, 100);
    }

    await apiClient(`/admin/places/${id}`, {
      method: 'DELETE',
    });
    return true;
  },

  /**
   * 10. placesApi.updateStatus (Admin CRUD)
   * Altera status de publicação de um local
   */
  async updateStatus(id: number, status: Place['status']): Promise<boolean> {
    return this.update(id, { status }).then(() => true);
  },
};
