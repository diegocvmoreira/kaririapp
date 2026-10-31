import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { placesApi } from '../services/api/places';
import { categoriesApi } from '../services/api/categories';
import { Category, Place } from '../types';
import { setPageMeta } from '../utils/seo';
import { OpeningHoursEditor } from '../components/admin/OpeningHoursEditor';
import { CoordinateSelector } from '../components/common/CoordinateSelector';
import { PhotoUploadSection } from '../components/common/PhotoUploadSection';
import { PlacePhotoPlaceholder } from '../components/common/PlacePhotoPlaceholder';
import {
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Phone,
  Clock,
  Camera,
  FileCheck,
  Building,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Navigation,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Essencial', icon: Building, desc: 'Dados básicos do local' },
  { id: 2, title: 'Onde fica', icon: MapPin, desc: 'Endereço e localização' },
  { id: 3, title: 'Contato & Horário', icon: Phone, desc: 'Canais e funcionamento' },
  { id: 4, title: 'Fotos', icon: Camera, desc: 'Capa e galeria' },
  { id: 5, title: 'Revisão', icon: FileCheck, desc: 'Conferir e enviar' },
];

export const CreatePlacePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { cities } = useCity();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);

  // 1. Essencial
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [cityId, setCityId] = useState<number>(1);
  const [categoryId, setCategoryId] = useState<number>(1);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [priceLevel, setPriceLevel] = useState<1 | 2 | 3 | 4>(2);

  // 2. Onde fica
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [coordSource, setCoordSource] = useState<string | null>(null);

  // 3. Contato e Horários
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [openingHours, setOpeningHours] = useState('Seg a Sáb: 08:00 - 18:00');

  // 4. Fotos
  const [coverImage, setCoverImage] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Estado de envio e feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdPlace, setCreatedPlace] = useState<Place | null>(null);

  useEffect(() => {
    setPageMeta({
      title: 'Sugerir Novo Local – Kariri.app',
      description: 'Cadastre e compartilhe um novo local no Cariri cearense. Sua sugestão passará por moderação.',
    });
    categoriesApi.getAll().then(setCategories).catch(() => {});
  }, []);

  const selectedCity = cities.find((c) => c.id === Number(cityId));
  const selectedCat = categories.find((c) => c.id === Number(categoryId));

  const handleNameChange = (val: string) => {
    setName(val);
    const generated = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(generated);
  };

  const handleCoordinateChange = (lat: number | null, lng: number | null, source?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setCoordSource(source || (lat && lng ? 'manual' : null));
  };

  const validateStep = (step: number): boolean => {
    setStepError(null);
    if (step === 1) {
      if (!name.trim()) {
        setStepError('Por favor, informe o nome do local antes de continuar.');
        return false;
      }
      if (name.trim().length < 3) {
        setStepError('O nome do local deve ter no mínimo 3 caracteres.');
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('O nome do local é obrigatório.');
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const isPublicUser = user?.role !== 'admin';
    const finalImages = Array.from(new Set([coverImage, ...galleryImages].filter(Boolean)));

    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent('/locais/novo')}`);
      return;
    }

    try {
      const created = await (isPublicUser ? placesApi.submitSuggestion : placesApi.create)({
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/\s+/g, '-'),
        city_id: Number(cityId),
        city_name: selectedCity?.name || 'Crato',
        city_slug: selectedCity?.slug || 'crato',
        category_id: Number(categoryId),
        category_name: selectedCat?.name || 'Gastronomia',
        category_slug: selectedCat?.slug || 'gastronomia',
        short_description: shortDescription.trim(),
        description: description.trim() || shortDescription.trim(),
        address: address.trim(),
        neighborhood: neighborhood.trim(),
        zipcode: zipcode.trim() || undefined,
        latitude: latitude !== null && !isNaN(latitude) ? Number(latitude) : null,
        longitude: longitude !== null && !isNaN(longitude) ? Number(longitude) : null,
        coordinate_source: coordSource,
        coordinate_confidence: coordSource === 'user_geolocation' ? 'high' : coordSource === 'city_center_approx' ? 'low' : undefined,
        needs_review: latitude === null || coordSource === 'city_center_approx',
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        website: website.trim() || undefined,
        instagram: instagram.trim() || undefined,
        opening_hours: openingHours.trim().slice(0, 255),
        price_level: priceLevel,
        status: isPublicUser ? 'pending' : 'published',
        is_featured: false,
        cover_image: coverImage.trim() || '',
        images: finalImages,
      });

      setCreatedPlace(created);
      setSuccess(true);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kariri:places_updated', { detail: created }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao enviar sugestão.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success && createdPlace) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-5 animate-in fade-in">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Sugestão enviada para moderação!</h1>
          <p className="text-sm text-gray-600 leading-relaxed max-w-lg mx-auto">
            O local <strong>{createdPlace.name}</strong> foi encaminhado para a nossa equipe editorial.
            Nossa curadoria revisará os dados e, assim que aprovado, ele será exibido publicamente para toda a comunidade do Cariri.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/explorar"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#DE1F2A] hover:bg-[#C51620] text-white font-bold text-xs sm:text-sm transition shadow-sm"
            >
              Explorar outros locais
            </Link>
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setCurrentStep(1);
                setName('');
                setShortDescription('');
                setDescription('');
                setAddress('');
                setNeighborhood('');
                setLatitude(null);
                setLongitude(null);
                setPhone('');
                setWhatsapp('');
                setCoverImage('');
                setGalleryImages([]);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs sm:text-sm transition"
            >
              Sugerir outro local
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
      {/* Botão de retorno e identificação */}
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

      {/* Stepper Visual no Topo */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
        {/* Barra de progresso */}
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-4">
          <div
            className="bg-[#DE1F2A] h-full transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* Indicadores de etapas */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {STEPS.map((s) => {
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

      {/* Conteúdo da Etapa Atual */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
        {/* ETAPA 1: ESSENCIAL */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-[#DE1F2A]" />
                <span>1. Dados Essenciais</span>
              </h2>
              <p className="text-xs text-gray-500">
                Identifique o estabelecimento ou atração que você deseja cadastrar no Kariri.app.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                  Nome do Local <span className="text-[#DE1F2A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Restaurante Sabor do Cariri"
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
                    Categoria <span className="text-[#DE1F2A]">*</span>
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

              <div>
                <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                  Chamada Curta (uma frase que define o local)
                </label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Ex: Culinária regional artesanal com vista panorâmica da Chapada"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                  Faixa de Preço
                </label>
                <select
                  value={priceLevel}
                  onChange={(e) => setPriceLevel(Number(e.target.value) as 1 | 2 | 3 | 4)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                >
                  <option value={1}>$ - Econômico / Popular</option>
                  <option value={2}>$$ - Acessível / Moderado</option>
                  <option value={3}>$$$ - Sofisticado</option>
                  <option value={4}>$$$$ - Premium / Alta Gastronomia</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                  Descrição Completa (opcional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Conte um pouco sobre a proposta, pratos ou serviços especiais, história ou diferencial..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 2: ONDE FICA */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#DE1F2A]" />
                <span>2. Onde fica</span>
              </h2>
              <p className="text-xs text-gray-500">
                Informe o endereço e a localização para que os visitantes consigam traçar rotas no mapa.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                    Endereço Completo
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
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ex: Centro, Pimenta, Lagoa Seca"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                  />
                </div>
              </div>

              {/* Seletor de Coordenadas com os 3 caminhos explícitos */}
              <CoordinateSelector
                latitude={latitude}
                longitude={longitude}
                onChange={handleCoordinateChange}
                cityName={selectedCity?.name || 'Crato'}
                cityLat={selectedCity?.latitude}
                cityLng={selectedCity?.longitude}
                address={`${address} ${neighborhood}`.trim()}
              />
            </div>
          </div>
        )}

        {/* ETAPA 3: CONTATO E HORÁRIO */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#DE1F2A]" />
                <span>3. Contato & Horários</span>
              </h2>
              <p className="text-xs text-gray-500">
                Facilite para que os clientes tirem dúvidas, façam reservas e confiram o horário de funcionamento.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                    WhatsApp Comercial
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(88) 99999-9999"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                    Instagram (@)
                  </label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@nomedolocal"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                    Telefone Fixo
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(88) 3531-0000"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                    Website Oficial (se houver)
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://exemplo.com.br"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1 text-xs sm:text-sm">
                  Horário de Funcionamento
                </label>
                <OpeningHoursEditor value={openingHours} onChange={setOpeningHours} />
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 4: FOTOS */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#DE1F2A]" />
                <span>4. Fotos do Local</span>
              </h2>
              <p className="text-xs text-gray-500">
                Envie fotos reais da fachada, pratos, ambiente ou produtos para enriquecer a página.
              </p>
            </div>

            <PhotoUploadSection
              coverImage={coverImage}
              onChangeCoverImage={setCoverImage}
              galleryImages={galleryImages}
              onChangeGalleryImages={setGalleryImages}
              categoryName={selectedCat?.name || 'Gastronomia'}
              categorySlug={selectedCat?.slug || 'gastronomia'}
              placeName={name}
              maxFiles={9}
            />
          </div>
        )}

        {/* ETAPA 5: REVISÃO E RESUMO */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#DE1F2A]" />
                <span>5. Revisão da Sugestão</span>
              </h2>
              <p className="text-xs text-gray-500">
                Confira os dados antes de submeter para a equipe de moderação do Kariri.app.
              </p>
            </div>

            {/* Card resumo */}
            <div className="p-5 rounded-3xl bg-gray-50 border border-gray-200 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-gray-200 border border-gray-300">
                  {coverImage ? (
                    <img src={coverImage} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <PlacePhotoPlaceholder
                      categoryName={selectedCat?.name}
                      categorySlug={selectedCat?.slug}
                      placeName={name}
                      size="thumb"
                      showBadge={false}
                    />
                  )}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDE8E9] text-[#DE1F2A]">
                      {selectedCat?.name || 'Categoria'}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      {selectedCity?.name || 'Cariri'}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-gray-900 truncate">
                    {name || 'Nome do Local'}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {shortDescription || 'Sem chamada curta informada.'}
                  </p>
                </div>
              </div>

              {/* Tabela de resumo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-200 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Endereço:</span>
                  <span className="font-semibold text-gray-800">
                    {address || 'Não informado'} {neighborhood ? `(${neighborhood})` : ''}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 block font-medium">Coordenadas GPS:</span>
                  <span className="font-semibold text-gray-800">
                    {latitude && longitude
                      ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)} (${coordSource === 'city_center_approx' ? 'Aproximação do município' : 'Definidas'})`
                      : 'Serão localizadas pela moderação'}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 block font-medium">Contato:</span>
                  <span className="font-semibold text-gray-800">
                    {whatsapp || phone || instagram || 'Nenhum contato informado'}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 block font-medium">Fotos anexadas:</span>
                  <span className="font-semibold text-gray-800">
                    {coverImage ? `${1 + galleryImages.filter((p) => p !== coverImage).length} foto(s)` : 'Nenhuma (usará ilustração temática)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Aviso explicativo de moderação */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Política Editorial e Moderação</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Para garantir a qualidade e confiabilidade do guia, todas as contribuições passam por uma verificação editorial antes da publicação. Você poderá acompanhar o status da sua contribuição pelo seu perfil.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botões de Ação na Área Desktop */}
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
                  <span>Enviar Sugestão para Revisão</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* CTA Fixo Inferior em Mobile (com padding de safe-area-inset-bottom) */}
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
            className="px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition active:scale-95"
          >
            Voltar
          </button>
        )}

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="flex-1 py-3 px-4 rounded-xl bg-[#DE1F2A] active:bg-[#C51620] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm active:scale-98"
          >
            <span>Continuar ({currentStep}/5)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-xl bg-[#DE1F2A] active:bg-[#C51620] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar para Revisão'}
          </button>
        )}
      </div>
    </div>
  );
};
