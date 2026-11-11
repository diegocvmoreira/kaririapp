import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { eventsApi } from '../services/api/events';
import { placesApi } from '../services/api/places';
import { categoriesApi } from '../services/api/categories';
import { Category, Place, EventItem } from '../types';
import { setPageMeta } from '../utils/seo';
import { ApiError } from '../services/api/config';
import { PhotoUploadSection } from '../components/common/PhotoUploadSection';
import { PlacePhotoPlaceholder } from '../components/common/PlacePhotoPlaceholder';
import { EmailVerificationBanner } from '../components/common/EmailVerificationBanner';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Ticket,
  Camera,
  FileCheck,
  Building,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

const EVENT_STEPS = [
  { id: 1, title: 'Essencial', icon: Calendar, desc: 'Título, cidade e local' },
  { id: 2, title: 'Data & Hora', icon: Clock, desc: 'Quando acontece' },
  { id: 3, title: 'Ingressos', icon: Ticket, desc: 'Valores e produtor' },
  { id: 4, title: 'Cartaz', icon: Camera, desc: 'Imagem de divulgação' },
  { id: 5, title: 'Revisão', icon: FileCheck, desc: 'Conferir e enviar' },
];

export const CreateEventPage: React.FC = () => {
  const { user, isAuthenticated, isEmailVerified } = useAuth();
  const { cities } = useCity();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  // 1. Essencial
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [cityId, setCityId] = useState<number>(1);
  const [categoryId, setCategoryId] = useState<number>(1);
  const [placeId, setPlaceId] = useState<number | ''>('');
  const [placeName, setPlaceName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  // 2. Data e Hora
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('');

  // 3. Ingressos e Produção
  const [isFree, setIsFree] = useState(true);
  const [isPriceOnRequest, setIsPriceOnRequest] = useState(false);
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [priceMin, setPriceMin] = useState<number | undefined>(undefined);
  const [priceMax, setPriceMax] = useState<number | undefined>(undefined);
  const [ticketUrl, setTicketUrl] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [recurrence, setRecurrence] = useState<string>('Único');
  const [ageRating, setAgeRating] = useState<'Livre' | '10+' | '12+' | '14+' | '16+' | '18+'>('Livre');
  const [accessibilityInfo, setAccessibilityInfo] = useState<string[]>(['Acesso para cadeirantes', 'Banheiro adaptado']);
  const [safetyInfo, setSafetyInfo] = useState<string[]>(['Segurança no local']);

  // 4. Cartaz / Imagem
  const [coverImage, setCoverImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Submissão e validação
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    setPageMeta({
      title: 'Cadastrar Evento Cultural – Kariri.app',
      description: 'Divulgue shows, festividades, exposições e feiras no Cariri cearense.',
    });
    categoriesApi.getAll().then(setCategories).catch(() => {});
    placesApi.getAll().then(setPlaces).catch(() => {});
  }, []);

  const selectedCity = cities.find((c) => c.id === Number(cityId));
  const selectedCat = categories.find((c) => c.id === Number(categoryId));
  const selectedPlace = placeId ? places.find((p) => p.id === Number(placeId)) : null;

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generated = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(generated);
  };

  const handlePlaceSelect = (idStr: string) => {
    if (!idStr) {
      setPlaceId('');
      return;
    }
    const idNum = Number(idStr);
    setPlaceId(idNum);
    const foundPlace = places.find((p) => p.id === idNum);
    if (foundPlace) {
      setPlaceName(foundPlace.name);
      if (!address) setAddress(foundPlace.address);
      if (foundPlace.city_id) setCityId(foundPlace.city_id);
    }
  };

  const validateStep = (step: number): boolean => {
    setStepError(null);
    if (step === 1) {
      if (!title.trim()) {
        setStepError('O título do evento é obrigatório.');
        return false;
      }
      if (title.trim().length < 3) {
        setStepError('O título do evento deve ter no mínimo 3 caracteres.');
        return false;
      }
    }
    if (step === 2) {
      if (!startDate) {
        setStepError('Por favor, informe a data de início do evento.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setStepError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Rolagem suave automática até o campo ativo no mobile (compatibilidade com teclado virtual Android/iOS)
  const handleInputFocus = (e: React.FocusEvent<HTMLElement>) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
      setTimeout(() => {
        (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 280);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isUploadingImages) {
      setErrorMessage('Aguarde a conclusão do envio das imagens antes de submeter.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('O título do evento é obrigatório.');
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const isPublicUser = user?.role !== 'admin';

    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent('/eventos/novo')}`);
      return;
    }

    if (!isEmailVerified && isPublicUser) {
      setErrorMessage(`É necessário confirmar seu endereço de e-mail (${user?.email || ''}) antes de submeter novos eventos. Verifique sua caixa de entrada.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const created = await (isPublicUser ? eventsApi.submitContribution : eventsApi.create)({
        title: title.trim(),
        slug: slug.trim() || title.toLowerCase().replace(/\s+/g, '-'),
        city_id: Number(cityId),
        city_name: selectedCity?.name || 'Crato',
        city_slug: selectedCity?.slug || 'crato',
        category_id: Number(categoryId),
        category: selectedCat?.name || 'Cultura & Arte',
        place_id: placeId !== '' ? Number(placeId) : null,
        place_name: selectedPlace?.name || placeName.trim() || 'Espaço no Cariri',
        address: address.trim() || selectedPlace?.address || '',
        start_date: startDate,
        end_date: endDate || undefined,
        display_date: startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'A definir',
        start_time: startTime,
        end_time: endTime || undefined,
        is_free: isFree,
        price: isFree ? 0 : price,
        price_min: priceMin,
        price_max: priceMax,
        is_price_on_request: isPriceOnRequest,
        price_text: isFree
          ? 'Gratuito'
          : isPriceOnRequest
          ? 'A consultar'
          : priceMin && priceMax
          ? `R$ ${priceMin} a R$ ${priceMax}`
          : price
          ? `R$ ${price.toFixed(2)}`
          : 'A consultar',
        ticket_url: ticketUrl.trim() || undefined,
        organizer: organizer.trim(),
        age_rating: ageRating,
        recurrence: recurrence,
        accessibility_info: accessibilityInfo,
        safety_info: safetyInfo,
        description: description.trim(),
        cover_image: coverImage.trim() || '',
        status: isPublicUser ? 'pending' : 'published',
        is_featured: false,
      });

      setCreatedEvent(created);
      setSuccess(true);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kariri:events_updated', { detail: created }));
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 403) {
        setErrorMessage('Acesso restrito: É necessário confirmar seu endereço de e-mail para cadastrar eventos.');
      } else {
        const msg = err instanceof Error ? err.message : 'Falha ao cadastrar evento.';
        setErrorMessage(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success && createdEvent) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-5 animate-in fade-in">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Evento enviado para moderação!</h1>
          <p className="text-sm text-gray-600 leading-relaxed max-w-lg mx-auto">
            O evento <strong>{createdEvent.title}</strong> foi encaminhado para nossa equipe.
            Em breve ele estará na agenda cultural do Kariri.app.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/explorar"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#DE1F2A] hover:bg-[#C51620] text-white font-bold text-xs sm:text-sm transition shadow-sm"
            >
              Ver agenda cultural
            </Link>
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setCurrentStep(1);
                setTitle('');
                setDescription('');
                setStartDate('');
                setCoverImage('');
                setGalleryImages([]);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs sm:text-sm transition"
            >
              Cadastrar outro evento
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
      {/* Botão de retorno */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => (currentStep > 1 ? handlePrevStep() : navigate(-1))}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentStep > 1 ? 'Etapa anterior' : 'Voltar'}</span>
        </button>

        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Etapa {currentStep} de 5
        </span>
      </div>

      {/* Stepper Visual */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-4">
          <div
            className="bg-[#DE1F2A] h-full transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {EVENT_STEPS.map((s) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (s.id < currentStep || validateStep(currentStep)) {
                    setCurrentStep(s.id);
                  }
                }}
                className={`flex flex-col items-center text-center p-1.5 rounded-xl transition ${
                  isCurrent
                    ? 'text-[#DE1F2A] font-bold'
                    : isCompleted
                    ? 'text-gray-700 hover:text-black font-semibold'
                    : 'text-gray-400 opacity-60 pointer-events-none'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs mb-1 transition ${
                    isCurrent
                      ? 'bg-[#DE1F2A] text-white shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[11px] truncate max-w-full hidden sm:inline">
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <EmailVerificationBanner
        actionLabel="divulgar novos eventos no Kariri.app"
        variant="card"
      />

      {stepError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{stepError}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      {/* Conteúdo da Etapa */}
      <div
        className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6"
        onFocusCapture={handleInputFocus}
      >
        {/* ETAPA 1: DADOS PRINCIPAIS DO EVENTO */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#DE1F2A]" />
                <span>1. Dados do Evento</span>
              </h2>
              <p className="text-xs text-gray-500">
                Divulgue shows, feiras, festivais, congressos e oficinas no Cariri.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                  Nome / Título do Evento <span className="text-[#DE1F2A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ex: Festival Expocrato 2026"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                    Município <span className="text-[#DE1F2A]">*</span>
                  </label>
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(Number(e.target.value))}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                  >
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                    Categoria Cultural <span className="text-[#DE1F2A]">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                    Espaço / Estabelecimento Parceiro
                  </label>
                  <select
                    value={placeId}
                    onChange={(e) => handlePlaceSelect(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                  >
                    <option value="">Outro local não listado...</option>
                    {places.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.city_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                    Nome do Espaço (se não listado)
                  </label>
                  <input
                    type="text"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    placeholder="Ex: Parque de Exposições Pedro Felício"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                  Endereço do Evento
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número ou ponto de referência"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                  Descrição do Evento
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Atrações musicais, programação, classificação etária e detalhes..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 2: DATA E HORA */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#DE1F2A]" />
                <span>2. Data e Horário</span>
              </h2>
              <p className="text-xs text-gray-500">
                Informe quando o evento terá início e término para o calendário do guia.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                    Data de Início <span className="text-[#DE1F2A]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                    Data de Término (se for festival/temporada)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                    Horário de Início
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                    Horário Previsto de Término (opcional)
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                  Recorrência do Evento
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                >
                  <option value="Único">Evento único (apenas nesta data)</option>
                  <option value="Semanal">Semanal (acontece toda semana)</option>
                  <option value="Mensal">Mensal (acontece mensalmente)</option>
                  <option value="Anual">Anual (festividade tradicional no Cariri)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 3: INGRESSOS E ORGANIZAÇÃO */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#DE1F2A]" />
                <span>3. Ingressos & Organização</span>
              </h2>
              <p className="text-xs text-gray-500">
                Especifique valores de entrada, classificação e links para compra antecipada.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="event-is-free"
                    checked={isFree}
                    onChange={(e) => {
                      setIsFree(e.target.checked);
                      if (e.target.checked) setIsPriceOnRequest(false);
                    }}
                    className="w-4 h-4 text-[#DE1F2A] rounded border-gray-300 focus:ring-[#DE1F2A]"
                  />
                  <label htmlFor="event-is-free" className="font-bold text-gray-800 text-xs sm:text-sm cursor-pointer select-none">
                    Entrada Franca / Gratuito
                  </label>
                </div>

                {!isFree && (
                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="event-price-request"
                      checked={isPriceOnRequest}
                      onChange={(e) => setIsPriceOnRequest(e.target.checked)}
                      className="w-4 h-4 text-[#DE1F2A] rounded border-gray-300 focus:ring-[#DE1F2A]"
                    />
                    <label htmlFor="event-price-request" className="font-bold text-gray-800 text-xs sm:text-sm cursor-pointer select-none">
                      Valor sob consulta / A consultar
                    </label>
                  </div>
                )}
              </div>

              {!isFree && !isPriceOnRequest && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                      Preço Mínimo / Ingresso (R$)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={price ?? ''}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : undefined;
                        setPrice(val);
                        setPriceMin(val);
                      }}
                      placeholder="Ex: 20.00"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                      Preço Máximo (opcional) (R$)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={priceMax ?? ''}
                      onChange={(e) => setPriceMax(e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Ex: 60.00"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                    Classificação Indicativa
                  </label>
                  <select
                    value={ageRating}
                    onChange={(e) => setAgeRating(e.target.value as typeof ageRating)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                  >
                    <option value="Livre">Livre para todos os públicos</option>
                    <option value="10+">10+ (Não recomendado para menores de 10 anos)</option>
                    <option value="12+">12+ (Não recomendado para menores de 12 anos)</option>
                    <option value="14+">14+ (Não recomendado para menores de 14 anos)</option>
                    <option value="16+">16+ (Não recomendado para menores de 16 anos)</option>
                    <option value="18+">18+ (Exclusivo para maiores de 18 anos)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                    Organizador / Produtora
                  </label>
                  <input
                    type="text"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    placeholder="Ex: Secretaria de Cultura / Coletivo Cultural"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                  Link de Ingressos (Sympla, Bilheteria Virtual, etc.)
                </label>
                <input
                  type="url"
                  value={ticketUrl}
                  onChange={(e) => setTicketUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 4: CARTAZ / IMAGEM */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#DE1F2A]" />
                <span>4. Cartaz ou Imagem de Divulgação</span>
              </h2>
              <p className="text-xs text-gray-500">
                Envie o cartaz oficial, fotografia das atrações ou flyer do evento.
              </p>
            </div>

            <PhotoUploadSection
              coverImage={coverImage}
              onChangeCoverImage={setCoverImage}
              galleryImages={galleryImages}
              onChangeGalleryImages={setGalleryImages}
              categoryName={selectedCat?.name || 'Cultura & Arte'}
              categorySlug={selectedCat?.slug || 'cultura'}
              placeName={title}
              maxFiles={4}
              label="Cartaz do Evento"
              description="Envie o cartaz oficial ou foto promocional."
              onUploadingChange={setIsUploadingImages}
            />
          </div>
        )}

        {/* ETAPA 5: REVISÃO E CONFIRMAÇÃO */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#DE1F2A]" />
                <span>5. Revisão do Evento</span>
              </h2>
              <p className="text-xs text-gray-500">
                Confira os dados antes do envio para a curadoria do Kariri.app.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-gray-50 border border-gray-200 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-gray-200 border border-gray-300">
                  {coverImage ? (
                    <img src={coverImage} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <PlacePhotoPlaceholder
                      categoryName={selectedCat?.name}
                      categorySlug={selectedCat?.slug}
                      placeName={title}
                      size="thumb"
                      showBadge={false}
                    />
                  )}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DE1F2A] text-white">
                    {selectedCat?.name || 'Cultura'}
                  </span>
                  <h3 className="text-base font-black text-gray-900 truncate">
                    {title || 'Título do Evento'}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-1">
                    {startDate ? `Inicia em ${new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')} às ${startTime}` : 'Data a definir'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-200 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Local:</span>
                  <span className="font-semibold text-gray-800">
                    {selectedPlace?.name || placeName || 'A confirmar'} ({selectedCity?.name})
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 block font-medium">Entrada:</span>
                  <span className="font-semibold text-gray-800">
                    {isFree ? 'Gratuita' : price ? `R$ ${price.toFixed(2)}` : 'A consultar'}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 block font-medium">Organização:</span>
                  <span className="font-semibold text-gray-800">
                    {organizer || 'Não informada'}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 block font-medium">Cartaz:</span>
                  <span className="font-semibold text-gray-800">
                    {coverImage ? 'Imagem anexada' : 'Sem cartaz (usará ilustração cultural)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Toda sugestão de evento é revisada para assegurar dados precisos sobre horário, localização e segurança dos frequentadores.
              </p>
            </div>
          </div>
        )}

        {/* Ações Desktop */}
        <div className="hidden md:flex items-center justify-between pt-4 border-t border-gray-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition"
            >
              Voltar
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-xl bg-[#DE1F2A] hover:bg-[#C51620] text-white font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="px-7 py-3 rounded-xl bg-[#DE1F2A] hover:bg-[#C51620] text-white font-bold transition shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Enviando para Moderação...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cadastrar Evento para Revisão</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* CTA Fixo Mobile */}
      <div
        style={{
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        }}
        className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200/90 p-3 z-40 flex items-center gap-3 shadow-lg"
      >
        {currentStep > 1 && (
          <button
            type="button"
            onClick={handlePrevStep}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition active:scale-95"
          >
            Voltar
          </button>
        )}

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-[#DE1F2A] active:bg-[#C51620] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm active:scale-98"
          >
            <span>Continuar ({currentStep}/5)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-[#DE1F2A] active:bg-[#C51620] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar para Revisão'}
          </button>
        )}
      </div>
    </div>
  );
};
