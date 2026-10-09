import React from 'react';
import { Link } from 'react-router-dom';
import { Place } from '../../types';
import { Rating } from '../common/Rating';
import { FavoriteButton } from '../common/FavoriteButton';
import { LocationBadge } from '../common/LocationBadge';
import { PriceBadge } from '../common/PriceBadge';
import { Clock } from 'lucide-react';

interface PlaceCardProps {
  place: Place;
  variant?: 'featured' | 'grid' | 'horizontal' | 'compact';
  className?: string;
}

const DEFAULT_PLACE_COVER =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80';

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  variant = 'grid',
  className = '',
}) => {
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = DEFAULT_PLACE_COVER;
  };

  // 1. Featured card (Large hero card style, similar to travel agency mobile app)
  if (variant === 'featured') {
    return (
      <div
        className={`relative flex flex-col justify-end w-72 sm:w-80 h-96 rounded-3xl overflow-hidden shadow-md group shrink-0 select-none bg-gray-900 ${className}`}
      >
        <img
          src={place.cover_image || DEFAULT_PLACE_COVER}
          alt={place.name}
          onError={handleImgError}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

        {/* Top Badges */}
        <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-10">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#DE1F2A] text-white shadow-sm tracking-wide uppercase">
            Destaque
          </span>
          <FavoriteButton placeId={place.id} size="sm" />
        </div>

        {/* Content */}
        <div className="relative p-4 z-10 text-white space-y-1.5">
          <div className="flex items-center justify-between text-xs text-white/90">
            <span className="font-semibold text-white/80 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px]">
              {place.category_name}
            </span>
            <div className="bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center">
              <Rating value={place.rating} count={place.reviews_count} size="sm" />
            </div>
          </div>

          <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
            {place.name}
          </h3>

          <p className="text-xs text-gray-200 line-clamp-2 font-normal leading-relaxed">
            {place.short_description}
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-white/15 text-xs text-white/80">
            <LocationBadge
              cityName={place.city_name}
              neighborhood={place.neighborhood}
              distanceKm={place.distance_km}
              className="text-white/90"
            />
            <PriceBadge level={place.price_level} className="bg-white/20 text-white" />
          </div>

          <Link
            to={`/locais/${place.slug}`}
            className="absolute inset-0 z-0"
            aria-label={`Ver detalhes de ${place.name}`}
          />
        </div>
      </div>
    );
  }

  // 2. Horizontal Card (Row format, great for "Locais próximos" list)
  if (variant === 'horizontal') {
    return (
      <div
        className={`relative flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all duration-200 group ${className}`}
      >
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-gray-100">
          <img
            src={place.cover_image}
            alt={place.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {place.is_open_now && (
            <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-emerald-600/90 backdrop-blur-xs text-white font-bold text-[9px] rounded-md">
              Aberto
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold text-[#DE1F2A] uppercase tracking-wider truncate">
                {place.category_name}
              </span>
              <Rating value={place.rating} size="sm" showCount={false} />
            </div>

            <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-[#DE1F2A] transition-colors mt-0.5">
              {place.name}
            </h3>

            <LocationBadge
              cityName={place.city_name}
              neighborhood={place.neighborhood}
              distanceKm={place.distance_km}
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-50 text-xs">
            <PriceBadge level={place.price_level} />
            <FavoriteButton placeId={place.id} size="sm" />
          </div>
        </div>

        <Link
          to={`/locais/${place.slug}`}
          className="absolute inset-0 z-0"
          aria-label={`Ver ${place.name}`}
        />
      </div>
    );
  }

  // 3. Compact Card (Used for Map popups & quick previews)
  if (variant === 'compact') {
    return (
      <div className={`p-2 bg-white rounded-2xl max-w-xs ${className}`}>
        <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2">
          <img
            src={place.cover_image}
            alt={place.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <FavoriteButton placeId={place.id} size="sm" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#DE1F2A]">
              {place.category_name}
            </span>
            <Rating value={place.rating} size="sm" showCount={false} />
          </div>
          <h4 className="text-xs font-bold text-gray-900 truncate">{place.name}</h4>
          <LocationBadge cityName={place.city_name} distanceKm={place.distance_km} />
          <Link
            to={`/locais/${place.slug}`}
            className="mt-2 block w-full text-center py-1.5 bg-[#DE1F2A] text-white text-[11px] font-bold rounded-lg hover:bg-[#C51620] transition"
          >
            Ver Detalhes
          </Link>
        </div>
      </div>
    );
  }

  // 4. Grid Card (Standard explore card)
  return (
    <div
      className={`relative flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-lg transition-all duration-300 group ${className}`}
    >
      {/* Image container */}
      <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-gray-100">
        <img
          src={place.cover_image}
          alt={place.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Category & Status overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-gray-800 shadow-xs">
            {place.category_name}
          </span>
          {place.is_open_now && (
            <span className="px-2 py-1 bg-emerald-500/90 backdrop-blur-md rounded-full text-[10px] font-bold text-white shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Aberto
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton placeId={place.id} size="sm" />
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <Rating value={place.rating} count={place.reviews_count} size="sm" />
            <PriceBadge level={place.price_level} />
          </div>

          <h3 className="text-base font-bold text-gray-900 group-hover:text-[#DE1F2A] transition-colors line-clamp-1">
            {place.name}
          </h3>

          <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
            {place.short_description}
          </p>
        </div>

        <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-xs">
          <LocationBadge
            cityName={place.city_name}
            neighborhood={place.neighborhood}
            distanceKm={place.distance_km}
          />
          {place.opening_hours && (
            <span className="text-[11px] text-gray-400 flex items-center gap-1 truncate max-w-[120px]" title={place.opening_hours}>
              <Clock className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate">{place.opening_hours.split('•')[0]}</span>
            </span>
          )}
        </div>
      </div>

      <Link
        to={`/locais/${place.slug}`}
        className="absolute inset-0 z-0"
        aria-label={`Ver ${place.name}`}
      />
    </div>
  );
};
