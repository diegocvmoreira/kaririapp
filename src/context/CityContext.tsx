import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { City } from '../types';
import { citiesApi } from '../services/api/cities';
import { analytics } from '../services/analyticsService';

interface CityContextType {
  cities: City[];
  selectedCitySlug: string; // 'all' or city slug
  selectedCity: City | null;
  setSelectedCitySlug: (slug: string, context?: 'header' | 'modal' | 'filter' | 'explore' | 'manual') => void;
  isLoading: boolean;
  error: string | null;
  refetchCities: () => Promise<void>;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCitySlug, setSelectedCitySlugState] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setSelectedCitySlug = useCallback((slug: string, context: 'header' | 'modal' | 'filter' | 'explore' | 'manual' = 'filter') => {
    setSelectedCitySlugState(slug);
    if (slug !== 'all') {
      const city = cities.find((c) => c.slug === slug);
      if (city) {
        analytics.track('city_selected', {
          city_id: city.id,
          city_slug: city.slug,
          city_name: city.name,
          selection_context: context,
          is_cariri_region: city.is_cariri_region !== false,
        });
      }
    }
  }, [cities]);

  const fetchCities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await citiesApi.getActive();
      setCities(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar municípios da API';
      setError(msg);
      console.warn('Erro ao carregar municípios:', msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const selectedCity =
    selectedCitySlug === 'all'
      ? null
      : cities.find((c) => c.slug === selectedCitySlug) || null;

  return (
    <CityContext.Provider
      value={{
        cities,
        selectedCitySlug,
        selectedCity,
        setSelectedCitySlug,
        isLoading,
        error,
        refetchCities: fetchCities,
      }}
    >
      {children}
    </CityContext.Provider>
  );
};

export function useCity() {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
}
