import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { placesApi } from '../services/api/places';
import { categoriesApi } from '../services/api/categories';
import { Category, Place } from '../types';
import { setPageMeta } from '../utils/seo';
import { OpeningHoursEditor } from '../components/admin/OpeningHoursEditor';
import { MapPin, Sparkles, CheckCircle2, ArrowLeft, Image as ImageIcon, Phone, Globe, Instagram, DollarSign, Clock } from 'lucide-react';

export const CreatePlacePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { cities } = useCity();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [cityId, setCityId] = useState<number>(1);
  const [categoryId, setCategoryId] = useState<number>(1);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [latitude, setLatitude] = useState<number>(-7.2341);
  const [longitude, setLongitude] = useState<number>(-39.4124);
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [openingHours, setOpeningHours] = useState('Seg a Sáb: 08:00 - 18:00');
  const [priceLevel, setPriceLevel] = useState<1 | 2 | 3 | 4>(2);
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80');

  // Visitante não autenticado (dados para contato da moderação)
  const [contributorName, setContributorName] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('O nome do local é obrigatório.');
      return;
    }

    const selectedCity = cities.find((c) => c.id === Number(cityId));
    const selectedCat = categories.find((c) => c.id === Number(categoryId));

    setIsSubmitting(true);
    setErrorMessage(null);

    const isPublicUser = user?.role !== 'admin';

    try {
      const created = await placesApi.create({
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
        latitude: Number(latitude),
        longitude: Number(longitude),
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        website: website.trim() || undefined,
        instagram: instagram.trim() || undefined,
        opening_hours: openingHours.trim().slice(0, 255),
        price_level: priceLevel,
        status: isPublicUser ? 'pending' : 'published',
        is_featured: false,
        cover_image: coverImage.trim() || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
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
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Sugestão enviada com sucesso!</h1>
          <p className="text-sm text-gray-600 leading-relaxed max-w-lg mx-auto">
            O local <strong>{createdPlace.name}</strong> foi encaminhado para a nossa fila de moderação.
            Nossa equipe verificará as informações e em breve ele estará disponível no catálogo público do Kariri.app.
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
                setName('');
                setShortDescription('');
                setDescription('');
                setAddress('');
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
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* Botão de retorno */}
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Colaboração Comunitária</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Sugerir Novo Local no Cariri
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
          Conhece um restaurante, ponto turístico, museu ou espaço cultural no Cariri cearense?
          Cadastre aqui para incluir no Kariri.app. Toda contribuição passa por moderação antes da publicação.
        </p>

        {!isAuthenticated && (
          <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-900 flex items-center justify-between gap-3">
            <span>Você está enviando como visitante. Deseja vincular ao seu perfil?</span>
            <Link to="/login" className="px-3 py-1 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition whitespace-nowrap">
              Entrar
            </Link>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6 text-xs sm:text-sm">
        {/* Identificação */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
            1. Dados Principais
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Nome do Local <span className="text-[#DE1F2A]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Restaurante Sabor do Cariri"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Cidade</label>
              <select
                value={cityId}
                onChange={(e) => setCityId(Number(e.target.value))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Faixa de Preço</label>
              <select
                value={priceLevel}
                onChange={(e) => setPriceLevel(Number(e.target.value) as 1 | 2 | 3 | 4)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              >
                <option value={1}>$ - Econômico</option>
                <option value={2}>$$ - Acessível / Moderado</option>
                <option value={3}>$$$ - Sofisticado</option>
                <option value={4}>$$$$ - Premium / Alta Gastronomia</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Breve Resumo (chamada)</label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Ex: Culinária regional com vista privilegiada da Chapada do Araripe"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Descrição Completa</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre a história do local, especialidades, estacionamento, acessibilidade..."
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
            />
          </div>
        </div>

        {/* Localização */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
            2. Localização & Endereço
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Endereço Completo</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, ponto de referência"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Bairro</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Ex: Centro, Pimenta, Triângulo"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
          </div>
        </div>

        {/* Contato & Redes */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
            3. Contato & Horários
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">WhatsApp</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(88) 99999-9999"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Instagram (@)</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@nomedolocal"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Horário de Funcionamento</label>
            <OpeningHoursEditor value={openingHours} onChange={setOpeningHours} />
          </div>
        </div>

        {/* Imagem */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
            4. Imagem de Capa (URL)
          </h2>
          <input
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://exemplo.com/foto.jpg"
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
          />
          {coverImage && (
            <div className="h-36 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 max-w-sm">
              <img
                src={coverImage}
                alt="Pré-visualização"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Botão de Envio */}
        <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-7 py-3 rounded-xl bg-[#DE1F2A] hover:bg-[#C51620] text-white font-bold transition shadow-sm active:scale-98 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Sugestão de Local'}
          </button>
        </div>
      </form>
    </div>
  );
};
