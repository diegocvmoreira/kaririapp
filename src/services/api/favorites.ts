import { apiClient, simulateNetworkDelay, USE_MOCK_DATA } from './config';
import { Place } from '../../types';
import { mockPlaces } from '../../mocks/mockPlaces';

const FAVORITES_STORAGE_KEY = 'kariri_favorite_place_ids';

function getStoredFavoriteIds(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [1, 2]; // Default 2 popular places saved
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

export const favoritesApi = {
  async getFavorites(): Promise<Place[]> {
    if (USE_MOCK_DATA) {
      const ids = getStoredFavoriteIds();
      const favs = mockPlaces.filter((p) => ids.includes(p.id));
      return simulateNetworkDelay(favs, 100);
    }
    return apiClient<Place[]>('/favorites');
  },

  async addFavorite(placeId: number): Promise<boolean> {
    if (USE_MOCK_DATA) {
      const ids = getStoredFavoriteIds();
      if (!ids.includes(placeId)) {
        ids.push(placeId);
        saveStoredFavoriteIds(ids);
      }
      return simulateNetworkDelay(true, 50);
    }
    await apiClient('/favorites', {
      method: 'POST',
      body: JSON.stringify({ place_id: placeId }),
    });
    return true;
  },

  async removeFavorite(placeId: number): Promise<boolean> {
    if (USE_MOCK_DATA) {
      const ids = getStoredFavoriteIds().filter((id) => id !== placeId);
      saveStoredFavoriteIds(ids);
      return simulateNetworkDelay(true, 50);
    }
    await apiClient(`/favorites/${placeId}`, {
      method: 'DELETE',
    });
    return true;
  },

  async isFavorite(placeId: number): Promise<boolean> {
    if (USE_MOCK_DATA) {
      const ids = getStoredFavoriteIds();
      return ids.includes(placeId);
    }
    const response = await apiClient<{ is_favorite: boolean }>(`/favorites/check/${placeId}`);
    return response.is_favorite;
  },

  getInitialIds(): number[] {
    return getStoredFavoriteIds();
  },
};
