import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Place, EventItem, Category, SearchFilters } from '../types';
import { placesApi } from '../services/api/places';
import { eventsApi } from '../services/api/events';
import { categoriesApi } from '../services/api/categories';
import { useCity } from '../context/CityContext';
import { SearchBar } from '../components/common/SearchBar';
import { CategoryCard } from '../components/cards/CategoryCard';
import { PlaceCard } from '../components/cards/PlaceCard';
import { EventCard } from '../components/cards/EventCard';
import { FilterSheet } from '../components/filters/FilterSheet';
import { FilterChip } from '../components/filters/FilterChip';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { SectionHeader } from '../components/common/SectionHeader';
import { ApiDiagnosticReport } from '../services/api/diagnostics';
import { ApiError } from '../services/api/config';
import { analytics } from '../services/analyticsService';
import { setPageMeta } from '../utils/seo';
import { fuzzyIncludes, normalizeText } from '../utils/textUtils';
import { useLocation } from '../context/LocationContext';
import { GeolocationConsentModal } from '../components/common/GeolocationConsentModal';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { cities, selectedCitySlug } = useCity();
  const {
    referenceCoords,
    isConsentModalOpen,
    openConsentModal,
    closeConsentModal,
    setUserCoords,
  } = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  // Leitura inicial de tab da URL (all | places | events)
  const initialTabParam = searchParams.get('tab');
  const initialTab: 'all' | 'places' | 'events' =
    initialTabParam === 'places' || initialTabParam === 'events' ? initialTabParam : 'all';
  const [activeTab, setActiveTab] = useState<'all' | 'places' | 'events'>(initialTab);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || undefined,
    city_slug: searchParams.get('city') || (selectedCitySlug !== 'all' ? selectedCitySlug : undefined),
    category_slug: searchParams.get('cat') || undefined,
    open_now: false,
    sort_by: 'featured',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('Não foi possível carregar as informações do Cariri.');
  const [diagnostic, setDiagnostic] = useState<ApiDiagnosticReport | undefined>();

  useEffect(() => {
    setPageMeta({
      title: 'Explorar Lugares e Eventos no Cariri',
      description: 'Pesquise pontos turísticos, restaurantes, bares e festas no Cariri cearense.',
    });
  }, []);

  // Sincroniza estado de busca, filtros e aba ativa com os parâmetros da URL
  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (searchQuery.trim()) nextParams.set('q', searchQuery.trim());
    if (filters.city_slug) nextParams.set('city', filters.city_slug);
    if (filters.category_slug) nextParams.set('cat', filters.category_slug);
    if (activeTab !== 'all') nextParams.set('tab', activeTab);

    // Atualiza a URL apenas se houver diferença real para não disparar re-render redundante
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchQuery, filters.city_slug, filters.category_slug, activeTab]);

  // Sync city selection if changed globally in Header
  useEffect(() => {
    if (selectedCitySlug !== 'all') {
      setFilters((prev) => ({ ...prev, city_slug: selectedCitySlug }));
    }
  }, [selectedCitySlug]);

  // Load Categories once
  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(console.error);
  }, []);

  // Fetch places and events based on active filters
  const fetchData = async () => {
    setIsLoading(true);
    setHasError(false);
    setDiagnostic(undefined);
    try {
      const [placesData, eventsData] = await Promise.all([
        placesApi.getAll({
          ...filters,
          query: searchQuery,
          latitude: referenceCoords?.latitude,
          longitude: referenceCoords?.longitude,
        }),
        eventsApi.getAll({
          city_slug: filters.city_slug,
          category: filters.category_slug,
        }),
      ]);

      let filteredPlaces = placesData;
      let filteredEvents = eventsData;

      if (filters.category_slug) {
        const catObj = categories.find((c) => c.slug === filters.category_slug);
        const catName = catObj ? catObj.name : filters.category_slug;
        filteredEvents = filteredEvents.filter(
          (e) =>
            fuzzyIncludes(e.category, catName) ||
            fuzzyIncludes(e.category, filters.category_slug) ||
            fuzzyIncludes(catName, e.category)
        );
      }

      // Busca client-side com normalização completa de acentos e caixa (ex.: 'cafe' encontra 'café')
      if (searchQuery.trim()) {
        filteredPlaces = filteredPlaces.filter(
          (p) =>
            fuzzyIncludes(p.name, searchQuery) ||
            fuzzyIncludes(p.short_description, searchQuery) ||
            fuzzyIncludes(p.description, searchQuery) ||
            fuzzyIncludes(p.category_name, searchQuery) ||
            fuzzyIncludes(p.city_name, searchQuery) ||
            fuzzyIncludes(p.neighborhood, searchQuery) ||
            p.tags.some((t) => fuzzyIncludes(t, searchQuery))
        );

        filteredEvents = filteredEvents.filter(
          (e) =>
            fuzzyIncludes(e.title, searchQuery) ||
            fuzzyIncludes(e.category, searchQuery) ||
            fuzzyIncludes(e.city_name, searchQuery) ||
            fuzzyIncludes(e.place_name, searchQuery) ||
            fuzzyIncludes(e.description, searchQuery) ||
            (e.organizer && fuzzyIncludes(e.organizer, searchQuery))
        );
      }

      setPlaces(filteredPlaces);
      setEvents(filteredEvents);

      // Dispara evento de search se houver termo de busca digitado
      if (searchQuery.trim().length >= 2) {
        analytics.track('search', {
          search_term: searchQuery.trim(),
          results_count: filteredPlaces.length + filteredEvents.length,
          category_slug: filters.category_slug,
          city_slug: filters.city_slug,
        });
      }
    } catch (err: unknown) {
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, searchQuery, referenceCoords?.latitude, referenceCoords?.longitude]);

  const handleCategoryPillClick = (catSlug?: string) => {
    setFilters((prev) => ({
      ...prev,
      category_slug: prev.category_slug === catSlug ? undefined : catSlug,
    }));
  };

  const hasActiveFilters = Boolean(
    filters.city_slug ||
      filters.category_slug ||
      filters.min_rating ||
      filters.open_now ||
      (filters.price_levels && filters.price_levels.length > 0)
  );

  // Matched categories for mixed results (Seção 13) com busca insensível a acentos
  const matchedCategories = searchQuery.trim()
    ? categories.filter((c) => fuzzyIncludes(c.name, searchQuery))
    : [];

  const totalResults = places.length + events.length;

  const activeCityName = filters.city_slug
    ? cities.find((c) => c.slug === filters.city_slug)?.name || filters.city_slug
    : null;

  const activeCategoryName = filters.category_slug
    ? categories.find((c) => c.slug === filters.category_slug)?.name || filters.category_slug
    : null;

  return (
    <div className="space-y-4 px-4 py-4 max-w-7xl mx-auto pb-10">
      {/* 1. Search Bar with Filter Trigger */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="O que você quer explorar no Cariri? (pizza, café, cultura...)"
        onFilterClick={() => setIsFilterSheetOpen(true)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 2. Mode Selector Tabs: Todos vs Locais vs Eventos */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition shrink-0 ${
            activeTab === 'all'
              ? 'bg-[#1F2024] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Tudo ({totalResults})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('places')}
          className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition shrink-0 ${
            activeTab === 'places'
              ? 'bg-[#DE1F2A] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Locais ({places.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('events')}
          className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition shrink-0 ${
            activeTab === 'events'
              ? 'bg-[#DE1F2A] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Eventos ({events.length})
        </button>
      </div>

      {/* 3. Horizontal Categories Filter Rail */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        <FilterChip
          label="Todas as Categorias"
          isSelected={!filters.category_slug}
          onClick={() => handleCategoryPillClick(undefined)}
        />
        {categories.map((cat) => (
          <FilterChip
            key={cat.id}
            label={cat.name}
            isSelected={filters.category_slug === cat.slug}
            onClick={() => handleCategoryPillClick(cat.slug)}
            count={cat.count}
          />
        ))}
      </div>

      {/* 4. Active Filter Tags Indicator com NOMES em vez de slugs */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs text-gray-500 overflow-x-auto no-scrollbar py-1">
          <span className="font-semibold text-gray-400 shrink-0">Filtros:</span>
          {activeCityName && (
            <span className="px-2.5 py-1 bg-gray-100 rounded-full font-medium text-gray-700 shrink-0">
              Cidade: {activeCityName}
            </span>
          )}
          {activeCategoryName && (
            <span className="px-2.5 py-1 bg-gray-100 rounded-full font-medium text-gray-700 shrink-0">
              Categoria: {activeCategoryName}
            </span>
          )}
          {filters.open_now && (
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-medium shrink-0">
              Aberto agora
            </span>
          )}
          {filters.min_rating && (
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-medium shrink-0">
              {filters.min_rating}+ estrelas
            </span>
          )}
          <button
            type="button"
            onClick={() =>
              setFilters({
                query: undefined,
                city_slug: undefined,
                category_slug: undefined,
                open_now: false,
                sort_by: 'featured',
              })
            }
            className="text-[#DE1F2A] font-semibold hover:underline shrink-0 pl-1"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* 5. Results Grid */}
      {isLoading ? (
        <LoadingState count={4} />
      ) : hasError ? (
        <ErrorState message={errorMessage} diagnostic={diagnostic} onRetry={fetchData} />
      ) : activeTab === 'all' ? (
        // Mixed Results View (Seção 13)
        totalResults === 0 ? (
          <EmptyState
            title="Nenhum resultado encontrado"
            description="Tente ajustar sua busca ou limpar filtros para explorar outros locais e eventos."
            actionText="Limpar Filtros"
            onAction={() => {
              setSearchQuery('');
              setFilters({ sort_by: 'featured' });
            }}
          />
        ) : (
          <div className="space-y-6">
            {/* Matched Categories section if searching */}
            {matchedCategories.length > 0 && (
              <div>
                <SectionHeader title="Categorias Relacionadas" className="px-0 mb-2" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {matchedCategories.map((cat) => (
                    <CategoryCard key={cat.id} category={cat} variant="tile" />
                  ))}
                </div>
              </div>
            )}

            {/* Places section */}
            {places.length > 0 && (
              <div>
                <SectionHeader
                  title="Lugares e Estabelecimentos"
                  subtitle={`${places.length} encontrados`}
                  className="px-0 mb-2"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {places.map((place) => (
                    <PlaceCard key={place.id} place={place} variant="grid" />
                  ))}
                </div>
              </div>
            )}

            {/* Events section */}
            {events.length > 0 && (
              <div>
                <SectionHeader
                  title="Eventos & Festividades"
                  subtitle={`${events.length} na agenda`}
                  className="px-0 mb-2"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} variant="standard" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      ) : activeTab === 'places' ? (
        places.length === 0 ? (
          <EmptyState
            title="Nenhum local encontrado"
            description="Tente relaxar os filtros ou buscar por outro termo, município ou categoria."
            actionText="Limpar Filtros"
            onAction={() => {
              setSearchQuery('');
              setFilters({ sort_by: 'featured' });
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {places.map((place) => (
              <PlaceCard key={place.id} place={place} variant="grid" />
            ))}
          </div>
        )
      ) : events.length === 0 ? (
        <EmptyState
          title="Nenhum evento agendado"
          description="Não encontramos eventos para a seleção atual. Experimente buscar em todas as cidades."
          actionText="Ver todos os eventos"
          onAction={() => {
            setSearchQuery('');
            setFilters({});
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {events.map((event) => (
            <EventCard key={event.id} event={event} variant="standard" />
          ))}
        </div>
      )}

      {/* Filter Bottom Sheet Modal */}
      <FilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onApplyFilters={(next) => {
          setFilters(next);
          if (next.sort_by === 'distance' && !referenceCoords) {
            openConsentModal();
          }
        }}
        cities={cities}
        categories={categories}
      />

      {/* Geolocation consent modal for proximity ordering */}
      <GeolocationConsentModal
        isOpen={isConsentModalOpen}
        onClose={closeConsentModal}
        onConsentGranted={(coords) => {
          setUserCoords(coords);
          closeConsentModal();
        }}
        onManualSelect={() => {
          closeConsentModal();
        }}
      />
    </div>
  );
};
