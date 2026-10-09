import React, { useEffect, useState } from 'react';
import { Place, EventItem } from '../types';
import { placesApi } from '../services/api/places';
import { eventsApi } from '../services/api/events';
import { useFavorites } from '../context/FavoritesContext';
import { PlaceCard } from '../components/cards/PlaceCard';
import { EventCard } from '../components/cards/EventCard';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { setPageMeta } from '../utils/seo';
import { Heart, Calendar, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { favoriteIds, favoriteEventIds } = useFavorites();
  const [activeTab, setActiveTab] = useState<'places' | 'events'>('places');
  const [favoritePlaces, setFavoritePlaces] = useState<Place[]>([]);
  const [favoriteEvents, setFavoriteEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPageMeta({
      title: 'Meus Favoritos no Cariri',
      description: 'Lugares e eventos favoritos salvos para sua jornada no Cariri cearense.',
    });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([
      placesApi.getAll(),
      eventsApi.getAll(),
    ]).then(([placesRes, eventsRes]) => {
      if (placesRes.status === 'fulfilled') {
        const favPlaces = placesRes.value.filter((p) => favoriteIds.includes(p.id));
        setFavoritePlaces(favPlaces);
      }
      if (eventsRes.status === 'fulfilled') {
        const favEvents = eventsRes.value.filter((e) => favoriteEventIds.includes(e.id));
        setFavoriteEvents(favEvents);
      }
      setIsLoading(false);
    });
  }, [favoriteIds, favoriteEventIds]);

  const totalCount = favoritePlaces.length + favoriteEvents.length;

  return (
    <div className="px-4 py-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          Meus Favoritos
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {totalCount} {totalCount === 1 ? 'item salvo' : 'itens salvos na sua lista pessoal'}
        </p>

        {/* Tab Switcher */}
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => setActiveTab('places')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'places'
                ? 'bg-[#000000] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Locais ({favoritePlaces.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'events'
                ? 'bg-[#DE1F2A] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Eventos ({favoriteEvents.length})</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState count={3} />
      ) : activeTab === 'places' ? (
        favoritePlaces.length === 0 ? (
          <EmptyState
            icon={<Heart className="w-8 h-8 text-[#DE1F2A]" />}
            title="Nenhum local salvo ainda"
            description="Toque no coração dos locais que você mais gostar para salvar sua lista personalizada de experiências no Cariri."
            actionText="Explorar Locais"
            onAction={() => navigate('/explorar')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoritePlaces.map((place) => (
              <PlaceCard key={place.id} place={place} variant="grid" />
            ))}
          </div>
        )
      ) : favoriteEvents.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8 text-[#DE1F2A]" />}
          title="Nenhum evento salvo ainda"
          description="Navegue pela agenda cultural e salve os shows, festivais e romarias que você quer acompanhar."
          actionText="Ver Agenda Cultural"
          onAction={() => navigate('/explorar')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteEvents.map((event) => (
            <EventCard key={event.id} event={event} variant="standard" />
          ))}
        </div>
      )}
    </div>
  );
};
