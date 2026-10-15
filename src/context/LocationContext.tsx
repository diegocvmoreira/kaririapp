import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Coordinates, isValidCoordinate } from '../utils/geoUtils';
import { useCity } from './CityContext';
import { analytics } from '../services/analyticsService';

export type GeoPermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

interface LocationContextType {
  userCoords: Coordinates | null;
  referenceCoords: Coordinates | null;
  isGpsActive: boolean;
  isLocating: boolean;
  geoError: string | null;
  permissionState: GeoPermissionState;
  isConsentModalOpen: boolean;
  openConsentModal: () => void;
  closeConsentModal: () => void;
  setUserCoords: (coords: Coordinates | null) => void;
  requestGpsLocation: () => Promise<Coordinates | null>;
  clearGpsLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const GPS_STORAGE_KEY = 'kariri_session_gps_coords';

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedCity } = useCity();

  const [userCoords, setUserCoordsState] = useState<Coordinates | null>(() => {
    try {
      const stored = sessionStorage.getItem(GPS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (isValidCoordinate(parsed?.latitude, parsed?.longitude)) {
          return { latitude: parsed.latitude, longitude: parsed.longitude };
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<GeoPermissionState>('prompt');
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

  const openConsentModal = useCallback(() => setIsConsentModalOpen(true), []);
  const closeConsentModal = useCallback(() => setIsConsentModalOpen(false), []);

  const setUserCoords = useCallback((coords: Coordinates | null) => {
    if (coords && isValidCoordinate(coords.latitude, coords.longitude)) {
      setUserCoordsState(coords);
      setPermissionState('granted');
      try {
        sessionStorage.setItem(GPS_STORAGE_KEY, JSON.stringify(coords));
      } catch {
        // ignore
      }
    } else {
      setUserCoordsState(null);
      try {
        sessionStorage.removeItem(GPS_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, []);

  const clearGpsLocation = useCallback(() => {
    setUserCoords(null);
    setPermissionState('prompt');
    setGeoError(null);
  }, [setUserCoords]);

  const requestGpsLocation = useCallback(async (): Promise<Coordinates | null> => {
    setIsLocating(true);
    setGeoError(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setIsLocating(false);
      setPermissionState('unavailable');
      const err = 'Geolocalização não é suportada neste navegador ou dispositivo.';
      setGeoError(err);
      return null;
    }

    return new Promise<Coordinates | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const coords: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          setUserCoords(coords);

          analytics.track('map_open', {
            source_context: 'button',
          });

          resolve(coords);
        },
        (error) => {
          setIsLocating(false);
          let userMsg = 'Não foi possível obter sua localização no momento.';
          if (error.code === error.PERMISSION_DENIED) {
            setPermissionState('denied');
            userMsg = 'Permissão de localização recusada pelo navegador.';
          } else if (error.code === error.TIMEOUT) {
            userMsg = 'Tempo limite excedido ao buscar localização por GPS.';
          }
          setGeoError(userMsg);
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 min de cache (sem rastreamento contínuo LGPD)
        }
      );
    });
  }, [setUserCoords]);

  // Coordenada de referência combinada:
  // 1. Prioriza GPS se ativo
  // 2. Se GPS não ativo, mas um município específico foi selecionado, usa o centro geográfico do município
  // 3. Se 'all' e sem GPS, retorna null (sem inventar distâncias)
  const referenceCoords = useMemo<Coordinates | null>(() => {
    if (userCoords && isValidCoordinate(userCoords.latitude, userCoords.longitude)) {
      return userCoords;
    }

    if (selectedCity && isValidCoordinate(selectedCity.latitude, selectedCity.longitude)) {
      return {
        latitude: selectedCity.latitude as number,
        longitude: selectedCity.longitude as number,
      };
    }

    return null;
  }, [userCoords, selectedCity]);

  const isGpsActive = Boolean(userCoords && isValidCoordinate(userCoords.latitude, userCoords.longitude));

  return (
    <LocationContext.Provider
      value={{
        userCoords,
        referenceCoords,
        isGpsActive,
        isLocating,
        geoError,
        permissionState,
        isConsentModalOpen,
        openConsentModal,
        closeConsentModal,
        setUserCoords,
        requestGpsLocation,
        clearGpsLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
