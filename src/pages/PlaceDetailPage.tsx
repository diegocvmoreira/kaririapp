import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Place, Review } from '../types';
import { placesApi } from '../services/api/places';
import { reviewsApi } from '../services/api/reviews';
import { useAuth } from '../context/AuthContext';
import { ImageGallery } from '../components/common/ImageGallery';
import { Rating } from '../components/common/Rating';
import { FavoriteButton } from '../components/common/FavoriteButton';
import { LocationBadge } from '../components/common/LocationBadge';
import { PriceBadge } from '../components/common/PriceBadge';
import { PlaceCard } from '../components/cards/PlaceCard';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { BackButton } from '../components/common/BackButton';
import { ShareButton } from '../components/common/ShareButton';
import { BusinessClaimModal } from '../components/common/BusinessClaimModal';
import { ApiDiagnosticReport } from '../services/api/diagnostics';
import { ApiError } from '../services/api/config';
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
} from 'lucide-react';

export const PlaceDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [place, setPlace] = useState<Place | null>(null);
  const [similarPlaces, setSimilarPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('O local solicitado não foi encontrado ou não está disponível.');
  const [diagnostic, setDiagnostic] = useState<ApiDiagnosticReport | undefined>();
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

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

        // Load similar places
        placesApi.getSimilar(data.id, data.category_slug).then(setSimilarPlaces).catch(() => {});
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
    !isNaN(place.latitude) &&
    !isNaN(place.longitude) &&
    Math.abs(place.latitude) > 0.001;

  const handleOpenGoogleMapsRoute = () => {
    if (!place) return;
    const url = hasCoordinates
      ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${place.name}, ${place.address || place.city_name || 'Cariri, CE'}`
        )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!place || !reviewComment.trim()) return;

    setIsSubmittingReview(true);
    setReviewError(null);
    try {
      const newRev = await reviewsApi.addReview(place.id, {
        place_id: place.id,
        user_id: user?.id || 1,
        user_name: user?.name || 'Explorador do Cariri',
        user_avatar: user?.avatar,
        rating: reviewRating,
        comment: reviewComment,
      });

      setPlace((prev) =>
        prev
          ? {
              ...prev,
              reviews_count: prev.reviews_count + 1,
              reviews: [newRev, ...(prev.reviews || [])],
            }
          : prev
      );
      setReviewComment('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Não foi possível publicar a avaliação no momento. Tente novamente mais tarde.';
      setReviewError(msg);
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
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6 pb-12 animate-in fade-in duration-300">
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
      <ImageGallery images={place.images} placeName={place.name} />

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
        </div>

        {/* Action Route Button */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={handleOpenGoogleMapsRoute}
            className="flex-1 py-3 px-4 bg-[#DE1F2A] hover:bg-[#C51620] active:scale-98 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Navigation2 className="w-4 h-4 fill-white" />
            <span>Como Chegar (Rota no Maps)</span>
          </button>

          {place.whatsapp && (
            <a
              href={`https://wa.me/${place.whatsapp}?text=${encodeURIComponent(`Olá! Encontrei o ${place.name} no Kariri.app.`)}`}
              target="_blank"
              rel="noopener noreferrer"
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
          {place.description}
        </p>

        {/* Tags */}
        {place.tags && place.tags.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-1.5">
            {place.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-xl"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
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
              <p className="text-gray-600 mt-0.5">{place.address}</p>
            </div>
          </div>

          {/* Horário */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50">
            <Clock className="w-4 h-4 text-[#DE1F2A] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-800">Horário de Funcionamento</p>
              <p className="text-gray-600 mt-0.5">{place.opening_hours || 'Não informado'}</p>
              {place.is_open_now && (
                <span className="inline-block mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  Aberto agora
                </span>
              )}
            </div>
          </div>

          {/* Telefone */}
          {place.phone && (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50">
              <Phone className="w-4 h-4 text-[#DE1F2A] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-800">Telefone</p>
                <a
                  href={`tel:${place.phone.replace(/\D/g, '')}`}
                  className="text-[#DE1F2A] font-semibold hover:underline mt-0.5 inline-block"
                >
                  {place.phone}
                </a>
              </div>
            </div>
          )}

          {/* Instagram */}
          {place.instagram && (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50">
              <Instagram className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-800">Instagram</p>
                <a
                  href={`https://instagram.com/${place.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 font-semibold hover:underline mt-0.5 inline-block"
                >
                  {place.instagram}
                </a>
              </div>
            </div>
          )}

          {/* Website */}
          {place.website && (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 sm:col-span-2">
              <Globe className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-bold text-gray-800">Website Oficial</p>
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-semibold hover:underline mt-0.5 truncate block"
                >
                  {place.website}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. Static Location Mini-Map Preview */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Localização Geográfica</h2>
          {hasCoordinates ? (
            <span className="text-xs text-gray-500">
              {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
            </span>
          ) : (
            <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Sem coordenadas GPS
            </span>
          )}
        </div>

        {hasCoordinates ? (
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
          <div className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-800">Endereço textual:</p>
              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#DE1F2A] shrink-0" />
                <span>{place.address || `${place.neighborhood ? place.neighborhood + ', ' : ''}${place.city_name}`}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenGoogleMapsRoute}
              className="px-3.5 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-gray-800 transition flex items-center gap-1.5 shrink-0"
            >
              <Navigation2 className="w-3.5 h-3.5" />
              <span>Buscar no Google Maps</span>
            </button>
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

        {/* Submit Review Form */}
        <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800">Deixe sua nota:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
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

          <textarea
            required
            rows={2}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Como foi sua experiência neste local?"
            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
          />

          {reviewError && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
              {reviewError}
            </div>
          )}

          <div className="flex items-center justify-between">
            {reviewSuccess ? (
              <span className="text-xs text-emerald-600 font-bold">
                Avaliação publicada com sucesso!
              </span>
            ) : (
              <span className="text-[11px] text-gray-400">
                {isAuthenticated ? `Publicando como ${user?.name}` : 'Publicando como visitante'}
              </span>
            )}

            <button
              type="submit"
              disabled={isSubmittingReview}
              className="px-4 py-2 bg-[#DE1F2A] hover:bg-[#C51620] active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingReview ? 'Enviando...' : 'Avaliar'}</span>
            </button>
          </div>
        </form>

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
    </div>
  );
};
