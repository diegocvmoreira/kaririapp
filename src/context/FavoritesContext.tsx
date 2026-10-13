import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { favoritesApi } from '../services/api/favorites';
import { analytics } from '../services/analyticsService';

interface FavoritesContextType {
  favoriteIds: number[];
  favoriteEventIds: number[];
  isFavorite: (placeId: number) => boolean;
  toggleFavorite: (placeId: number, slug?: string) => Promise<void>;
  isEventFavorite: (eventId: number) => boolean;
  toggleEventFavorite: (eventId: number, slug?: string) => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => favoritesApi.getInitialIds());
  const [favoriteEventIds, setFavoriteEventIds] = useState<number[]>(() =>
    favoritesApi.getInitialEventIds()
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initial sync
    favoritesApi
      .getFavorites()
      .then((favs) => {
        if (favs && favs.length > 0) {
          setFavoriteIds(favs.map((p) => p.id));
        }
      })
      .catch((err) => {
        console.warn('Não foi possível sincronizar favoritos de locais:', err);
      });

    favoritesApi
      .getFavoriteEvents()
      .then((favEvents) => {
        if (favEvents && favEvents.length > 0) {
          setFavoriteEventIds(favEvents.map((e) => e.id));
        }
      })
      .catch((err) => {
        console.warn('Não foi possível sincronizar favoritos de eventos:', err);
      });
  }, []);

  const isFavorite = useCallback(
    (placeId: number) => favoriteIds.includes(placeId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (placeId: number, slug?: string) => {
      const isFav = favoriteIds.includes(placeId);
      if (isFav) {
        setFavoriteIds((prev) => prev.filter((id) => id !== placeId));
        analytics.track('favorite_remove', {
          item_id: placeId,
          item_type: 'place',
          item_slug: slug || `place-${placeId}`,
        });
        await favoritesApi.removeFavorite(placeId);
      } else {
        setFavoriteIds((prev) => [...prev, placeId]);
        analytics.track('favorite_add', {
          item_id: placeId,
          item_type: 'place',
          item_slug: slug || `place-${placeId}`,
        });
        await favoritesApi.addFavorite(placeId);
      }
    },
    [favoriteIds]
  );

  const isEventFavorite = useCallback(
    (eventId: number) => favoriteEventIds.includes(eventId),
    [favoriteEventIds]
  );

  const toggleEventFavorite = useCallback(
    async (eventId: number, slug?: string) => {
      const isFav = favoriteEventIds.includes(eventId);
      if (isFav) {
        setFavoriteEventIds((prev) => prev.filter((id) => id !== eventId));
        analytics.track('favorite_remove', {
          item_id: eventId,
          item_type: 'event',
          item_slug: slug || `event-${eventId}`,
        });
        await favoritesApi.removeFavoriteEvent(eventId);
      } else {
        setFavoriteEventIds((prev) => [...prev, eventId]);
        analytics.track('favorite_add', {
          item_id: eventId,
          item_type: 'event',
          item_slug: slug || `event-${eventId}`,
        });
        await favoritesApi.addFavoriteEvent(eventId);
      }
    },
    [favoriteEventIds]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        favoriteEventIds,
        isFavorite,
        toggleFavorite,
        isEventFavorite,
        toggleEventFavorite,
        loading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
