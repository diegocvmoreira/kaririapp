import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { City } from '../types';
import { citiesApi } from '../services/api/cities';

interface CityContextType {
  cities: City[];
  selectedCitySlug: string; // 'all' or city slug
  selectedCity: City | null;
  setSelectedCitySlug: (slug: string) => void;
  isLoading: boolean;
  error: string | null;
  refetchCities: () => Promise<void>;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCitySlug, setSelectedCitySlug] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
