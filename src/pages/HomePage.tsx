import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { setPageMeta } from '../utils/seo';
import { Sparkles, Compass } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCitySlug, selectedCity } = useCity();

  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredPlaces, setFeaturedPlaces] = useState<Place[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

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
    try {
      const cityFilter = selectedCitySlug === 'all' ? undefined : selectedCitySlug;

      const [catsData, featuredData, nearbyData, eventsData] = await Promise.all([
        categoriesApi.getAll(),
        placesApi.getAll({
          city_slug: cityFilter,
          sort_by: 'featured',
        }),
        placesApi.getNearby(cityFilter),
        eventsApi.getAll(cityFilter),
      ]);

      setCategories(catsData);
      setFeaturedPlaces(featuredData);
      setNearbyPlaces(nearbyData);
      setEvents(eventsData);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCitySlug]);

  const handleSearchSubmit = (val: string) => {
    setSearchQuery(val);
    if (val.trim()) {
      navigate(`/explorar?q=${encodeURIComponent(val.trim())}`);
    }
  };

  // Determine greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (hasError) {
    return (
      <div className="py-8">
        <ErrorState onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-300">
      {/* 1. Hero Greeting & Search Bar */}
      <section className="px-4 pt-4 sm:pt-6">
        <div className="bg-gradient-to-br from-[#1F2024] via-[#2A2B31] to-[#1F2024] text-white rounded-3xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
          {/* Subtle decorative background glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#D9262E]/25 rounded-full blur-3xl pointer-events-none" />
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
              subtitle="Navegue por experiências"
              actionText="Ver todas"
              actionTo="/explorar"
            />
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
              {categories.map((category) => (
                <div key={category.id} className="w-24 sm:w-28 shrink-0">
                  <CategoryCard category={category} variant="tile" />
                </div>
              ))}
            </div>
          </section>

          {/* 3. Destaques do Cariri (Large Horizontal Carousel) */}
          {featuredPlaces.length > 0 && (
            <section>
              <SectionHeader
                title="Em Destaque"
                subtitle="Lugares imperdíveis na região"
                actionText="Explorar"
                actionTo="/explorar"
              />
              <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2">
                {featuredPlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    variant="featured"
                  />
                ))}
              </div>
            </section>
          )}

          {/* 4. Eventos e Festividades */}
          {events.length > 0 && (
            <section>
              <SectionHeader
                title="Agenda Cultural & Eventos"
                subtitle="Festas, romarias e festivais"
                actionText="Ver eventos"
                actionTo="/explorar?tab=events"
              />
              <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    variant="featured"
                  />
                ))}
              </div>
            </section>
          )}

          {/* 5. Locais Próximos / Bem Avaliados */}
          <section className="px-4">
            <SectionHeader
              title="Perto de Você"
              subtitle="Baseado no município selecionado"
              actionText="Ver no mapa"
              actionTo="/mapa"
              className="px-0"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {nearbyPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  variant="horizontal"
                />
              ))}
            </div>
          </section>

          {/* 6. PWA Install Invitation Banner */}
          <section className="px-4">
            <PWAInstallButton variant="banner" />
          </section>

          {/* 7. Recomendações Especiais / Roteiro */}
          <section className="px-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FDE8E9] flex items-center justify-center text-[#D9262E] shrink-0">
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
                className="w-full sm:w-auto px-5 py-2.5 bg-[#D9262E] hover:bg-[#BF1E25] text-white text-xs font-bold rounded-xl active:scale-95 transition shrink-0 shadow-sm"
              >
                Abrir Mapa Interativo
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
