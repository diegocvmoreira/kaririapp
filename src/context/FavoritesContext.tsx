import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { favoritesApi } from '../services/api/favorites';

interface FavoritesContextType {
  favoriteIds: number[];
  isFavorite: (placeId: number) => boolean;
  toggleFavorite: (placeId: number) => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => favoritesApi.getInitialIds());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initial sync
    favoritesApi.getFavorites().then((favs) => {
      setFavoriteIds(favs.map((p) => p.id));
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

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite, loading }}>
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
