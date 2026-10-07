import React, { useEffect, useState } from 'react';
import { Place } from '../types';
import { placesApi } from '../services/api/places';
import { useFavorites } from '../context/FavoritesContext';
import { PlaceCard } from '../components/cards/PlaceCard';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { setPageMeta } from '../utils/seo';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FavoritesPage: React.FC = () => {
  const { favoriteIds } = useFavorites();
  const [favoritePlaces, setFavoritePlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPageMeta({
      title: 'Meus Locais Salvos',
      description: 'Lugares e experiências favoritos salvos para sua jornada no Cariri.',
    });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    placesApi
      .getAll()
      .then((allPlaces) => {
        const favs = allPlaces.filter((p) => favoriteIds.includes(p.id));
        setFavoritePlaces(favs);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [favoriteIds]);

  return (
    <div className="px-4 py-4 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Meus Favoritos
          </h1>
          <p className="text-xs text-gray-500">
            {favoritePlaces.length} {favoritePlaces.length === 1 ? 'lugar salvo' : 'lugares salvos'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingState count={3} />
      ) : favoritePlaces.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-8 h-8 text-[#D9262E]" />}
          title="Nenhum local salvo ainda"
          description="Toque no coração dos locais que você mais gostar para salvar sua lista personalizada de experiências no Cariri."
          actionText="Explorar Locais"
          onAction={() => {}}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoritePlaces.map((place) => (
            <PlaceCard key={place.id} place={place} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
};
