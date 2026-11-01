import React from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext';

interface FavoriteButtonProps {
  placeId?: number;
  eventId?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  stopPropagation?: boolean;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  placeId,
  eventId,
  size = 'md',
  className = '',
  stopPropagation = true,
}) => {
  const { isFavorite, toggleFavorite, isEventFavorite, toggleEventFavorite } = useFavorites();
  const isEvent = eventId !== undefined;
  const active = isEvent ? isEventFavorite(eventId!) : placeId !== undefined ? isFavorite(placeId) : false;

  const visualSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isEvent && eventId !== undefined) {
      toggleEventFavorite(eventId);
    } else if (placeId !== undefined) {
      toggleFavorite(placeId);
    }
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      aria-label={active ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
      className={`relative inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full transition-transform active:scale-90 focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none z-20 cursor-pointer ${className}`}
    >
      <span
        className={`rounded-full flex items-center justify-center transition-all duration-200 pointer-events-none ${visualSizes[size]} ${
          active
            ? 'bg-white/95 text-[#DE1F2A] shadow-md hover:bg-white'
            : 'bg-white/80 text-gray-700 hover:text-[#DE1F2A] hover:bg-white shadow-sm backdrop-blur-md'
        }`}
      >
        <Heart
          className={`${iconSizes[size]} transition-transform duration-200 ${
            active ? 'fill-[#DE1F2A] text-[#DE1F2A] scale-110' : ''
          }`}
        />
      </span>
    </button>
  );
};
