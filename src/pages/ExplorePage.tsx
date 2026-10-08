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
import { setPageMeta } from '../utils/seo';

export const ExplorePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { cities, selectedCitySlug } = useCity();

  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'places' | 'events'>('all');

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
        const catName = catObj ? catObj.name.toLowerCase() : filters.category_slug.toLowerCase();
        filteredEvents = filteredEvents.filter(
          (e) =>
            e.category.toLowerCase().includes(catName) ||
            e.category.toLowerCase().includes(filters.category_slug!.toLowerCase()) ||
            catName.includes(e.category.toLowerCase())
        );
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filteredPlaces = filteredPlaces.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.short_description.toLowerCase().includes(q) ||
            p.category_name.toLowerCase().includes(q) ||
            p.city_name.toLowerCase().includes(q) ||
            p.neighborhood.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q))
        );

        filteredEvents = filteredEvents.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q) ||
            e.city_name.toLowerCase().includes(q) ||
            e.place_name.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q) ||
            (e.organizer && e.organizer.toLowerCase().includes(q))
        );
      }

      setPlaces(filteredPlaces);
      setEvents(filteredEvents);
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
  }, [filters, searchQuery]);

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

  // Matched categories for mixed results (Seção 13)
  const matchedCategories = searchQuery.trim()
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : [];

  const totalResults = places.length + events.length;

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
              ? 'bg-[#D9262E] text-white shadow-xs'
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
              ? 'bg-[#D9262E] text-white shadow-xs'
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

      {/* 4. Active Filter Tags Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs text-gray-500 overflow-x-auto no-scrollbar py-1">
          <span className="font-semibold text-gray-400 shrink-0">Filtros:</span>
          {filters.city_slug && (
            <span className="px-2.5 py-1 bg-gray-100 rounded-full font-medium text-gray-700 shrink-0">
              Cidade: {filters.city_slug}
            </span>
          )}
          {filters.category_slug && (
            <span className="px-2.5 py-1 bg-gray-100 rounded-full font-medium text-gray-700 shrink-0">
              Categoria: {filters.category_slug}
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
            className="text-[#D9262E] font-semibold hover:underline shrink-0 pl-1"
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
        onApplyFilters={setFilters}
        cities={cities}
        categories={categories}
      />
    </div>
  );
};
