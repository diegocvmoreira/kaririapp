import React, { createContext, useContext, useEffect, useState } from 'react';
import { City } from '../types';
import { citiesApi } from '../services/api/cities';

interface CityContextType {
  cities: City[];
  selectedCitySlug: string; // 'all' or city slug
  selectedCity: City | null;
  setSelectedCitySlug: (slug: string) => void;
  isLoading: boolean;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCitySlug, setSelectedCitySlug] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    citiesApi
      .getActive()
      .then((data) => {
        setCities(data);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

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
