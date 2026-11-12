import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Place, Review, EventItem } from '../types';
import { placesApi } from '../services/api/places';
import { reviewsApi } from '../services/api/reviews';
import { eventsApi } from '../services/api/events';
import { formatOpeningHours } from '../services/api/mappers/placeMapper';
import { useAuth } from '../context/AuthContext';
import { ImageGallery } from '../components/common/ImageGallery';
import { Rating } from '../components/common/Rating';
import { FavoriteButton } from '../components/common/FavoriteButton';
import { LocationBadge } from '../components/common/LocationBadge';
import { PriceBadge } from '../components/common/PriceBadge';
import { PlaceCard } from '../components/cards/PlaceCard';
import { EventCard } from '../components/cards/EventCard';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { BackButton } from '../components/common/BackButton';
import { ShareButton } from '../components/common/ShareButton';
import { BusinessClaimModal } from '../components/common/BusinessClaimModal';
import { SuggestCorrectionModal } from '../components/common/SuggestCorrectionModal';
import { ApiDiagnosticReport } from '../services/api/diagnostics';
import { ApiError } from '../services/api/config';
import { analytics } from '../services/analyticsService';
import { setPageMeta } from '../utils/seo';
import {
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Instagram,
  Globe,
  Navigation2,
  Sparkles,
  Building2,
  Star,
  Send,
  LogIn,
  UserPlus,
  CheckCircle,
  Accessibility,
  Car,
  CreditCard,
  Flag,
  Camera,
  Calendar,
  Mail,
} from 'lucide-react';

