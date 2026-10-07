import { apiClient, simulateNetworkDelay, USE_MOCK_DATA } from './config';
import { Place, SearchFilters } from '../../types';
import { mockPlaces } from '../../mocks/mockPlaces';

export const placesApi = {
  async getAll(filters?: SearchFilters): Promise<Place[]> {
    if (USE_MOCK_DATA) {
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

      // Sort
      if (filters?.sort_by === 'rating') {
        result.sort((a, b) => b.rating - a.rating);
      } else if (filters?.sort_by === 'distance') {
        result.sort((a, b) => (a.distance_km || 99) - (b.distance_km || 99));
      } else if (filters?.sort_by === 'reviews') {
        result.sort((a, b) => b.reviews_count - a.reviews_count);
      }

      return simulateNetworkDelay(result, 120);
    }

    const queryParams = new URLSearchParams();
    if (filters?.city_slug) queryParams.set('city', filters.city_slug);
    if (filters?.category_slug) queryParams.set('category', filters.category_slug);
    if (filters?.min_rating) queryParams.set('min_rating', String(filters.min_rating));
    if (filters?.open_now) queryParams.set('open_now', '1');

    return apiClient<Place[]>(`/places?${queryParams.toString()}`);
  },

  async getFeatured(): Promise<Place[]> {
    if (USE_MOCK_DATA) {
      const featured = mockPlaces.filter((p) => p.is_featured);
      return simulateNetworkDelay(featured, 100);
    }
    return apiClient<Place[]>('/places/featured');
  },

  async getNearby(citySlug?: string): Promise<Place[]> {
    if (USE_MOCK_DATA) {
      let places = [...mockPlaces];
      if (citySlug) {
        places = places.filter((p) => p.city_slug === citySlug);
      }
      // Sort by closest distance
      places.sort((a, b) => (a.distance_km || 99) - (b.distance_km || 99));
      return simulateNetworkDelay(places.slice(0, 6), 100);
    }
    const params = citySlug ? `?city=${citySlug}` : '';
    return apiClient<Place[]>(`/places/nearby${params}`);
  },

  async getBySlug(slug: string): Promise<Place | null> {
    if (USE_MOCK_DATA) {
      const place = mockPlaces.find((p) => p.slug === slug) || null;
      return simulateNetworkDelay(place, 120);
    }
    return apiClient<Place>(`/places/${slug}`);
  },

  async getSimilar(placeId: number, categorySlug: string): Promise<Place[]> {
    if (USE_MOCK_DATA) {
      const similar = mockPlaces.filter(
        (p) => p.id !== placeId && p.category_slug === categorySlug
      );
      return simulateNetworkDelay(similar.slice(0, 4), 100);
    }
    return apiClient<Place[]>(`/places/${placeId}/similar`);
  },
};
