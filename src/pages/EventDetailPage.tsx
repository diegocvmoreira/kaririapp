import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventItem } from '../types';
import { eventsApi } from '../services/api/events';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { BackButton } from '../components/common/BackButton';
import { ShareButton } from '../components/common/ShareButton';
import { setPageMeta } from '../utils/seo';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Ticket,
  Sparkles,
  Info,
} from 'lucide-react';

export const EventDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    setHasError(false);

    eventsApi
      .getBySlug(slug)
      .then((data) => {
        if (!data) {
          setHasError(true);
          return;
        }
        setEvent(data);
        setPageMeta({
          title: `${data.title} - ${data.city_name}`,
          description: data.description.slice(0, 150),
          image: data.cover_image,
        });
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadingState count={3} />
      </div>
    );
  }

  if (hasError || !event) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <ErrorState
          message="O evento solicitado não foi encontrado."
          onRetry={() => navigate('/explorar')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Header controls */}
      <div className="flex items-center justify-between">
        <BackButton fallbackTo="/explorar" />

        <ShareButton
          title={event.title}
          text={`${event.title} em ${event.city_name} - ${event.display_date}`}
          size="md"
        />
      </div>

      {/* 2. Cover Banner */}
      <div className="relative w-full h-72 sm:h-96 rounded-3xl overflow-hidden shadow-md bg-gray-900">
        <img
          src={event.cover_image}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

        <div className="absolute top-4 left-4 flex gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D9262E] text-white shadow-sm flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {event.display_date}
          </span>
          {event.is_free && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm">
              Entrada Franca
            </span>
          )}
        </div>

        <div className="absolute bottom-4 inset-x-4 text-white">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            {event.category}
          </span>
          <h1 className="text-xl sm:text-3xl font-black text-white mt-1 leading-tight">
            {event.title}
          </h1>
        </div>
      </div>

      {/* 3. Main Info Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
          <div className="p-3 bg-gray-50 rounded-2xl flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#D9262E] shrink-0" />
            <div>
              <p className="font-bold text-gray-900">Data</p>
              <p className="text-gray-600 mt-0.5">{event.display_date}</p>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#D9262E] shrink-0" />
            <div>
              <p className="font-bold text-gray-900">Horário</p>
              <p className="text-gray-600 mt-0.5">{event.start_time}</p>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl flex items-center gap-3">
            <Ticket className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-gray-900">Ingressos / Valor</p>
              <p className="text-gray-600 mt-0.5">{event.price_text}</p>
            </div>
          </div>
        </div>

        {/* Location Row */}
        <div className="p-4 bg-gray-50 rounded-2xl flex items-start gap-3">
          <MapPin className="w-5 h-5 text-[#D9262E] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-gray-900">{event.place_name}</p>
            <p className="text-gray-600 text-xs sm:text-sm mt-0.5">{event.address}</p>
            <span className="inline-block mt-1 text-xs font-semibold text-[#D9262E]">
              {event.city_name}, Cariri Cearense
            </span>
          </div>
        </div>

        {/* Ticket CTA */}
        {event.ticket_url && (
          <a
            href={event.ticket_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 bg-[#D9262E] hover:bg-[#BF1E25] active:scale-98 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Ticket className="w-4 h-4" />
            <span>Garantir Ingresso / Inscrição</span>
            <ExternalLink className="w-4 h-4 ml-1" />
          </a>
        )}
      </div>

      {/* 4. Description */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D9262E]" />
          <span>Sobre o Evento</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
          {event.description}
        </p>
      </div>
    </div>
  );
};
