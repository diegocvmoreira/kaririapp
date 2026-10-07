import { apiClient, simulateNetworkDelay, USE_MOCK_DATA } from './config';
import { EventItem } from '../../types';
import { mockEvents } from '../../mocks/mockEvents';

export const eventsApi = {
  async getAll(citySlug?: string): Promise<EventItem[]> {
    if (USE_MOCK_DATA) {
      let events = [...mockEvents];
      if (citySlug) {
        events = events.filter((e) => e.city_slug === citySlug);
      }
      return simulateNetworkDelay(events, 120);
    }
    const params = citySlug ? `?city=${citySlug}` : '';
    return apiClient<EventItem[]>(`/events${params}`);
  },

  async getFeatured(): Promise<EventItem[]> {
    if (USE_MOCK_DATA) {
      const featured = mockEvents.filter((e) => e.is_featured);
      return simulateNetworkDelay(featured, 100);
    }
    return apiClient<EventItem[]>('/events/featured');
  },

  async getBySlug(slug: string): Promise<EventItem | null> {
    if (USE_MOCK_DATA) {
      const event = mockEvents.find((e) => e.slug === slug) || null;
      return simulateNetworkDelay(event, 100);
    }
    return apiClient<EventItem>(`/events/${slug}`);
  },
};
