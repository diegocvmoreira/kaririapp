import React, { useEffect, useState, useCallback } from 'react';
import { Place, Category } from '../types';
import { placesApi } from '../services/api/places';
import { categoriesApi } from '../services/api/categories';
import { useCity } from '../context/CityContext';
import { MapView } from '../components/map/MapView';
import { FilterChip } from '../components/filters/FilterChip';
import { ErrorState } from '../components/common/ErrorState';
import { LoadingState } from '../components/common/LoadingState';
import { ApiDiagnosticReport } from '../services/api/diagnostics';
import { ApiError } from '../services/api/config';
import { setPageMeta } from '../utils/seo';

export const MapPage: React.FC = () => {
  const { selectedCitySlug } = useCity();

  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | undefined>();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<ApiDiagnosticReport | undefined>();

  useEffect(() => {
    setPageMeta({
      title: 'Mapa Interativo do Cariri Cearense',
      description: 'Navegue geograficamente por pontos turísticos, restaurantes e atrações em Juazeiro, Crato e Barbalha.',
    });
  }, []);

  useEffect(() => {
    categoriesApi
      .getAll()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const loadPlaces = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setDiagnostic(undefined);
    try {
      const city = selectedCitySlug === 'all' ? undefined : selectedCitySlug;
      const data = await placesApi.getAll({
        city_slug: city,
        category_slug: selectedCategorySlug,
      });
      setPlaces(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.userFriendlyMessage);
        setDiagnostic(err.diagnostic);
      } else if (err && typeof err === 'object' && 'userFriendlyMessage' in err) {
        setErrorMessage((err as { userFriendlyMessage: string }).userFriendlyMessage);
        setDiagnostic((err as { diagnostic?: ApiDiagnosticReport }).diagnostic);
      } else {
        setErrorMessage('Falha ao carregar os locais no mapa.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedCitySlug, selectedCategorySlug]);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  return (
    <div className="relative h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] flex flex-col p-2 sm:p-4">
      {/* Category Pills floating over map */}
      {categories.length > 0 && (
        <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 z-30 pointer-events-none">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 pointer-events-auto bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-gray-100 max-w-xl mx-auto">
            <FilterChip
              label="Todos os Pontos"
              isSelected={!selectedCategorySlug}
              onClick={() => setSelectedCategorySlug(undefined)}
            />
            {categories.map((cat) => (
              <FilterChip
                key={cat.id}
                label={cat.name}
                isSelected={selectedCategorySlug === cat.slug}
                onClick={() =>
                  setSelectedCategorySlug(
                    selectedCategorySlug === cat.slug ? undefined : cat.slug
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Map Component or Error / Loading states */}
      <div className="flex-1 w-full h-full rounded-3xl overflow-hidden shadow-sm relative">
        {errorMessage ? (
          <div className="h-full flex items-center justify-center bg-white rounded-3xl">
            <ErrorState message={errorMessage} diagnostic={diagnostic} onRetry={loadPlaces} />
          </div>
        ) : isLoading ? (
          <div className="h-full flex items-center justify-center bg-white rounded-3xl">
            <LoadingState type="spinner" message="Carregando pontos no mapa..." />
          </div>
        ) : (
          <MapView
            places={places}
            selectedPlaceId={selectedPlace?.id}
            onPlaceSelect={setSelectedPlace}
            heightClass="h-full"
          />
        )}
      </div>
    </div>
  );
};
