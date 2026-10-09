import {
  apiClient,
  simulateNetworkDelay,
  USE_MOCK_DATA,
} from './config';
import { Place, EventItem } from '../../types';
import { mockPlaces } from '../../mocks/mockPlaces';
import { mockEvents } from '../../mocks/mockEvents';

const FAVORITES_STORAGE_KEY = 'kariri_favorite_place_ids';
const FAVORITES_EVENTS_STORAGE_KEY = 'kariri_favorite_event_ids';

interface FavoriteRecord {
  id: number;
  user_id: number;
  place_id?: number | null;
  event_id?: number | null;
  created_at?: string;
  updated_at?: string;
  place?: ApiPlace;
  event?: ApiEvent;
}

interface FavoriteListResponse {
  data?: FavoriteRecord[];
}

interface ApiPlace {
  id: number;
  owner_id?: number | null;
  city_id?: number | null;
  category_id?: number | null;
  name?: string | null;
  slug?: string | null;
  short_description?: string | null;
  description?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  zipcode?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  opening_hours?: string | null;
  price_level?: number | null;
  rating?: number | string | null;
  reviews_count?: number | null;
  featured?: boolean | number | null;
  verified?: boolean | number | null;
  status?: string | null;
  city?: {
    id?: number;
    name?: string | null;
    slug?: string | null;
  } | null;
  category?: {
    id?: number;
    name?: string | null;
    slug?: string | null;
  } | null;
}

interface ApiEvent {
  id: number;
  place_id?: number | null;
  city_id?: number | null;
  category_id?: number | null;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  image?: string | null;
  cover_image?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location_name?: string | null;
  ticket_url?: string | null;
  price?: number | string | null;
  featured?: boolean | number | null;
  status?: string | null;
  city?: {
    id?: number;
    name?: string | null;
    slug?: string | null;
  } | null;
  category?: {
    id?: number;
    name?: string | null;
    slug?: string | null;
  } | null;
  place?: {
    id?: number;
    name?: string | null;
    address?: string | null;
  } | null;
}

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
    // Não interrompe a aplicação se o localStorage estiver indisponível.
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
    localStorage.setItem(
      FAVORITES_EVENTS_STORAGE_KEY,
      JSON.stringify(ids)
    );
  } catch {
    // Não interrompe a aplicação se o localStorage estiver indisponível.
  }
}

function extractFavoriteRecords(
  response: FavoriteRecord[] | FavoriteListResponse
): FavoriteRecord[] {
  if (Array.isArray(response)) {
    return response;
  }

  return Array.isArray(response?.data) ? response.data : [];
}

