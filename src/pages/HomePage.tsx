import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Place, EventItem, Category } from '../types';
import { placesApi } from '../services/api/places';
import { eventsApi } from '../services/api/events';
import { categoriesApi } from '../services/api/categories';
import { useCity } from '../context/CityContext';
import { SearchBar } from '../components/common/SearchBar';
import { CategoryCard } from '../components/cards/CategoryCard';
import { PlaceCard } from '../components/cards/PlaceCard';
import { EventCard } from '../components/cards/EventCard';
import { SectionHeader } from '../components/common/SectionHeader';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { PWAInstallButton } from '../components/common/PWAInstallButton';
import { ApiDiagnosticReport } from '../services/api/diagnostics';
import { ApiError } from '../services/api/config';
import { analytics } from '../services/analyticsService';
import { setPageMeta } from '../utils/seo';
import {
  Sparkles,
  Compass,
  Navigation,
  X,
  Clock,
  Ticket,
  Accessibility,
  Camera,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { GeolocationConsentModal } from '../components/common/GeolocationConsentModal';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCitySlug, selectedCity } = useCity();
  const {
    referenceCoords,
    isGpsActive,
    isConsentModalOpen,
    openConsentModal,
    closeConsentModal,
    setUserCoords,
    clearGpsLocation,
  } = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredPlaces, setFeaturedPlaces] = useState<Place[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Filters
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterFree, setFilterFree] = useState(false);
  const [filterAccessible, setFilterAccessible] = useState(false);
  const [filterWithPhotos, setFilterWithPhotos] = useState(false);

  // Horizontal Carousels Refs
  const featuredRailRef = useRef<HTMLDivElement>(null);
  const eventsRailRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('Não foi possível carregar as informações do Cariri.');
  const [diagnostic, setDiagnostic] = useState<ApiDiagnosticReport | undefined>();

  useEffect(() => {
    setPageMeta({
      title: 'Descubra o Cariri Cearense',
      description:
        'Guia digital de descobertas, gastronomia, turismo e cultura em Crato, Juazeiro do Norte e Barbalha.',
    });
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setHasError(false);
    setDiagnostic(undefined);
    try {
      const cityFilter = selectedCitySlug === 'all' ? undefined : selectedCitySlug;

      const [catsData, featuredData, nearbyData, eventsData] = await Promise.all([
        categoriesApi.getAll(),
        placesApi.getAll({
          city_slug: cityFilter,
          sort_by: 'featured',
          latitude: referenceCoords?.latitude,
          longitude: referenceCoords?.longitude,
        }),
        placesApi.getNearby(cityFilter, referenceCoords),
        eventsApi.getAll(cityFilter),
      ]);

      setCategories(catsData);
      setFeaturedPlaces(featuredData);
      setNearbyPlaces(nearbyData);
      setEvents(eventsData);
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
  }, [selectedCitySlug, referenceCoords?.latitude, referenceCoords?.longitude]);

  const handleSearchSubmit = (val: string) => {
    setSearchQuery(val);
    if (val.trim()) {
      analytics.track('search', {
        search_term: val.trim(),
        city_slug: selectedCitySlug !== 'all' ? selectedCitySlug : undefined,
      });
      navigate(`/explorar?q=${encodeURIComponent(val.trim())}`);
    }
  };

  const scrollRail = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const amount = direction === 'left' ? -340 : 340;
      ref.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Determine greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Quick Filter Application
  const applyQuickFiltersToPlaces = (items: Place[]) => {
    return items.filter((p) => {
      if (filterOpenNow && !p.is_open_now) return false;
      if (filterFree && p.price_level > 1) return false;
      if (filterAccessible && (!p.accessibility || p.accessibility.length === 0)) return false;
      if (filterWithPhotos && (!p.cover_image || p.cover_image.length < 5)) return false;
      return true;
    });
  };

  const applyQuickFiltersToEvents = (items: EventItem[]) => {
    return items.filter((e) => {
      if (filterFree && !e.is_free) return false;
      if (filterWithPhotos && (!e.cover_image || e.cover_image.length < 5)) return false;
      return true;
    });
  };

  const displayedFeaturedPlaces = applyQuickFiltersToPlaces(featuredPlaces);
  const displayedNearbyPlaces = applyQuickFiltersToPlaces(nearbyPlaces);
  const displayedEvents = applyQuickFiltersToEvents(events);

  if (hasError) {
    return (
      <div className="py-8">
        <ErrorState message={errorMessage} diagnostic={diagnostic} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Hero Greeting & Search Bar with Quick Filter Chips */}
      <section className="px-4 pt-4 sm:pt-6">
        <div className="bg-gradient-to-br from-[#1F2024] via-[#2A2B31] to-[#1F2024] text-white rounded-3xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
          {/* Decorative glows */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#DE1F2A]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-white/90 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {selectedCity
                  ? `Explorando ${selectedCity.name}`
                  : 'Oásis no Sertão • Cariri Cearense'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {getGreeting()}, <br className="sm:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-300">
                o que você procura?
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-300 mt-1.5 mb-4 max-w-md">
              Descubra lugares únicos, gastronomia e vivências autênticas em Crato, Juazeiro e Barbalha.
            </p>

            <SearchBar
              value={searchQuery}
              onChange={handleSearchSubmit}
              placeholder="Onde vamos hoje? (ex: Sirigado, trilhas, café...)"
              className="w-full"
            />

            {/* Filtros Rápidos com feedback de estado ativo */}
            <div className="flex flex-wrap items-center gap-1.5 pt-3.5">
              <span className="text-[11px] text-gray-400 font-medium mr-1 hidden sm:inline">
                Filtros rápidos:
              </span>

              <button
                type="button"
                onClick={() => setFilterOpenNow(!filterOpenNow)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none min-h-[36px] ${
                  filterOpenNow
                    ? 'bg-[#DE1F2A] text-white shadow-xs font-bold'
                    : 'bg-white/10 hover:bg-white/20 text-white/90'
                }`}
                aria-pressed={filterOpenNow}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Aberto agora</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterFree(!filterFree)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none min-h-[36px] ${
                  filterFree
                    ? 'bg-[#DE1F2A] text-white shadow-xs font-bold'
                    : 'bg-white/10 hover:bg-white/20 text-white/90'
                }`}
                aria-pressed={filterFree}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Gratuito</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterAccessible(!filterAccessible)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none min-h-[36px] ${
                  filterAccessible
                    ? 'bg-[#DE1F2A] text-white shadow-xs font-bold'
                    : 'bg-white/10 hover:bg-white/20 text-white/90'
                }`}
                aria-pressed={filterAccessible}
              >
                <Accessibility className="w-3.5 h-3.5" />
                <span>Acessível</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterWithPhotos(!filterWithPhotos)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none min-h-[36px] ${
                  filterWithPhotos
                    ? 'bg-[#DE1F2A] text-white shadow-xs font-bold'
                    : 'bg-white/10 hover:bg-white/20 text-white/90'
                }`}
                aria-pressed={filterWithPhotos}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Com fotos</span>
              </button>

              {(filterOpenNow || filterFree || filterAccessible || filterWithPhotos) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterOpenNow(false);
                    setFilterFree(false);
                    setFilterAccessible(false);
                    setFilterWithPhotos(false);
                  }}
                  className="text-[11px] text-amber-300 hover:underline px-2 py-1 font-semibold flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" />
                  <span>Limpar filtros</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Loading Skeleton */}
      {isLoading ? (
        <LoadingState count={4} />
      ) : (
        <>
          {/* 2. Visual Categories Rail */}
          <section>
            <SectionHeader
              title="Categorias"
              subtitle="Navegue por experiências no Cariri"
              actionText="Ver todas"
              actionTo="/explorar"
            />
            {categories.length === 0 ? (
              <div className="px-4 py-2">
                <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center text-xs text-gray-500">
                  Nenhuma categoria cadastrada.
                </div>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
                {categories.map((category) => (
                  <div key={category.id} className="w-24 sm:w-28 shrink-0">
                    <CategoryCard category={category} variant="tile" />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3. Destaques do Cariri (Carrossel com controles claros) */}
          {displayedFeaturedPlaces.length > 0 && (
            <section className="relative">
              <div className="flex items-center justify-between px-4 mb-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                    Em Destaque
                  </h2>
                  <p className="text-xs text-gray-500">
                    Lugares imperdíveis na região do Cariri
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => scrollRail(featuredRailRef, 'left')}
                      className="p-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full transition shadow-2xs"
                      aria-label="Rolar destaques para esquerda"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollRail(featuredRailRef, 'right')}
                      className="p-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full transition shadow-2xs"
                      aria-label="Rolar destaques para direita"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <Link
                    to="/explorar"
                    className="text-xs font-bold text-[#DE1F2A] hover:underline pl-2"
                  >
                    Ver todos
                  </Link>
                </div>
              </div>

              <div
                ref={featuredRailRef}
                className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-3 scroll-smooth snap-x snap-mandatory"
              >
                {displayedFeaturedPlaces.map((place) => (
                  <div key={place.id} className="snap-start shrink-0">
                    <PlaceCard place={place} variant="featured" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. Agenda Cultural & Eventos (Carrossel) */}
          {displayedEvents.length > 0 && (
            <section className="relative">
              <div className="flex items-center justify-between px-4 mb-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                    Agenda Cultural & Eventos
                  </h2>
                  <p className="text-xs text-gray-500">
                    Festividades, feiras e espetáculos
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => scrollRail(eventsRailRef, 'left')}
                      className="p-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full transition shadow-2xs"
                      aria-label="Rolar eventos para esquerda"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollRail(eventsRailRef, 'right')}
                      className="p-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full transition shadow-2xs"
                      aria-label="Rolar eventos para direita"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <Link
                    to="/explorar?tab=events"
                    className="text-xs font-bold text-[#DE1F2A] hover:underline pl-2"
                  >
                    Ver agenda
                  </Link>
                </div>
              </div>

              <div
                ref={eventsRailRef}
                className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-3 scroll-smooth snap-x snap-mandatory"
              >
                {displayedEvents.map((event) => (
                  <div key={event.id} className="snap-start shrink-0">
                    <EventCard event={event} variant="featured" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. Locais Próximos com Transparência de GPS */}
          <section className="px-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-gray-100 pt-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  Perto de Você
                </h2>
                <p className="text-xs text-gray-500">
                  {isGpsActive
                    ? 'Distâncias precisas em linha reta calculadas pelo seu GPS'
                    : selectedCity
                    ? `Distâncias estimadas a partir do centro de ${selectedCity.name}`
                    : 'Ative o GPS ou selecione uma cidade para calcular a distância exata'}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                {isGpsActive ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold shadow-2xs">
                    <Navigation className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>GPS Ativo (~raio 15km)</span>
                    <button
                      type="button"
                      onClick={clearGpsLocation}
                      className="ml-1 p-0.5 text-emerald-700 hover:text-emerald-950 rounded hover:bg-emerald-100 transition"
                      aria-label="Desativar GPS"
                      title="Desativar GPS e voltar à cidade"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={openConsentModal}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 rounded-xl text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none min-h-[44px]"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#DE1F2A]" />
                    <span>Usar meu GPS</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedNearbyPlaces.map((place) => (
                <PlaceCard key={place.id} place={place} variant="horizontal" />
              ))}
            </div>
          </section>

          {/* 6. Contextual CTA: Contribuir com a Plataforma */}
          <section className="px-4">
            <div className="bg-gradient-to-br from-[#8C4320]/10 via-[#F7F3EE] to-white rounded-3xl p-5 sm:p-6 border border-[#8C4320]/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-[#8C4320] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Conhece um refúgio ou evento no Cariri?
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5 max-w-md">
                    Ajude a fortalecer o guia regional. O cadastro é gratuito e passa pela curadoria do Kariri.app antes de ser publicado.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                <Link
                  to="/locais/novo"
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-[#DE1F2A] hover:bg-[#C51620] active:scale-95 text-white text-xs font-bold rounded-xl transition text-center shadow-xs min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none"
                >
                  Novo Local
                </Link>
                <Link
                  to="/eventos/novo"
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl transition text-center shadow-2xs min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none"
                >
                  Novo Evento
                </Link>
              </div>
            </div>
          </section>

          {/* 7. PWA Install Invitation Banner */}
          <section className="px-4">
            <PWAInstallButton variant="banner" />
          </section>

          {/* 8. Mapa Interativo CTA */}
          <section className="px-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FDE8E9] flex items-center justify-center text-[#DE1F2A] shrink-0">
                <Compass className="w-7 h-7" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-base font-bold text-gray-900">
                  Quer ver todos os pontos no mapa interativo?
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Explore pontos turísticos, rotas pela Chapada e restaurantes pelo GPS.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/mapa')}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#1F2024] hover:bg-black text-white text-xs font-bold rounded-xl active:scale-95 transition shrink-0 shadow-sm min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none"
              >
                Abrir Mapa Interativo
              </button>
            </div>
          </section>
        </>
      )}

      {/* Modal de consentimento e ativação de GPS */}
      <GeolocationConsentModal
        isOpen={isConsentModalOpen}
        onClose={closeConsentModal}
        onConsentGranted={(coords) => {
          setUserCoords(coords);
          closeConsentModal();
        }}
        onManualSelect={() => {
          closeConsentModal();
          navigate('/explorar');
        }}
      />
    </div>
  );
};
