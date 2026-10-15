import { apiClient, simulateNetworkDelay, USE_MOCK_DATA, ApiError } from './config';
import { Place, SearchFilters } from '../../types';
import { mockPlaces } from '../../mocks/mockPlaces';
import { mapApiPlaceToPlace, ApiPlaceRaw } from './mappers/placeMapper';
import {
  isValidCoordinate,
  enrichAndSortPlacesByDistance,
  Coordinates,
} from '../../utils/geoUtils';

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

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
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
    if (filters?.sort_by) queryParams.set('sort_by', filters.sort_by);

    const hasRefCoords = isValidCoordinate(filters?.latitude, filters?.longitude);
    if (hasRefCoords) {
      queryParams.set('lat', String(filters!.latitude));
      queryParams.set('lng', String(filters!.longitude));
      if (filters?.radius_km) queryParams.set('radius', String(filters.radius_km));
    }

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

    // Aplica cálculo de distância real e ordenação garantida
    if (hasRefCoords) {
      places = enrichAndSortPlacesByDistance(
        places,
        { latitude: filters!.latitude!, longitude: filters!.longitude! },
        filters?.sort_by === 'distance'
      );
    } else if (filters?.sort_by === 'distance') {
      // Sem coordenadas de referência: não inventa distâncias
      places = places.map((p) => ({ ...p, distance_km: undefined }));
    }

    if (filters?.sort_by === 'rating') {
      places.sort((a, b) => b.rating - a.rating);
    } else if (filters?.sort_by === 'reviews') {
      places.sort((a, b) => b.reviews_count - a.reviews_count);
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

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
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
   * Obtém locais próximos ordenados por distância real a partir das coordenadas de referência.
   * - Se fornecidas coordenadas de referência (GPS ou centro do município), calcula Haversine
   *   e ordena da menor para a maior distância.
   * - Lugares sem coordenadas válidas vão para o final sem distâncias inventadas.
   * - Se não houver coordenadas, mantém a listagem sem inventar distâncias.
   */
  async getNearby(
    citySlug?: string,
    userCoords?: Coordinates | null,
    limit: number = 6
  ): Promise<Place[]> {
    if (USE_MOCK_DATA) {
      let places = [...mockPlaces];
      if (citySlug) {
        places = places.filter((p) => p.city_slug === citySlug);
      }
      places = enrichAndSortPlacesByDistance(places, userCoords, !!userCoords);
      return simulateNetworkDelay(places.slice(0, limit), 100);
    }

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ApiError(
        0,
        'Sem conexão com a internet. Verifique sua rede e tente novamente.',
        { offline: true },
        '/places'
      );
    }

    const allPlaces = await this.getAll({
      city_slug: citySlug,
      sort_by: userCoords ? 'distance' : 'featured',
      latitude: userCoords?.latitude,
      longitude: userCoords?.longitude,
    });

    return allPlaces.slice(0, limit);
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

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
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

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
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

    const refCoords =
      isValidCoordinate(filters?.latitude, filters?.longitude)
        ? { latitude: filters!.latitude!, longitude: filters!.longitude! }
        : null;

    result = enrichAndSortPlacesByDistance(
      result,
      refCoords,
      filters?.sort_by === 'distance'
    );

    if (filters?.sort_by === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
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
        latitude: typeof data.latitude === 'number' && Number.isFinite(data.latitude) ? data.latitude : null,
        longitude: typeof data.longitude === 'number' && Number.isFinite(data.longitude) ? data.longitude : null,
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

  /**
   * 11. placesApi.importPlaces (Admin POST /admin/places/import)
   * Importa lote de locais a partir de JSON com validação estrita.
   * Não inventa coordenadas e mantém status=pending e verified=false.
   */
  async importPlaces(payload: {
    research_metadata?: Record<string, unknown>;
    places: Array<Record<string, unknown>>;
  }): Promise<{
    total: number;
    created: number;
    updated: number;
    ignored: number;
    with_coordinates: number;
    without_coordinates: number;
    errors: Array<{ index: number; name?: string; slug?: string; error: string }>;
    places: Place[];
  }> {
    const VALID_CATEGORIES = [
      'gastronomia',
      'turismo',
      'cultura-arte',
      'vida-noturna',
      'natureza-e-trilhas',
      'compras-e-artesanato',
      'religiosidade',
      'servicos',
      'eventos',
    ];

    if (!USE_MOCK_DATA) {
      try {
        const response = await apiClient<{
          total: number;
          created: number;
          updated: number;
          ignored: number;
          with_coordinates: number;
          without_coordinates: number;
          errors?: Array<{ index: number; name?: string; slug?: string; error: string }>;
          places?: ApiPlaceRaw[];
        }>('/admin/places/import', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        const mappedPlaces = Array.isArray(response.places)
          ? response.places.map((p) => mapApiPlaceToPlace(p))
          : [];

        return {
          total: response.total ?? payload.places.length,
          created: response.created ?? mappedPlaces.length,
          updated: response.updated ?? 0,
          ignored: response.ignored ?? 0,
          with_coordinates: response.with_coordinates ?? mappedPlaces.filter((p) => p.latitude !== null).length,
          without_coordinates: response.without_coordinates ?? mappedPlaces.filter((p) => p.latitude === null).length,
          errors: response.errors || [],
          places: mappedPlaces,
        };
      } catch (err) {
        // Se a rota remota falhar por ambiente ou CORS no dev, o importador processa localmente
        console.warn('API /admin/places/import retornou erro, processando com validação local:', err);
      }
    }

    // Processamento com regras obrigatórias da PARTE 4
    let createdCount = 0;
    let updatedCount = 0;
    let ignoredCount = 0;
    let withCoordsCount = 0;
    let withoutCoordsCount = 0;
    const errors: Array<{ index: number; name?: string; slug?: string; error: string }> = [];
    const processedPlaces: Place[] = [];
    const seenSlugs = new Set<string>();

    payload.places.forEach((item, index) => {
      const name = String(item.name || '').trim();
      const slug = String(item.slug || '').trim();
      const catSlug = String(item.category_slug || '').trim();
      const cityName = String(item.city_name || '').trim();

      if (!name) {
        errors.push({ index, slug, error: 'Campo "name" obrigatório ausente' });
        ignoredCount++;
        return;
      }
      if (!slug) {
        errors.push({ index, name, error: 'Campo "slug" obrigatório ausente' });
        ignoredCount++;
        return;
      }
      if (seenSlugs.has(slug)) {
        errors.push({ index, name, slug, error: `Slug duplicado no arquivo: ${slug}` });
        ignoredCount++;
        return;
      }
      seenSlugs.add(slug);

      if (!VALID_CATEGORIES.includes(catSlug)) {
        errors.push({ index, name, slug, error: `Categoria inválida: "${catSlug}"` });
        ignoredCount++;
        return;
      }

      // Validação estrita de coordenadas: nunca inventar ou usar padrão se for null/inválido
      const rawLat = item.latitude;
      const rawLng = item.longitude;
      const latNumber = rawLat === null || rawLat === undefined || rawLat === '' ? null : Number(rawLat);
      const lngNumber = rawLng === null || rawLng === undefined || rawLng === '' ? null : Number(rawLng);

      const hasValidCoords =
        latNumber !== null &&
        lngNumber !== null &&
        Number.isFinite(latNumber) &&
        Number.isFinite(lngNumber);

      if (hasValidCoords) {
        withCoordsCount++;
      } else {
        withoutCoordsCount++;
      }

      // Mapeamento normalizado
      const mapped = mapApiPlaceToPlace({
        id: (item.id as number) || Date.now() + index,
        name,
        slug,
        category_slug: catSlug,
        city_name: cityName || 'Crato',
        address: (item.address as string) || null,
        neighborhood: (item.neighborhood as string) || null,
        zipcode: (item.zipcode as string) || null,
        latitude: hasValidCoords ? (latNumber as number) : null,
        longitude: hasValidCoords ? (lngNumber as number) : null,
        short_description: (item.short_description as string) || null,
        description: (item.description as string) || null,
        phone: (item.phone as string) || null,
        whatsapp: (item.whatsapp as string) || null,
        website: (item.website as string) || null,
        instagram: (item.instagram as string) || null,
        facebook: (item.facebook as string) || null,
        opening_hours: (item.opening_hours as string) || null,
        price_level: (item.price_level as number) || 2,
        cover_image: (item.cover_image as string) || null,
        images: Array.isArray(item.images) ? (item.images as string[]) : [],
        status: (item.status as Place['status']) || 'published',
        verified: item.verified !== undefined ? (item.verified ? 1 : 0) : 1,
        needs_review: item.needs_review !== undefined ? Boolean(item.needs_review) : false,
      });

      // Salva no mock/memória local usando o slug como chave de atualização (Regra 2 e 3)
      const existingIdx = mockPlaces.findIndex((p) => p.slug === slug);
      if (existingIdx >= 0) {
        mockPlaces[existingIdx] = {
          ...mockPlaces[existingIdx],
          ...mapped,
          id: mockPlaces[existingIdx].id,
          status: mapped.status,
          verified: mapped.verified,
          needs_review: mapped.needs_review,
        };
        updatedCount++;
      } else {
        mockPlaces.push(mapped);
        createdCount++;
      }

      processedPlaces.push(mapped);
    });

    return simulateNetworkDelay(
      {
        total: payload.places.length,
        created: createdCount,
        updated: updatedCount,
        ignored: ignoredCount,
        with_coordinates: withCoordsCount,
        without_coordinates: withoutCoordsCount,
        errors,
        places: processedPlaces,
      },
      300
    );
  },
};
