import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventItem } from '../types';
import { eventsApi } from '../services/api/events';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { BackButton } from '../components/common/BackButton';
import { ShareButton } from '../components/common/ShareButton';
import { FavoriteButton } from '../components/common/FavoriteButton';
import { EventCard } from '../components/cards/EventCard';
import { SectionHeader } from '../components/common/SectionHeader';
import { ApiDiagnosticReport } from '../services/api/diagnostics';
import { ApiError } from '../services/api/config';
import { setPageMeta } from '../utils/seo';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Ticket,
  Sparkles,
  Info,
  Building,
  Navigation,
} from 'lucide-react';

export const EventDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('O evento solicitado não foi encontrado.');
  const [diagnostic, setDiagnostic] = useState<ApiDiagnosticReport | undefined>();

  const loadEvent = (eventSlug: string) => {
    setIsLoading(true);
    setHasError(false);
    setDiagnostic(undefined);

    eventsApi
      .getBySlug(eventSlug)
      .then((data) => {
        if (!data) {
          setHasError(true);
          setErrorMessage('Evento não encontrado na agenda do Kariri.app (404).');
          return;
        }
        setEvent(data);
        setPageMeta({
          title: `${data.title} - ${data.city_name}`,
          description: data.description.slice(0, 150),
          image: data.cover_image,
        });

        // Carrega outros eventos recomendados
        eventsApi
          .getAll()
          .then((all) => {
            const others = all.filter((e) => e.slug !== eventSlug).slice(0, 3);
            setRelatedEvents(others);
          })
          .catch(() => {});
      })
      .catch((err: unknown) => {
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
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!slug) return;
    loadEvent(slug);
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
          title="Evento não encontrado"
          message={errorMessage}
          diagnostic={diagnostic}
          onRetry={() => {
            if (slug) {
              loadEvent(slug);
            } else {
              navigate('/explorar');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Header controls */}
      <div className="flex items-center justify-between">
        <BackButton fallbackTo="/explorar" />

        <div className="flex items-center gap-2">
          <FavoriteButton eventId={event.id} size="md" />
          <ShareButton
            title={event.title}
            text={`${event.title} em ${event.city_name} - ${event.display_date}`}
            size="md"
          />
        </div>
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
              <p className="text-gray-600 mt-0.5">
                {event.start_time} {event.end_time ? `às ${event.end_time}` : ''}
              </p>
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

        {/* Organizer */}
        {event.organizer && (
          <div className="p-3.5 bg-gray-50 rounded-2xl flex items-center gap-3 text-xs">
            <div className="w-9 h-9 rounded-xl bg-gray-200/80 flex items-center justify-center shrink-0 text-gray-700">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Organização & Realização
              </span>
              <p className="font-bold text-gray-900 mt-0.5">{event.organizer}</p>
            </div>
          </div>
        )}

        {/* Location Row */}
        <div className="p-4 bg-gray-50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#D9262E] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900">{event.place_name}</p>
              <p className="text-gray-600 text-xs sm:text-sm mt-0.5">{event.address}</p>
              <span className="inline-block mt-1 text-xs font-semibold text-[#D9262E]">
                {event.city_name}, Cariri Cearense
              </span>
            </div>
          </div>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${event.place_name}, ${event.address}, ${event.city_name}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-gray-800 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 transition shrink-0"
          >
            <Navigation className="w-3.5 h-3.5 text-[#D9262E]" />
            <span>Ver no Mapa</span>
          </a>
        </div>

        {/* Ticket CTA - Visualmente identificado como link externo, sem checkout no MVP */}
        {event.ticket_url ? (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-[#D9262E]" />
                Ingressos & Inscrições
              </span>
              <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                Link Externo
              </span>
            </div>

            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-[#D9262E] hover:bg-[#BF1E25] active:scale-98 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Ticket className="w-4 h-4" />
              <span>Garantir Ingresso no Site Oficial</span>
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>

            <p className="text-[11px] text-gray-400 text-center leading-tight">
              Você será direcionado para a plataforma oficial do organizador. O Kariri.app não realiza cobrança direta.
            </p>
          </div>
        ) : event.is_free ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200/60 rounded-2xl flex items-center gap-2 text-xs text-emerald-800">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Evento com entrada franca por ordem de chegada no local. Não é necessário ingresso antecipado.</span>
          </div>
        ) : null}
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

      {/* 5. Related Events */}
      {relatedEvents.length > 0 && (
        <div className="space-y-3 pt-2">
          <SectionHeader
            title="Outros Eventos no Cariri"
            subtitle="Mais atrações na agenda cultural"
            actionText="Ver agenda completa"
            actionTo="/explorar"
            className="px-0"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedEvents.map((relEvent) => (
              <EventCard key={relEvent.id} event={relEvent} variant="standard" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
