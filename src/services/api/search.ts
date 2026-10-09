import { apiClient, USE_MOCK_DATA } from './config';
import { Place, EventItem } from '../../types';
import { mockPlaces } from '../../mocks/mockPlaces';
import { mockEvents } from '../../mocks/mockEvents';

export interface SearchResults {
  places: Place[];
  events: EventItem[];
  total: number;
}

interface ApiSearchResponse {
  places?: Place[] | { data?: Place[] };
  events?: EventItem[] | { data?: EventItem[] };
  total?: number;
}

function extractList<T>(value: T[] | { data?: T[] } | undefined): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && Array.isArray(value.data)) {
    return value.data;
  }

  return [];
}

function normalizeSearchResponse(response: ApiSearchResponse): SearchResults {
  const places = extractList(response.places);
  const events = extractList(response.events);

  return {
    places,
    events,
    total:
      typeof response.total === 'number'
        ? response.total
        : places.length + events.length,
  };
}

export const searchApi = {
  async search(
    query: string,
    citySlug?: string
  ): Promise<SearchResults> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return {
        places: [],
        events: [],
        total: 0,
      };
    }

    if (USE_MOCK_DATA) {
      return this.localSearch(normalizedQuery, citySlug);
    }

    const params = new URLSearchParams({
      q: normalizedQuery,
    });

    if (citySlug && citySlug !== 'all') {
      params.set('city', citySlug);
    }

    const response = await apiClient<ApiSearchResponse>(
      `/search?${params.toString()}`
    );

    return normalizeSearchResponse(response);
  },

  localSearch(
    query: string,
    citySlug?: string
  ): SearchResults {
    const normalizedQuery = query.toLowerCase().trim();

    const matchedPlaces = mockPlaces.filter((place) => {
      const matchesQuery =
        place.name.toLowerCase().includes(normalizedQuery) ||
        place.category_name.toLowerCase().includes(normalizedQuery) ||
        place.city_name.toLowerCase().includes(normalizedQuery) ||
        place.neighborhood.toLowerCase().includes(normalizedQuery) ||
        place.short_description
          .toLowerCase()
          .includes(normalizedQuery) ||
        place.tags.some((tag) =>
          tag.toLowerCase().includes(normalizedQuery)
        );

      if (
        citySlug &&
        citySlug !== 'all' &&
        place.city_slug !== citySlug
      ) {
        return false;
      }

      return matchesQuery;
    });

    const matchedEvents = mockEvents.filter((event) => {
      const matchesQuery =
        event.title.toLowerCase().includes(normalizedQuery) ||
        event.category.toLowerCase().includes(normalizedQuery) ||
        event.city_name.toLowerCase().includes(normalizedQuery) ||
        event.place_name.toLowerCase().includes(normalizedQuery) ||
        event.description.toLowerCase().includes(normalizedQuery);

      if (
        citySlug &&
        citySlug !== 'all' &&
        event.city_slug !== citySlug
      ) {
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
