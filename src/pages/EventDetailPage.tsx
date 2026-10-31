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
import { analytics } from '../services/analyticsService';
import { setPageMeta } from '../utils/seo';
import { PlacePhotoPlaceholder } from '../components/common/PlacePhotoPlaceholder';
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
  CalendarPlus,
  Download,
  ShieldCheck,
  Accessibility,
  AlertTriangle,
  Repeat,
  CheckCircle2,
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
  const [imgError, setImgError] = useState(false);
  const [isCalendarMenuOpen, setIsCalendarMenuOpen] = useState(false);

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

        // Dispara evento event_view sem PII
        analytics.track('event_view', {
          event_id: data.id,
          event_slug: data.slug,
          event_title: data.title,
          city_slug: data.city_slug,
          is_free: data.is_free,
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

  // Extrai nome do domínio para prévia transparente do link de compra
  const getDomainName = (rawUrl?: string): string => {
    if (!rawUrl) return '';
    try {
      const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return 'site oficial';
    }
  };

  // Classificação indicativa oficial brasileira
  const renderAgeRating = (rating?: string) => {
    const r = rating || event?.age_rating || 'Livre';
    const map: Record<string, { bg: string; text: string; label: string; desc: string }> = {
      Livre: { bg: 'bg-emerald-600', text: 'text-white', label: 'L', desc: 'Classificação Livre' },
      '10+': { bg: 'bg-blue-600', text: 'text-white', label: '10', desc: 'Não recomendado para menores de 10 anos' },
      '12+': { bg: 'bg-amber-500', text: 'text-white', label: '12', desc: 'Não recomendado para menores de 12 anos' },
      '14+': { bg: 'bg-orange-600', text: 'text-white', label: '14', desc: 'Não recomendado para menores de 14 anos' },
      '16+': { bg: 'bg-red-600', text: 'text-white', label: '16', desc: 'Não recomendado para menores de 16 anos' },
      '18+': { bg: 'bg-black', text: 'text-white', label: '18', desc: 'Não recomendado para menores de 18 anos' },
    };
    const current = map[r] || map['Livre'];
    return (
      <span
        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold text-xs ${current.bg} ${current.text}`}
        title={current.desc}
      >
        {current.label}
      </span>
    );
  };

  // Status visual do evento (confirmado, adiado, cancelado, encerrado)
  const renderEventStatus = () => {
    const status = event?.event_status || 'confirmed';
    if (status === 'postponed') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Evento Adiado</span>
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Evento Cancelado</span>
        </span>
      );
    }
    if (status === 'ended') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-500 text-white shadow-xs">
          <span>Evento Encerrado</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Confirmado</span>
      </span>
    );
  };

  // Função para adicionar à agenda (Google Calendar e download iCal .ics)
  const handleAddToCalendar = (type: 'google' | 'ics') => {
    if (!event) return;
    setIsCalendarMenuOpen(false);

    const startClean = (event.start_date || '2026-11-01').replace(/-/g, '');
    const startTimeClean = (event.start_time || '19:00').replace(':', '') + '00';
    const startIso = `${startClean}T${startTimeClean}`;

    const endClean = (event.end_date || event.start_date || '2026-11-01').replace(/-/g, '');
    const endTimeClean = (event.end_time || '23:00').replace(':', '') + '00';
    const endIso = `${endClean}T${endTimeClean}`;

    analytics.track('add_to_calendar', {
      event_id: event.id,
      event_slug: event.slug,
      type,
    });

    if (type === 'google') {
      const gUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        event.title
      )}&dates=${startIso}/${endIso}&details=${encodeURIComponent(
        `${event.description}\n\nIngressos: ${event.price_text}\nMais no Kariri.app: https://kariri.app.br/eventos/${event.slug}`
      )}&location=${encodeURIComponent(`${event.place_name}, ${event.address}, ${event.city_name}`)}`;
      window.open(gUrl, '_blank', 'noopener,noreferrer');
    } else {
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Kariri.app//Agenda Cultural//PT-BR',
        'BEGIN:VEVENT',
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
        `LOCATION:${event.place_name}, ${event.address}, ${event.city_name}`,
        `DTSTART:${startIso}`,
        `DTEND:${endIso}`,
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.slug || 'evento'}-kaririapp.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

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

  const ticketDomain = getDomainName(event.ticket_url);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6 pb-28 md:pb-12 animate-in fade-in duration-300">
      {/* 1. Header controls */}
      <div className="flex items-center justify-between">
        <BackButton fallbackTo="/explorar?tab=events" />

        <div className="flex items-center gap-2">
          {/* Menu Adicionar à Agenda */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCalendarMenuOpen(!isCalendarMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-gray-700 hover:text-gray-900 border border-gray-200 rounded-xl text-xs font-bold transition active:scale-95 shadow-2xs focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none min-h-[44px]"
              aria-label="Adicionar à agenda"
              aria-expanded={isCalendarMenuOpen}
            >
              <CalendarPlus className="w-4 h-4 text-[#DE1F2A]" />
              <span className="hidden sm:inline">Adicionar à Agenda</span>
            </button>

            {isCalendarMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => handleAddToCalendar('google')}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:text-[#DE1F2A] hover:bg-gray-50 flex items-center gap-2 transition"
                >
                  <Calendar className="w-4 h-4 text-[#DE1F2A]" />
                  <span>Google Calendar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddToCalendar('ics')}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:text-[#DE1F2A] hover:bg-gray-50 flex items-center gap-2 transition border-t border-gray-50"
                >
                  <Download className="w-4 h-4 text-[#DE1F2A]" />
                  <span>Baixar arquivo .ICS (Apple/Outlook)</span>
                </button>
              </div>
            )}
          </div>

          <FavoriteButton eventId={event.id} size="md" className="min-h-[44px] min-w-[44px]" />
          <ShareButton
            title={event.title}
            text={`${event.title} em ${event.city_name} - ${event.display_date}`}
            size="md"
          />
        </div>
      </div>

      {/* 2. Cover Banner */}
      <div className="relative w-full h-72 sm:h-96 rounded-3xl overflow-hidden shadow-md bg-gray-900">
        {event.cover_image && !imgError ? (
          <img
            src={event.cover_image}
            alt={event.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0">
            <PlacePhotoPlaceholder
              categoryName={event.category}
              placeName={event.title}
              size="banner"
              showBadge={false}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/15" />

        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
          {renderEventStatus()}
          {event.is_free && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs">
              Entrada Franca
            </span>
          )}
          {renderAgeRating()}
        </div>

        <div className="absolute bottom-4 inset-x-4 text-white">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
            <span>{event.category}</span>
            {event.recurrence && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1 text-white/80 lowercase">
                  <Repeat className="w-3 h-3 text-amber-300" />
                  {event.recurrence}
                </span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-white mt-1 leading-tight">
            {event.title}
          </h1>
        </div>
      </div>

      {/* 3. Main Info Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
          {/* Data ou Período */}
          <div className="p-3 bg-gray-50 rounded-2xl flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#DE1F2A] shrink-0" />
            <div>
              <p className="font-bold text-gray-900">
                {event.end_date && event.end_date !== event.start_date ? 'Período' : 'Data'}
              </p>
              <p className="text-gray-600 mt-0.5">{event.display_date}</p>
            </div>
          </div>

          {/* Horário */}
          <div className="p-3 bg-gray-50 rounded-2xl flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#DE1F2A] shrink-0" />
            <div>
              <p className="font-bold text-gray-900">Horário</p>
              <p className="text-gray-600 mt-0.5">
                {event.start_time} {event.end_time ? `às ${event.end_time}` : ''}
              </p>
            </div>
          </div>

          {/* Ingressos & Faixa de Preço */}
          <div className="p-3 bg-gray-50 rounded-2xl flex items-center gap-3">
            <Ticket className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-gray-900">Ingressos</p>
              <p className="text-gray-600 mt-0.5 font-medium">
                {event.is_free
                  ? 'Gratuito'
                  : event.is_price_on_request
                  ? 'A consultar'
                  : event.price_min && event.price_max
                  ? `R$ ${event.price_min} a R$ ${event.price_max}`
                  : event.price_text || 'Entrada Franca'}
              </p>
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
            <MapPin className="w-5 h-5 text-[#DE1F2A] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900">{event.place_name}</p>
              <p className="text-gray-600 text-xs sm:text-sm mt-0.5">{event.address}</p>
              <span className="inline-block mt-1 text-xs font-semibold text-[#DE1F2A]">
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
            onClick={() => {
              analytics.track('directions_click', {
                target_id: event.id,
                target_type: 'event',
                target_slug: event.slug,
                city_slug: event.city_slug,
              });
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-gray-800 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 transition shrink-0 min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none"
          >
            <Navigation className="w-3.5 h-3.5 text-[#DE1F2A]" />
            <span>Ver no Mapa</span>
          </a>
        </div>

        {/* Ticket CTA with transparent domain preview */}
        {event.ticket_url ? (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-[#DE1F2A]" />
                Ingressos & Inscrições
              </span>
              <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono border border-gray-200">
                {ticketDomain}
              </span>
            </div>

            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-[#DE1F2A] hover:bg-[#C51620] active:scale-98 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#DE1F2A] outline-none"
            >
              <Ticket className="w-4 h-4" />
              <span>Garantir Ingresso no {ticketDomain || 'Site Oficial'}</span>
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>

            <p className="text-[11px] text-gray-400 text-center leading-tight">
              Você será direcionado com segurança para a plataforma oficial do organizador ({ticketDomain}). O Kariri.app não cobra taxas adicionais.
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
          <Sparkles className="w-4 h-4 text-[#DE1F2A]" />
          <span>Sobre o Evento</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
          {event.description}
        </p>
      </div>

      {/* 5. Acessibilidade e Segurança */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#DE1F2A]" />
          <span>Acessibilidade & Informações Úteis</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-gray-50 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-gray-800">
              <Accessibility className="w-3.5 h-3.5 text-[#DE1F2A]" />
              <span>Acessibilidade</span>
            </div>
            <p className="text-gray-600">
              {event.accessibility_info && event.accessibility_info.length > 0
                ? event.accessibility_info.join(', ')
                : 'Local com acesso térreo adaptado para cadeirantes e pessoas com mobilidade reduzida.'}
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-gray-800">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Segurança e Apoio</span>
            </div>
            <p className="text-gray-600">
              {event.safety_info && event.safety_info.length > 0
                ? event.safety_info.join(', ')
                : 'Equipe de apoio e segurança presente no local durante todo o evento.'}
            </p>
          </div>
        </div>
      </div>

      {/* 6. Related Events */}
      {relatedEvents.length > 0 && (
        <div className="space-y-3 pt-2">
          <SectionHeader
            title="Outros Eventos no Cariri"
            subtitle="Mais atrações na agenda cultural"
            actionText="Ver agenda completa"
            actionTo="/explorar?tab=events"
            className="px-0"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedEvents.map((relEvent) => (
              <EventCard key={relEvent.id} event={relEvent} variant="standard" />
            ))}
          </div>
        </div>
      )}

      {/* Barra de Ações Persistente no Mobile */}
      <aside
        aria-label="Ações rápidas do evento"
        className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200/90 p-2.5 px-4 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-2.5"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
      >
        {event.ticket_url ? (
          <a
            href={event.ticket_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-h-[44px] py-2 px-3 bg-[#DE1F2A] hover:bg-[#C51620] active:scale-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none"
          >
            <Ticket className="w-4 h-4 shrink-0" />
            <span className="truncate">Garantir Ingresso</span>
          </a>
        ) : (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${event.place_name}, ${event.address}, ${event.city_name}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-h-[44px] py-2 px-3 bg-[#DE1F2A] hover:bg-[#C51620] active:scale-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none"
          >
            <Navigation className="w-4 h-4 shrink-0" />
            <span className="truncate">Ver no Mapa</span>
          </a>
        )}

        <button
          type="button"
          onClick={() => handleAddToCalendar('google')}
          className="min-h-[44px] px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0"
          title="Adicionar à agenda"
        >
          <CalendarPlus className="w-4 h-4 text-[#DE1F2A] shrink-0" />
          <span className="hidden xs:inline">Agenda</span>
        </button>

        <div className="shrink-0 flex items-center">
          <FavoriteButton eventId={event.id} size="md" className="min-h-[44px] min-w-[44px]" />
        </div>
      </aside>
    </div>
  );
};
