import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Ticket, Building, ExternalLink } from 'lucide-react';
import { EventItem } from '../../types';
import { FavoriteButton } from '../common/FavoriteButton';

interface EventCardProps {
  event: EventItem;
  variant?: 'featured' | 'standard' | 'compact';
  className?: string;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  variant = 'standard',
  className = '',
}) => {
  if (variant === 'featured') {
    return (
      <div
        className={`relative w-72 sm:w-80 h-96 rounded-3xl overflow-hidden shadow-md group shrink-0 flex flex-col justify-end select-none bg-gray-900 ${className}`}
      >
        <img
          src={event.cover_image}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

        {/* Date & Free Tag */}
        <div className="absolute top-3.5 left-3.5 z-10 flex gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#D9262E] text-white shadow-sm flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {event.display_date}
          </span>
          {event.is_free && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-sm">
              Grátis
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <div className="absolute top-3.5 right-3.5 z-20">
          <FavoriteButton eventId={event.id} size="sm" />
        </div>

        {/* Info */}
        <div className="relative p-4 z-10 text-white space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
              {event.category}
            </span>
            {event.ticket_url && (
              <span className="inline-flex items-center gap-1 text-[10px] text-white/80 bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-xs">
                <Ticket className="w-2.5 h-2.5 text-amber-300" />
                Ingressos
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 leading-snug group-hover:text-amber-200 transition-colors">
            {event.title}
          </h3>

          <p className="text-xs text-gray-300 line-clamp-2 font-normal leading-relaxed">
            {event.description}
          </p>

          {event.organizer && (
            <p className="text-[11px] text-gray-300/80 truncate flex items-center gap-1">
              <Building className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate">{event.organizer}</span>
            </p>
          )}

          <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-white/90">
            <span className="flex items-center gap-1 truncate text-xs">
              <MapPin className="w-3.5 h-3.5 text-[#D9262E] shrink-0" />
              <span className="truncate">{event.city_name}</span>
            </span>

            <span className="font-bold text-[#FDE8E9] text-xs">
              {event.price_text}
            </span>
          </div>

          <Link
            to={`/eventos/${event.slug}`}
            className="absolute inset-0 z-0"
            aria-label={`Ver ${event.title}`}
          />
        </div>
      </div>
    );
  }

  // Standard List/Grid Card
  return (
    <div
      className={`relative flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-lg transition-all duration-300 group ${className}`}
    >
      <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-gray-100">
        <img
          src={event.cover_image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute top-3 left-3 flex gap-1.5 z-10">
          <span className="px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-bold text-gray-800 shadow-xs flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#D9262E]" />
            {event.display_date}
          </span>
          {event.is_free ? (
            <span className="px-2 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-bold shadow-xs">
              Gratuito
            </span>
          ) : (
            <span className="px-2 py-1 bg-gray-900/80 backdrop-blur-md text-white rounded-full text-[10px] font-semibold">
              {event.price_text}
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <div className="absolute top-3 right-3 z-20">
          <FavoriteButton eventId={event.id} size="sm" />
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[#D9262E] uppercase tracking-wide">
              {event.category}
            </span>
            {event.ticket_url && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                <Ticket className="w-2.5 h-2.5 text-[#D9262E]" />
                Ingresso
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-gray-900 group-hover:text-[#D9262E] transition-colors line-clamp-1 mt-0.5">
            {event.title}
          </h3>

          <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
            {event.description}
          </p>

          {event.organizer && (
            <p className="text-[11px] text-gray-400 mt-1 truncate flex items-center gap-1">
              <Building className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate">{event.organizer}</span>
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1 truncate max-w-[170px]">
            <MapPin className="w-3.5 h-3.5 text-[#D9262E] shrink-0" />
            <span className="truncate">{event.place_name}, {event.city_name}</span>
          </span>

          <span className="flex items-center gap-1 font-medium text-gray-600 shrink-0">
            <Clock className="w-3 h-3 text-gray-400" />
            {event.start_time}
          </span>
        </div>
      </div>

      <Link
        to={`/eventos/${event.slug}`}
        className="absolute inset-0 z-0"
        aria-label={`Ver ${event.title}`}
      />
    </div>
  );
};
