import { apiClient, simulateNetworkDelay, USE_MOCK_DATA } from './config';
import { Place, EventItem } from '../../types';
import { mockPlaces } from '../../mocks/mockPlaces';
import { mockEvents } from '../../mocks/mockEvents';

export interface SearchResults {
  places: Place[];
  events: EventItem[];
  total: number;
}

export const searchApi = {
  async search(query: string, citySlug?: string): Promise<SearchResults> {
    if (!query || query.trim().length === 0) {
      return { places: [], events: [], total: 0 };
    }

    if (USE_MOCK_DATA) {
      return this.localSearch(query, citySlug);
    }

    try {
      const params = new URLSearchParams({ q: query });
      if (citySlug) params.set('city', citySlug);

      const response = await apiClient<SearchResults>(`/search?${params.toString()}`);
      return response;
    } catch {
      // Fallback em caso de 404 no endpoint de busca
      return this.localSearch(query, citySlug);
    }
  },

  localSearch(query: string, citySlug?: string): SearchResults {
    const q = query.toLowerCase().trim();

    const matchedPlaces = mockPlaces.filter((place) => {
      const matchesQuery =
        place.name.toLowerCase().includes(q) ||
        place.category_name.toLowerCase().includes(q) ||
        place.city_name.toLowerCase().includes(q) ||
        place.neighborhood.toLowerCase().includes(q) ||
        place.short_description.toLowerCase().includes(q) ||
        place.tags.some((t) => t.toLowerCase().includes(q));

      if (citySlug && place.city_slug !== citySlug) {
        return false;
      }

      return matchesQuery;
    });

    const matchedEvents = mockEvents.filter((event) => {
      const matchesQuery =
        event.title.toLowerCase().includes(q) ||
        event.category.toLowerCase().includes(q) ||
        event.city_name.toLowerCase().includes(q) ||
        event.place_name.toLowerCase().includes(q) ||
        event.description.toLowerCase().includes(q);

      if (citySlug && event.city_slug !== citySlug) {
        return false;
      }

      return matchesQuery;
    });

    return {
      places: matchedPlaces,
      events: matchedEvents,
      total: matchedPlaces.length + matchedEvents.length,
    };
  },
};
