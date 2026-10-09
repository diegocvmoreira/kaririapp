import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { Link } from 'react-router-dom';
import { MapPin, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';

export const MapPage: React.FC = () => {
  const { selectedCitySlug } = useCity();

  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | undefined>();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<ApiDiagnosticReport | undefined>();
  const [showAddressFallbackDrawer, setShowAddressFallbackDrawer] = useState(false);

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

  // Identifica locais que possuem apenas endereço textual sem coordenadas no mapa
  const placesWithoutCoords = useMemo(() => {
    return places.filter(
      (p) =>
        typeof p.latitude !== 'number' ||
        typeof p.longitude !== 'number' ||
        isNaN(p.latitude) ||
        isNaN(p.longitude) ||
        Math.abs(p.latitude) <= 0.001 ||
        Math.abs(p.longitude) <= 0.001
    );
  }, [places]);

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

        {/* Fallback para locais sem coordenadas (Audit Item 7) */}
        {!isLoading && !errorMessage && placesWithoutCoords.length > 0 && (
          <div className="absolute left-4 bottom-4 z-20 max-w-sm">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setShowAddressFallbackDrawer((prev) => !prev)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-gray-50/80 transition"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-bold text-gray-800">
                    {placesWithoutCoords.length} local(is) com endereço textual
                  </span>
                </div>
                {showAddressFallbackDrawer ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {showAddressFallbackDrawer && (
                <div className="p-3 border-t border-gray-100 max-h-56 overflow-y-auto divide-y divide-gray-100 space-y-2">
                  <p className="text-[11px] text-gray-500 pb-1">
                    Estes locais não possuem coordenadas GPS cadastradas e são exibidos com endereço descritivo:
                  </p>
                  {placesWithoutCoords.map((place) => (
                    <div key={place.id} className="pt-2 first:pt-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900">{place.name}</p>
                          <p className="text-[11px] text-gray-600 mt-0.5">
                            {place.address || `${place.neighborhood || ''}, ${place.city_name}`}
                          </p>
                        </div>
                        <Link
                          to={`/locais/${place.slug}`}
                          className="px-2 py-1 bg-gray-100 hover:bg-[#DE1F2A] hover:text-white rounded-lg font-bold text-[10px] transition shrink-0 flex items-center gap-1"
                        >
                          <span>Ver</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
