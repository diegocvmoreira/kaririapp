import { apiClient, simulateNetworkDelay, USE_MOCK_DATA } from './config';
import { Place, EventItem } from '../../types';
import { mockPlaces } from '../../mocks/mockPlaces';
import { mockEvents } from '../../mocks/mockEvents';

const FAVORITES_STORAGE_KEY = 'kariri_favorite_place_ids';
const FAVORITES_EVENTS_STORAGE_KEY = 'kariri_favorite_event_ids';

function getStoredFavoriteIds(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [1, 2];
  } catch {
    return [1, 2];
  }
}

function saveStoredFavoriteIds(ids: number[]): void {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

function getStoredFavoriteEventIds(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_EVENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [1, 2];
  } catch {
    return [1, 2];
  }
}

function saveStoredFavoriteEventIds(ids: number[]): void {
  try {
    localStorage.setItem(FAVORITES_EVENTS_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export const favoritesApi = {
  async getFavorites(): Promise<Place[]> {
    if (USE_MOCK_DATA) {
      const ids = getStoredFavoriteIds();
      const favs = mockPlaces.filter((p) => ids.includes(p.id));
      return simulateNetworkDelay(favs, 100);
    }

    try {
      const response = await apiClient<unknown>('/favorites');
      const list = Array.isArray(response)
        ? response
        : (response as { data?: Place[] })?.data || [];
      return list as Place[];
    } catch {
      // Fallback local se /favorites não existir ou o usuário não estiver autenticado
      const ids = getStoredFavoriteIds();
      return mockPlaces.filter((p) => ids.includes(p.id));
    }
  },

  async addFavorite(placeId: number): Promise<boolean> {
    const ids = getStoredFavoriteIds();
    if (!ids.includes(placeId)) {
      ids.push(placeId);
      saveStoredFavoriteIds(ids);
    }

    if (USE_MOCK_DATA) {
      return simulateNetworkDelay(true, 50);
    }

    try {
      await apiClient('/favorites', {
        method: 'POST',
        body: JSON.stringify({ place_id: placeId }),
      });
    } catch {
      // Ignora erro de endpoint não implementado, mantendo local
    }
    return true;
  },

  async removeFavorite(placeId: number): Promise<boolean> {
    const ids = getStoredFavoriteIds().filter((id) => id !== placeId);
    saveStoredFavoriteIds(ids);

    if (USE_MOCK_DATA) {
      return simulateNetworkDelay(true, 50);
    }

    try {
      await apiClient(`/favorites/${placeId}`, {
        method: 'DELETE',
      });
    } catch {
      // Ignora erro de endpoint não implementado
    }
    return true;
  },

  async isFavorite(placeId: number): Promise<boolean> {
    const ids = getStoredFavoriteIds();
    if (ids.includes(placeId)) return true;

    if (USE_MOCK_DATA) return false;

    try {
      const response = await apiClient<{ is_favorite: boolean }>(`/favorites/check/${placeId}`);
      return Boolean(response?.is_favorite);
    } catch {
      return ids.includes(placeId);
    }
  },

  getInitialIds(): number[] {
    return getStoredFavoriteIds();
  },

  // ---------------- Favoritos de Eventos ----------------
  async getFavoriteEvents(): Promise<EventItem[]> {
    if (USE_MOCK_DATA) {
      const ids = getStoredFavoriteEventIds();
      const favs = mockEvents.filter((e) => ids.includes(e.id));
      return simulateNetworkDelay(favs, 100);
    }

    try {
      const response = await apiClient<unknown>('/favorites/events');
      const list = Array.isArray(response)
        ? response
        : (response as { data?: EventItem[] })?.data || [];
      return list as EventItem[];
    } catch {
      const ids = getStoredFavoriteEventIds();
      return mockEvents.filter((e) => ids.includes(e.id));
    }
  },

  async addFavoriteEvent(eventId: number): Promise<boolean> {
    const ids = getStoredFavoriteEventIds();
    if (!ids.includes(eventId)) {
      ids.push(eventId);
      saveStoredFavoriteEventIds(ids);
    }

    if (USE_MOCK_DATA) {
      return simulateNetworkDelay(true, 50);
    }

    try {
      await apiClient('/favorites/events', {
        method: 'POST',
        body: JSON.stringify({ event_id: eventId }),
      });
    } catch {
      // Ignora erro no backend
    }
    return true;
  },

  async removeFavoriteEvent(eventId: number): Promise<boolean> {
    const ids = getStoredFavoriteEventIds().filter((id) => id !== eventId);
    saveStoredFavoriteEventIds(ids);

    if (USE_MOCK_DATA) {
      return simulateNetworkDelay(true, 50);
    }

    try {
      await apiClient(`/favorites/events/${eventId}`, {
        method: 'DELETE',
      });
    } catch {
      // Ignora erro no backend
    }
    return true;
  },

  getInitialEventIds(): number[] {
    return getStoredFavoriteEventIds();
  },
};