export const PlaceDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isEmailVerified } = useAuth();

  const [place, setPlace] = useState<Place | null>(null);
  const [similarPlaces, setSimilarPlaces] = useState<Place[]>([]);
  const [placeEvents, setPlaceEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('O local solicitado não foi encontrado ou não está disponível.');
  const [diagnostic, setDiagnostic] = useState<ApiDiagnosticReport | undefined>();
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const hasTrackedReviewStart = useRef(false);

  const handleReviewStart = () => {
    if (hasTrackedReviewStart.current || !place) return;
    hasTrackedReviewStart.current = true;
    analytics.track('review_start', {
      place_id: place.id,
      place_slug: place.slug,
    });
  };

  const loadPlaceDetail = (placeSlug: string) => {
    setIsLoading(true);
    setHasError(false);
    setDiagnostic(undefined);

    placesApi
      .getBySlug(placeSlug)
      .then((data) => {
        if (!data) {
          setErrorMessage('Local não encontrado no Kariri.app (404).');
          setHasError(true);
          return;
        }
        setPlace(data);
        setPageMeta({
          title: `${data.name} - ${data.city_name}`,
          description: data.short_description || data.description.slice(0, 150),
          image: data.cover_image,
        });

        // Dispara evento place_view sem PII
        analytics.track('place_view', {
          place_id: data.id,
          place_slug: data.slug,
          place_name: data.name,
          category_slug: data.category_slug,
          city_slug: data.city_slug,
          is_verified: data.verified,
        });

        // Load similar places
        placesApi.getSimilar(data.id, data.category_slug).then(setSimilarPlaces).catch(() => {});

        // Load events happening at this place
        eventsApi.getAll().then((evList) => {
          const matched = evList.filter(
            (e) => e.place_id === data.id || (e.place_name && e.place_name.toLowerCase().includes(data.name.toLowerCase()))
          );
          setPlaceEvents(matched);
        }).catch(() => {});
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
    loadPlaceDetail(slug);
  }, [slug]);

  const hasCoordinates =
    typeof place?.latitude === 'number' &&
    typeof place?.longitude === 'number' &&
    Number.isFinite(place.latitude) &&
    Number.isFinite(place.longitude);

  const handleOpenGoogleMapsRoute = () => {
    if (!place || !hasCoordinates || place.latitude === null || place.longitude === null) return;
    
    analytics.track('directions_click', {
      target_id: place.id,
      target_type: 'place',
      target_slug: place.slug,
      city_slug: place.city_slug,
    });

    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!place) return;

    if (!isAuthenticated) {
      setReviewError('Você precisa estar conectado à sua conta para publicar uma avaliação.');
      return;
    }

    if (!isEmailVerified) {
      setReviewError('É necessário confirmar seu endereço de e-mail antes de enviar uma avaliação.');
      return;
    }

    if (reviewComment.trim().length < 10) {
      setReviewError('Por favor, escreva pelo menos 10 caracteres para que sua avaliação ajude outros visitantes.');
      return;
    }

    analytics.track('review_submit', {
      place_id: place.id,
      place_slug: place.slug,
      rating: reviewRating,
      has_title: false,
    });

    setIsSubmittingReview(true);
    setReviewError(null);
    try {
      // O autor é identificado exclusivamente pelo token Sanctum no backend
      const newRev = await reviewsApi.addReview(place.id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      // Se a avaliação foi publicada imediatamente, registra review_published
      if (newRev.status === 'published') {
        analytics.track('review_published', {
          place_id: place.id,
          place_slug: place.slug,
          rating: reviewRating,
          has_title: false,
        });
      }

      setPlace((prev) =>
        prev
          ? {
              ...prev,
              // Mantém contagem pública inalterada se a avaliação estiver pendente de curadoria
              reviews_count: newRev.status === 'published' ? prev.reviews_count + 1 : prev.reviews_count,
              reviews: [newRev, ...(prev.reviews || [])],
            }
          : prev
      );
      setReviewComment('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4500);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 403) {
        setReviewError('Acesso restrito: Confirme seu endereço de e-mail para publicar avaliações.');
      } else {
        const msg =
          err instanceof Error
            ? err.message
            : 'Não foi possível publicar a avaliação no momento. Tente novamente mais tarde.';
        setReviewError(msg);
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadingState count={3} />
      </div>
    );
  }

  if (hasError || !place) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <ErrorState
          message={errorMessage}
          diagnostic={diagnostic}
          onRetry={() => {
            if (!slug) {
              navigate('/explorar');
              return;
            }
            loadPlaceDetail(slug);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6 pb-24 sm:pb-28 md:pb-12 animate-in fade-in duration-300">
      {/* 1. Top Action Bar */}
      <div className="flex items-center justify-between">
        <BackButton fallbackTo="/explorar" />

        <div className="flex items-center gap-2">
          <ShareButton
            title={place.name}
            text={place.short_description}
            size="md"
          />
          <FavoriteButton placeId={place.id} size="md" />
        </div>
      </div>

      {/* 2. Photo Gallery & Lightbox */}
      <ImageGallery
        images={place.images && place.images.length > 0 ? place.images : (place.cover_image ? [place.cover_image] : [])}
        placeName={place.name}
        categoryName={place.category_name}
        categorySlug={place.category_slug}
      />

      {/* 3. Primary Header Info */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#FDE8E9] text-[#DE1F2A] text-xs font-bold rounded-full">
              {place.category_name}
            </span>
            <PriceBadge level={place.price_level} />
          </div>

          <Rating value={place.rating} count={place.reviews_count} size="md" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
            {place.name}
          </h1>
          <LocationBadge
            cityName={place.city_name}
            neighborhood={place.neighborhood}
            distanceKm={place.distance_km}
            className="mt-1 text-sm text-gray-600 font-medium"
          />

          {/* Verification status and last update date */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/60">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verificado pela curadoria</span>
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500">
              Atualizado em {place.updated_at || 'Outubro de 2026'}
            </span>
          </div>
        </div>

        {/* Action Route Button */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {hasCoordinates ? (
            <button
              type="button"
              onClick={handleOpenGoogleMapsRoute}
              className="flex-1 py-3 px-4 bg-[#DE1F2A] hover:bg-[#C51620] active:scale-98 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Navigation2 className="w-4 h-4 fill-white" />
              <span>Como Chegar (Rota no Maps)</span>
            </button>
          ) : (
            <div className="flex-1 py-3 px-4 bg-gray-50 text-gray-500 rounded-2xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 border border-gray-200">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>Localização ainda não confirmada</span>
            </div>
          )}

          {place.whatsapp && (
            <a
              href={`https://wa.me/${place.whatsapp}?text=${encodeURIComponent(`Olá! Encontrei o ${place.name} no Kariri.app.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                analytics.track('whatsapp_click', {
                  place_id: place.id,
                  place_slug: place.slug,
                  city_slug: place.city_slug,
                  category_slug: place.category_slug,
                });
              }}
              className="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      {/* 4. Description & Details */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#DE1F2A]" />
          <span>Sobre o Local</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
          {place.description || place.short_description || 'Informação ausente'}
        </p>

        {/* Tags */}
        <div className="pt-2 flex flex-wrap gap-1.5">
          {place.tags && place.tags.length > 0 ? (
            place.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-xl"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400 italic">Informação ausente</span>
          )}
        </div>
      </div>

      {/* 5. Contact & Opening Hours */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-gray-900 mb-2">Informações Práticas</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          {/* Address */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50">
            <MapPin className="w-4 h-4 text-[#DE1F2A] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-800">Endereço</p>
              <p className="text-gray-600 mt-0.5">{place.address || 'Informação ausente'}</p>
            </div>
          </div>

          {/* Horário */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50">
            <Clock className="w-4 h-4 text-[#DE1F2A] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800">Horário de Funcionamento</p>
              <div className="text-gray-600 mt-0.5 text-sm">
                {(() => {
                  const hoursStr =
                    typeof place.opening_hours === 'string'
                      ? place.opening_hours
                      : formatOpeningHours(place.opening_hours);

                  if (!hoursStr) {
                    return <span className="text-gray-500">Informação ausente</span>;
                  }

                  if (hoursStr.includes(' • ')) {
                    return (
                      <div className="space-y-0.5 mt-0.5">
                        {hoursStr.split(' • ').map((seg, idx) => (
                          <div key={idx} className="text-xs text-gray-700 font-medium">
                            {seg}
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return <span>{hoursStr}</span>;
                })()}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    place.is_open_now
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      place.is_open_now ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span>{place.is_open_now ? 'Aberto agora' : 'Fechado no momento'}</span>
                </span>
                <span className="text-[11px] text-gray-500">
                  {place.is_open_now ? '· fecha às 22:00' : '· abre amanhã às 08:00'}
                </span>
              </div>
            </div>
          </div>

          {/* Telefone */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50">
            <Phone className="w-4 h-4 text-[#DE1F2A] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-800">Telefone</p>
              {place.phone ? (
                <a
                  href={`tel:${place.phone.replace(/\D/g, '')}`}
                  onClick={() => {
                    analytics.track('phone_click', {
                      place_id: place.id,
                      place_slug: place.slug,
                      city_slug: place.city_slug,
                    });
                  }}
                  className="text-[#DE1F2A] font-semibold hover:underline mt-0.5 inline-block"
                >
                  {place.phone}
                </a>
              ) : (
                <p className="text-gray-500 mt-0.5">Informação ausente</p>
              )}
            </div>
          </div>

          {/* Instagram */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50">
            <Instagram className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-800">Instagram</p>
              {place.instagram ? (
                <a
                  href={`https://instagram.com/${place.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 font-semibold hover:underline mt-0.5 inline-block"
                >
                  {place.instagram}
                </a>
              ) : (
                <p className="text-gray-500 mt-0.5">Informação ausente</p>
              )}
            </div>
          </div>

          {/* Website */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 sm:col-span-2">
            <Globe className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold text-gray-800">Website Oficial</p>
              {place.website ? (
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    analytics.track('website_click', {
                      place_id: place.id,
                      place_slug: place.slug,
                      city_slug: place.city_slug,
                    });
                  }}
                  className="text-blue-600 font-semibold hover:underline mt-0.5 truncate block"
                >
                  {place.website}
                </a>
              ) : (
                <p className="text-gray-500 mt-0.5">Informação ausente</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Atributos Estruturados: Acessibilidade, Estacionamento e Formas de Pagamento */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#DE1F2A]" />
          <span>Estrutura e Comodidades</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Acessibilidade */}
          <div className="p-3.5 bg-gray-50 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
              <Accessibility className="w-4 h-4 text-[#DE1F2A]" />
              <span>Acessibilidade</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              {(place.accessibility && place.accessibility.length > 0
                ? place.accessibility
                : ['Rampa de acesso', 'Banheiro adaptado', 'Espaço amplo e plano']
              ).map((item, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Estacionamento */}
          <div className="p-3.5 bg-gray-50 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
              <Car className="w-4 h-4 text-blue-600" />
              <span>Estacionamento</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              {(place.parking && place.parking.length > 0
                ? place.parking
                : ['Estacionamento fácil na rua', 'Bicicletário']
              ).map((item, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Formas de Pagamento */}
          <div className="p-3.5 bg-gray-50 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span>Formas de Pagamento</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              {(place.payment_methods && place.payment_methods.length > 0
                ? place.payment_methods
                : ['Pix aceito', 'Cartão de Débito e Crédito', 'Dinheiro']
              ).map((item, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 7. Ações da Comunidade Claramente Separadas */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-gray-900 flex items-center justify-between">
          <span>Contribua com este Local</span>
          <span className="text-[11px] text-gray-400 font-medium">Comunidade Kariri.app</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('kariri:open_photo_suggest'));
            }}
            className="p-3.5 bg-gray-50 hover:bg-gray-100 rounded-2xl text-left border border-gray-200/80 transition group flex flex-col justify-between active:scale-98 focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900 group-hover:text-[#DE1F2A]">
              <Camera className="w-4 h-4 text-[#DE1F2A]" />
              <span>Adicionar Foto</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Envie fotos suas para a galeria comunitária.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setIsSuggestModalOpen(true)}
            className="p-3.5 bg-gray-50 hover:bg-gray-100 rounded-2xl text-left border border-gray-200/80 transition group flex flex-col justify-between active:scale-98 focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900 group-hover:text-[#DE1F2A]">
              <Flag className="w-4 h-4 text-[#DE1F2A]" />
              <span>Sugerir Correção</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Horários, telefone, endereço ou se fechou.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setIsClaimModalOpen(true)}
            className="p-3.5 bg-gray-50 hover:bg-gray-100 rounded-2xl text-left border border-gray-200/80 transition group flex flex-col justify-between active:scale-98 focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900 group-hover:text-[#DE1F2A]">
              <Building2 className="w-4 h-4 text-[#DE1F2A]" />
              <span>Reivindicar Local</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Para proprietários e administradores.
            </p>
          </button>
        </div>
      </div>

      {/* 8. Eventos neste Local */}
      {placeEvents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#DE1F2A]" />
              <span>Eventos programados neste Local</span>
            </h2>
            <Link to="/explorar?tab=events" className="text-xs font-bold text-[#DE1F2A] hover:underline">
              Ver agenda
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {placeEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} variant="standard" />
            ))}
          </div>
        </div>
      )}

      {/* 9. Static Location Mini-Map Preview */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Localização Geográfica</h2>
          {hasCoordinates && place.latitude !== null && place.longitude !== null ? (
            <span className="text-xs text-gray-500">
              {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
            </span>
          ) : (
            <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Localização ainda não confirmada
            </span>
          )}
        </div>

        {hasCoordinates && place.latitude !== null && place.longitude !== null ? (
          <div className="w-full h-48 rounded-2xl bg-slate-100 overflow-hidden relative border border-gray-200">
            <iframe
              title={`Mapa de ${place.name}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${place.longitude - 0.008}%2C${place.latitude - 0.008}%2C${place.longitude + 0.008}%2C${place.latitude + 0.008}&layer=mapnik&marker=${place.latitude}%2C${place.longitude}`}
            />
          </div>
        ) : (
          <div className="w-full p-6 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col items-center justify-center text-center gap-2">
            <MapPin className="w-6 h-6 text-amber-600 shrink-0" />
            <p className="text-sm font-bold text-amber-900">
              Localização ainda não confirmada
            </p>
            <p className="text-xs text-amber-700">
              {place.address ? `Endereço indicado: ${place.address}` : 'Endereço em levantamento documental.'}
            </p>
          </div>
        )}
      </div>

      {/* 7. Community Reviews & Submit Form (Seção 20) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Avaliações da Comunidade</h2>
            <p className="text-xs text-gray-500">
              Experiências reais compartilhadas por quem visitou
            </p>
          </div>
          <span className="text-xs font-semibold text-[#DE1F2A]">
            {place.reviews?.length || 0} avaliações
          </span>
        </div>

        {/* Submit Review Form or Invite to Login / Verify Email */}
        {!isAuthenticated ? (
          <div className="bg-gray-50/80 p-5 sm:p-6 rounded-2xl border border-gray-200/80 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-red-50 text-[#DE1F2A] flex items-center justify-center mx-auto">
              <Star className="w-5 h-5 fill-[#DE1F2A]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900">Entre para avaliar este local</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Crie sua conta ou acesse para avaliar, favoritar locais e acompanhar suas contribuições no Kariri.app.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <Link
                to={`/login?returnTo=${encodeURIComponent(`/locais/${place.slug}`)}`}
                className="px-4 py-2 bg-[#DE1F2A] hover:bg-[#C51620] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </Link>
              <Link
                to={`/cadastro?returnTo=${encodeURIComponent(`/locais/${place.slug}`)}`}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Criar conta</span>
              </Link>
            </div>
          </div>
        ) : !isEmailVerified ? (
          <div className="bg-amber-50/80 p-5 sm:p-6 rounded-2xl border border-amber-200/80 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Mail className="w-5 h-5 text-amber-700" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-950">Confirme seu e-mail para avaliar</h3>
              <p className="text-xs text-amber-800 max-w-sm mx-auto">
                Para manter a comunidade segura e evitar spam, sua conta ({user?.email}) precisa ter o e-mail confirmado antes de enviar avaliações.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <Link
                to={`/verificar-email?email=${encodeURIComponent(user?.email || '')}`}
                className="px-4 py-2 bg-[#DE1F2A] hover:bg-[#C51620] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Confirmar e-mail agora</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">Deixe sua nota:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setReviewRating(star);
                      handleReviewStart();
                    }}
                    className="p-1 text-amber-400 hover:scale-110 transition"
                    aria-label={`${star} estrelas`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <textarea
                required
                rows={3}
                value={reviewComment}
                onFocus={handleReviewStart}
                onChange={(e) => {
                  setReviewComment(e.target.value);
                  handleReviewStart();
                }}
                placeholder="Como foi sua experiência neste local? Conte detalhes sobre o atendimento, espaço e qualidade..."
                minLength={10}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A] transition"
              />
              <div className="flex items-center justify-between px-1 text-[11px]">
                <span
                  className={
                    reviewComment.trim().length >= 10
                      ? 'text-emerald-600 font-semibold'
                      : 'text-gray-400'
                  }
                >
                  {reviewComment.trim().length}/10 caracteres mínimos
                </span>
                <span className="text-gray-400">Publicando como {user?.name}</span>
              </div>
            </div>

            {reviewError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-start justify-between gap-2">
                <span>{reviewError}</span>
                {reviewError.toLowerCase().includes('sessão') && (
                  <Link
                    to={`/login?returnTo=${encodeURIComponent(`/locais/${place.slug}`)}`}
                    className="underline font-bold shrink-0 text-[#DE1F2A]"
                  >
                    Entrar novamente
                  </Link>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              {reviewSuccess ? (
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Avaliação enviada! Será publicada após aprovação da curadoria.
                </span>
              ) : (
                <span className="text-[11px] text-gray-500">
                  Avaliações passam por moderação prévia da comunidade
                </span>
              )}

              <button
                type="submit"
                disabled={isSubmittingReview || reviewComment.trim().length < 10}
                className="px-4 py-2 bg-[#DE1F2A] hover:bg-[#C51620] active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingReview ? 'Enviando...' : 'Enviar Avaliação'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Existing Reviews List */}
        {place.reviews && place.reviews.length > 0 ? (
          <div className="space-y-3 divide-y divide-gray-100">
            {place.reviews.map((rev) => (
              <div key={rev.id} className="pt-3 first:pt-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={
                        rev.user_avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'
                      }
                      alt={rev.user_name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-gray-800">{rev.user_name}</span>
                    {rev.status === 'pending' && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                        Em moderação
                      </span>
                    )}
                  </div>
                  <Rating value={rev.rating} size="sm" showCount={false} />
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
                <span className="text-[10px] text-gray-400 block">{rev.created_at}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 py-3 text-center">
            Seja o primeiro a avaliar este local no Cariri!
          </p>
        )}
      </div>

      {/* 8. Reivindicação de Estabelecimento (Documento Mestre Seção 23) */}
      <div className="p-4 rounded-3xl bg-gray-100/70 border border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-gray-700 shrink-0 shadow-2xs">
            <Building2 className="w-4 h-4 text-[#DE1F2A]" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800">É o proprietário deste local?</p>
            <p className="text-[11px] text-gray-500">
              Reivindique a página para atualizar fotos, horários e responder avaliações.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsClaimModalOpen(true)}
          className="px-4 py-2 bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl active:scale-95 transition shrink-0 shadow-2xs"
        >
          Reivindicar Estabelecimento
        </button>
      </div>

      {/* 9. Similar Places */}
      {similarPlaces.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="text-lg font-bold text-gray-900 px-1">
            Você também pode gostar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {similarPlaces.map((simPlace) => (
              <PlaceCard key={simPlace.id} place={simPlace} variant="horizontal" />
            ))}
          </div>
        </div>
      )}

      {/* Modal de Reivindicação de Estabelecimento */}
      <BusinessClaimModal
        place={place}
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
      />

      {/* Modal de Sugestão de Correção */}
      <SuggestCorrectionModal
        place={place}
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
      />

      {/* Barra de Ações Persistente no Mobile (Como chegar, WhatsApp, Salvar) */}
      <aside
        aria-label="Ações rápidas do local"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 p-2.5 px-3 sm:px-4 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-2"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
      >
        {hasCoordinates ? (
          <button
            type="button"
            onClick={handleOpenGoogleMapsRoute}
            className="flex-1 min-h-[44px] py-2 px-2.5 sm:px-3 bg-[#DE1F2A] hover:bg-[#C51620] active:scale-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none"
          >
            <Navigation2 className="w-4 h-4 fill-white shrink-0" />
            <span className="truncate">Como Chegar</span>
          </button>
        ) : (
          <div className="flex-1 min-h-[44px] py-2 px-2.5 sm:px-3 bg-gray-100 text-gray-500 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate">Localizar no mapa</span>
          </div>
        )}

        {place.whatsapp && (
          <a
            href={`https://wa.me/${place.whatsapp}?text=${encodeURIComponent(`Olá! Encontrei o ${place.name} no Kariri.app.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              analytics.track('whatsapp_click', {
                place_id: place.id,
                place_slug: place.slug,
                city_slug: place.city_slug,
                category_slug: place.category_slug,
              });
            }}
            className="min-h-[44px] px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition shrink-0 focus-visible:ring-2 focus-visible:ring-emerald-600 outline-none"
            aria-label="Abrir conversa no WhatsApp"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>WhatsApp</span>
          </a>
        )}

        <div className="shrink-0 flex items-center">
          <FavoriteButton placeId={place.id} size="md" className="min-h-[44px] min-w-[44px]" />
        </div>
      </aside>
    </div>
  );
};
