import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { favoritesApi } from '../services/api/favorites';

interface FavoritesContextType {
  favoriteIds: number[];
  favoriteEventIds: number[];
  isFavorite: (placeId: number) => boolean;
  toggleFavorite: (placeId: number) => Promise<void>;
  isEventFavorite: (eventId: number) => boolean;
  toggleEventFavorite: (eventId: number) => Promise<void>;
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
    favoritesApi.getFavorites().then((favs) => {
      setFavoriteIds(favs.map((p) => p.id));
    });
    favoritesApi.getFavoriteEvents().then((favEvents) => {
      setFavoriteEventIds(favEvents.map((e) => e.id));
    });
  }, []);

  const isFavorite = useCallback(
    (placeId: number) => favoriteIds.includes(placeId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (placeId: number) => {
      const isFav = favoriteIds.includes(placeId);
      if (isFav) {
        setFavoriteIds((prev) => prev.filter((id) => id !== placeId));
        await favoritesApi.removeFavorite(placeId);
      } else {
        setFavoriteIds((prev) => [...prev, placeId]);
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
    async (eventId: number) => {
      const isFav = favoriteEventIds.includes(eventId);
      if (isFav) {
        setFavoriteEventIds((prev) => prev.filter((id) => id !== eventId));
        await favoritesApi.removeFavoriteEvent(eventId);
      } else {
        setFavoriteEventIds((prev) => [...prev, eventId]);
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