function toNumber(
  value: number | string | null | undefined,
  fallback = 0
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(
  value: boolean | number | null | undefined
): boolean {
  return value === true || value === 1;
}

function mapApiPlaceToPlace(place: ApiPlace): Place {
  const cityName = place.city?.name || '';
  const citySlug = place.city?.slug || '';
  const categoryName = place.category?.name || '';
  const categorySlug = place.category?.slug || '';

  return {
    id: place.id,
    owner_id: place.owner_id ?? null,
    name: place.name || '',
    slug: place.slug || '',
    short_description: place.short_description || '',
    description: place.description || '',
    category_id: place.category_id || 0,
    category_name: categoryName,
    category_slug: categorySlug,
    city_id: place.city_id || 0,
    city_name: cityName,
    city_slug: citySlug,
    neighborhood: place.neighborhood || '',
    address: place.address || '',
    zipcode: place.zipcode || '',
    latitude: toNumber(place.latitude),
    longitude: toNumber(place.longitude),
    cover_image: '',
    images: [],
    rating: toNumber(place.rating),
    reviews_count: place.reviews_count || 0,
    price_level: Math.min(
      4,
      Math.max(1, place.price_level || 1)
    ) as 1 | 2 | 3 | 4,
    is_featured: toBoolean(place.featured),
    verified: toBoolean(place.verified),
    is_open_now: false,
    opening_hours: place.opening_hours || '',
    phone: place.phone || undefined,
    whatsapp: place.whatsapp || undefined,
    instagram: place.instagram || undefined,
    facebook: place.facebook || undefined,
    website: place.website || undefined,
    status: place.status as Place['status'],
    tags: [],
  };
}

function mapApiEventToEvent(event: ApiEvent): EventItem {
  const price = event.price === null || event.price === undefined
    ? undefined
    : toNumber(event.price);

  const isFree = price === undefined || price === 0;
  const cityName = event.city?.name || '';
  const citySlug = event.city?.slug || '';
  const categoryName = event.category?.name || '';

  return {
    id: event.id,
    place_id: event.place_id ?? event.place?.id ?? null,
    city_id: event.city_id,
    category_id: event.category_id,
    title: event.title || '',
    slug: event.slug || '',
    description: event.description || '',
    cover_image: event.cover_image || event.image || '',
    start_date: event.start_date || '',
    end_date: event.end_date || undefined,
    display_date: event.start_date || '',
    start_time: event.start_time || '',
    end_time: event.end_time || undefined,
    place_name: event.place?.name || event.location_name || '',
    city_name: cityName,
    city_slug: citySlug,
    address: event.place?.address || '',
    price_text: isFree
      ? 'Gratuito'
      : `R$ ${price!.toFixed(2).replace('.', ',')}`,
    price,
    is_free: isFree,
    ticket_url: event.ticket_url || undefined,
    organizer: undefined,
    category: categoryName,
    is_featured: toBoolean(event.featured),
    status: event.status as EventItem['status'],
  };
}

async function getFavoriteRecords(): Promise<FavoriteRecord[]> {
  const response = await apiClient<
    FavoriteRecord[] | FavoriteListResponse
  >('/favorites');

  return extractFavoriteRecords(response);
}

async function findPlaceFavoriteId(
  placeId: number
): Promise<number | null> {
  const records = await getFavoriteRecords();

  const favorite = records.find(
    (record) => Number(record.place_id) === placeId
  );

  return favorite?.id ?? null;
}

async function findEventFavoriteId(
  eventId: number
): Promise<number | null> {
  const records = await getFavoriteRecords();

  const favorite = records.find(
    (record) => Number(record.event_id) === eventId
  );

  return favorite?.id ?? null;
}

export const favoritesApi = {
  async getFavorites(): Promise<Place[]> {
    if (USE_MOCK_DATA) {
      const ids = getStoredFavoriteIds();
      const favorites = mockPlaces.filter((place) =>
        ids.includes(place.id)
      );

      return simulateNetworkDelay(favorites, 100);
    }

    const records = await getFavoriteRecords();

    return records
      .filter((record) => record.place)
      .map((record) => mapApiPlaceToPlace(record.place!));
  },

  async addFavorite(placeId: number): Promise<boolean> {
    if (USE_MOCK_DATA) {
      const ids = getStoredFavoriteIds();

      if (!ids.includes(placeId)) {
        saveStoredFavoriteIds([...ids, placeId]);
      }

      return simulateNetworkDelay(true, 50);
    }

    await apiClient('/favorites', {
      method: 'POST',
      body: JSON.stringify({
        place_id: placeId,
      }),
    });

    return true;
  },

  async removeFavorite(placeId: number): Promise<boolean> {
    if (USE_MOCK_DATA) {
      const ids = getStoredFavoriteIds().filter(
        (id) => id !== placeId
      );

      saveStoredFavoriteIds(ids);

      return simulateNetworkDelay(true, 50);
    }

    const favoriteId = await findPlaceFavoriteId(placeId);

    if (!favoriteId) {
      return false;
    }

    await apiClient(`/favorites/${favoriteId}`, {
      method: 'DELETE',
    });

    return true;
  },

  async isFavorite(placeId: number): Promise<boolean> {
    if (USE_MOCK_DATA) {
      return getStoredFavoriteIds().includes(placeId);
    }

    const records = await getFavoriteRecords();

    return records.some(
      (record) => Number(record.place_id) === placeId
    );
  },

  getInitialIds(): number[] {
    return USE_MOCK_DATA ? getStoredFavoriteIds() : [];
  },

  async getFavoriteEvents(): Promise<EventItem[]> {
    if (USE_MOCK_DATA) {
      const ids = getStoredFavoriteEventIds();
      const favorites = mockEvents.filter((event) =>
        ids.includes(event.id)
      );

      return simulateNetworkDelay(favorites, 100);
    }

    const records = await getFavoriteRecords();

    return records
      .filter((record) => record.event)
      .map((record) => mapApiEventToEvent(record.event!));
  },

  async addFavoriteEvent(eventId: number): Promise<boolean> {
    if (USE_MOCK_DATA) {
      const ids = getStoredFavoriteEventIds();

      if (!ids.includes(eventId)) {
        saveStoredFavoriteEventIds([...ids, eventId]);
      }

      return simulateNetworkDelay(true, 50);
    }

    await apiClient('/favorites', {
      method: 'POST',
      body: JSON.stringify({
        event_id: eventId,
      }),
    });

    return true;
  },

  async removeFavoriteEvent(eventId: number): Promise<boolean> {
    if (USE_MOCK_DATA) {
      const ids = getStoredFavoriteEventIds().filter(
        (id) => id !== eventId
      );

      saveStoredFavoriteEventIds(ids);

      return simulateNetworkDelay(true, 50);
    }

    const favoriteId = await findEventFavoriteId(eventId);

    if (!favoriteId) {
      return false;
    }

    await apiClient(`/favorites/${favoriteId}`, {
      method: 'DELETE',
    });

    return true;
  },

  getInitialEventIds(): number[] {
    return USE_MOCK_DATA
      ? getStoredFavoriteEventIds()
      : [];
  },
};
