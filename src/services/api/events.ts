import { apiClient, simulateNetworkDelay, USE_MOCK_DATA, ApiError } from './config';
import { EventItem } from '../../types';
import { mockEvents } from '../../mocks/mockEvents';

export interface EventFilters {
  city_slug?: string;
  category?: string;
  is_featured?: boolean;
}

function adaptEvent(raw: Record<string, unknown>): EventItem {
  const mockMatch = mockEvents.find((m) => m.slug === raw.slug || m.id === raw.id);
  return {
    id: Number(raw.id),
    title: String(raw.title || mockMatch?.title || ''),
    slug: String(raw.slug || mockMatch?.slug || ''),
    description: String(raw.description || mockMatch?.description || ''),
    cover_image: String(raw.cover_image || raw.image || mockMatch?.cover_image || ''),
    start_date: String(raw.start_date || mockMatch?.start_date || ''),
    end_date: raw.end_date ? String(raw.end_date) : mockMatch?.end_date,
    display_date: String(raw.display_date || mockMatch?.display_date || ''),
    start_time: String(raw.start_time || mockMatch?.start_time || '19:00'),
    end_time: raw.end_time ? String(raw.end_time) : mockMatch?.end_time,
    place_name: String(raw.place_name || mockMatch?.place_name || 'Cariri'),
    city_name: String(raw.city_name || mockMatch?.city_name || 'Cariri'),
    city_slug: String(raw.city_slug || mockMatch?.city_slug || 'crato'),
    address: String(raw.address || mockMatch?.address || ''),
    price_text: String(raw.price_text || (raw.is_free ? 'Gratuito' : mockMatch?.price_text) || 'Gratuito'),
    price: raw.price !== undefined ? Number(raw.price) : mockMatch?.price,
    is_free: Boolean(raw.is_free ?? mockMatch?.is_free),
    ticket_url: (raw.ticket_url as string) || mockMatch?.ticket_url || undefined,
    organizer: String(raw.organizer || mockMatch?.organizer || 'Organização Local do Cariri'),
    category: String(raw.category || mockMatch?.category || 'Cultura & Tradição'),
    is_featured: Boolean(raw.is_featured ?? (raw.featured === 1 || mockMatch?.is_featured)),
  };
}

export const eventsApi = {
  /**
   * 1. eventsApi.getAll
   * Busca agenda de eventos. Suporta filtros por cidade e categoria.
   * Quando VITE_USE_MOCK_DATA=false, trata 404, 403, 422 e erros de rede sem fallback silencioso.
   */
  async getAll(filtersOrCity?: string | EventFilters, category?: string): Promise<EventItem[]> {
    const filters: EventFilters =
      typeof filtersOrCity === 'string'
        ? { city_slug: filtersOrCity || undefined, category }
        : filtersOrCity || {};

    if (USE_MOCK_DATA) {
      return this.filterMockEvents(filters);
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ApiError(
        0,
        'Sem conexão com a internet. Verifique sua rede e tente novamente.',
        { offline: true },
        '/events'
      );
    }

    const queryParams = new URLSearchParams();
    if (filters.city_slug && filters.city_slug !== 'all') {
      queryParams.set('city', filters.city_slug);
    }
    if (filters.category) {
      queryParams.set('category', filters.category);
    }
    if (filters.is_featured) {
      queryParams.set('featured', '1');
    }

    const url = queryParams.toString() ? `/events?${queryParams.toString()}` : '/events';
    const response = await apiClient<unknown>(url);

    const list = Array.isArray(response)
      ? response
      : (response as { data?: unknown[] })?.data || [];

    let adapted = list.map((item) => adaptEvent(item as Record<string, unknown>));

    if (filters.city_slug && filters.city_slug !== 'all') {
      adapted = adapted.filter((e) => e.city_slug === filters.city_slug);
    }
    if (filters.category) {
      adapted = adapted.filter(
        (e) => e.category.toLowerCase() === filters.category!.toLowerCase()
      );
    }

    return adapted;
  },

  /**
   * 2. eventsApi.getFeatured
   * Retorna eventos destacados na página inicial ou destaques de agenda.
   */
  async getFeatured(): Promise<EventItem[]> {
    if (USE_MOCK_DATA) {
      const featured = mockEvents.filter((e) => e.is_featured);
      return simulateNetworkDelay(featured, 100);
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ApiError(
        0,
        'Sem conexão com a internet. Verifique sua rede e tente novamente.',
        { offline: true },
        '/events'
      );
    }

    const allEvents = await this.getAll();
    const featuredOnly = allEvents.filter((e) => e.is_featured);
    return featuredOnly.length > 0 ? featuredOnly : allEvents.slice(0, 4);
  },

  /**
   * 3. eventsApi.getBySlug
   * Busca detalhes completos do evento pelo slug na rota /events/:slug.
   * Com VITE_USE_MOCK_DATA=false, um status 404 é propagado como ApiError com categoria ROTA.
   */
  async getBySlug(slug: string): Promise<EventItem | null> {
    if (USE_MOCK_DATA) {
      const event = mockEvents.find((e) => e.slug === slug) || null;
      return simulateNetworkDelay(event, 100);
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ApiError(
        0,
        'Sem conexão com a internet. Verifique sua rede e tente novamente.',
        { offline: true },
        `/events/${slug}`
      );
    }

    const response = await apiClient<unknown>(`/events/${slug}`);
    const raw =
      (response as { data?: Record<string, unknown> })?.data ||
      (response as Record<string, unknown>);

    if (raw && (raw.id || raw.title)) {
      return adaptEvent(raw);
    }
    return null;
  },

  filterMockEvents(filters?: EventFilters): EventItem[] {
    let events = [...mockEvents];

    if (filters?.city_slug && filters.city_slug !== 'all') {
      events = events.filter((e) => e.city_slug === filters.city_slug);
    }

    if (filters?.category) {
      const catLower = filters.category.toLowerCase();
      events = events.filter(
        (e) =>
          e.category.toLowerCase().includes(catLower) ||
          catLower.includes(e.category.toLowerCase())
      );
    }

    if (filters?.is_featured) {
      events = events.filter((e) => e.is_featured);
    }

    return events;
  },
};
