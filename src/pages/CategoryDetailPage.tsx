import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Place, Category } from '../types';
import { placesApi } from '../services/api/places';
import { categoriesApi } from '../services/api/categories';
import { useCity } from '../context/CityContext';
import { PlaceCard } from '../components/cards/PlaceCard';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { BackButton } from '../components/common/BackButton';
import { ApiDiagnosticReport } from '../services/api/diagnostics';
import { ApiError } from '../services/api/config';
import { setPageMeta } from '../utils/seo';

export const CategoryDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { selectedCitySlug } = useCity();

  const [category, setCategory] = useState<Category | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedSubcat, setSelectedSubcat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Categoria não encontrada.');
  const [diagnostic, setDiagnostic] = useState<ApiDiagnosticReport | undefined>();

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    setHasError(false);
    setDiagnostic(undefined);
    setSelectedSubcat(null);

    Promise.all([
      categoriesApi.getBySlug(slug),
      placesApi.getAll({
        category_slug: slug,
        city_slug: selectedCitySlug === 'all' ? undefined : selectedCitySlug,
      }),
    ])
      .then(([catData, placesData]) => {
        if (!catData) {
          setHasError(true);
          setErrorMessage('Categoria não encontrada no Kariri.app.');
          return;
        }
        setCategory(catData);
        setPlaces(placesData);
        setPageMeta({
          title: `${catData.name} no Cariri Cearense`,
          description: catData.description,
        });
      })
      .catch((err: unknown) => {
        setHasError(true);
        if (err instanceof ApiError) {
          setErrorMessage(err.userFriendlyMessage);
          setDiagnostic(err.diagnostic);
        } else if (err && typeof err === 'object' && 'userFriendlyMessage' in err) {
          setErrorMessage((err as { userFriendlyMessage: string }).userFriendlyMessage);
          setDiagnostic((err as { diagnostic?: ApiDiagnosticReport }).diagnostic);
        } else {
          setErrorMessage('Não foi possível conectar com o servidor da API.');
        }
      })
      .finally(() => setIsLoading(false));
  }, [slug, selectedCitySlug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <LoadingState count={4} />
      </div>
    );
  }

  if (hasError || !category) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <ErrorState
          message={errorMessage}
          diagnostic={diagnostic}
          onRetry={() => navigate('/explorar')}
        />
      </div>
    );
  }

  // Filter by subcategory tag if selected
  const displayPlaces = selectedSubcat
    ? places.filter((p) =>
        p.tags.some(
          (t) => t.toLowerCase() === selectedSubcat.toLowerCase()
        )
      )
    : places;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
      {/* Header Back & Info */}
      <div className="space-y-3">
        <BackButton fallbackTo="/explorar" />

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs space-y-3">
          <div>
            <span className="text-xs font-bold text-[#D9262E] uppercase tracking-wider">
              Categoria
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-0.5">
              {category.name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">
              {category.description}
            </p>
          </div>

          {/* Subcategories (Seção 14) */}
          {category.subcategories && category.subcategories.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 block mb-1.5 uppercase">
                Subcategorias:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedSubcat(null)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                    selectedSubcat === null
                      ? 'bg-[#1F2024] text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todas
                </button>
                {category.subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() =>
                      setSelectedSubcat(selectedSubcat === sub.name ? null : sub.name)
                    }
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                      selectedSubcat === sub.name
                        ? 'bg-[#D9262E] text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Places Grid */}
      {displayPlaces.length === 0 ? (
        <EmptyState
          title={`Nenhum local em ${category.name}`}
          description="Ainda não temos locais cadastrados nesta categoria para a cidade ou subcategoria selecionada."
          actionText="Ver todos da categoria"
          onAction={() => setSelectedSubcat(null)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
};
