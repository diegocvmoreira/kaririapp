import React, { useState, useEffect } from 'react';
import { Place, City, Category, EntityStatus } from '../../types';
import { X, Sparkles, MapPin, Phone, Globe, Instagram, Clock, DollarSign, Image as ImageIcon } from 'lucide-react';

interface PlaceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Place>) => Promise<void>;
  place?: Place | null;
  cities: City[];
  categories: Category[];
}

export const PlaceFormModal: React.FC<PlaceFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  place,
  cities,
  categories,
}) => {
  const isEditing = !!place;

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
  const [openingHours, setOpeningHours] = useState('');
  const [priceLevel, setPriceLevel] = useState<1 | 2 | 3 | 4>(2);
  const [status, setStatus] = useState<EntityStatus>('published');
  const [isFeatured, setIsFeatured] = useState(false);
  const [coverImage, setCoverImage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (place) {
      setName(place.name || '');
      setSlug(place.slug || '');
      setCityId(place.city_id || 1);
      setCategoryId(place.category_id || 1);
      setShortDescription(place.short_description || '');
      setDescription(place.description || '');
      setAddress(place.address || '');
      setNeighborhood(place.neighborhood || '');
      setZipcode(place.zipcode || '');
      setLatitude(place.latitude || -7.2341);
      setLongitude(place.longitude || -39.4124);
      setPhone(place.phone || '');
      setWhatsapp(place.whatsapp || '');
      setWebsite(place.website || '');
      setInstagram(place.instagram || '');
      setOpeningHours(place.opening_hours || '');
      setPriceLevel(place.price_level || 2);
      setStatus(place.status || 'published');
      setIsFeatured(!!place.is_featured);
      setCoverImage(place.cover_image || '');
    } else {
      setName('');
      setSlug('');
      setCityId(cities[0]?.id || 1);
      setCategoryId(categories[0]?.id || 1);
      setShortDescription('');
      setDescription('');
      setAddress('');
      setNeighborhood('');
      setZipcode('');
      setLatitude(-7.2341);
      setLongitude(-39.4124);
      setPhone('');
      setWhatsapp('');
      setWebsite('');
      setInstagram('');
      setOpeningHours('Seg a Sáb: 08:00 - 18:00');
      setPriceLevel(2);
      setStatus('published');
      setIsFeatured(false);
      setCoverImage('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80');
    }
    setErrorMsg(null);
  }, [place, isOpen, cities, categories]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('O nome do local é obrigatório.');
      return;
    }

    const selectedCity = cities.find((c) => c.id === Number(cityId));
    const selectedCat = categories.find((c) => c.id === Number(categoryId));

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSave({
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
        opening_hours: openingHours.trim(),
        price_level: priceLevel,
        status,
        is_featured: isFeatured,
        cover_image: coverImage.trim() || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar o local.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEditing ? `Editar Local: ${place?.name}` : 'Cadastrar Novo Local'}
            </h2>
            <p className="text-xs text-gray-500">
              Preencha os dados cadastrais para publicação no Kariri.app
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Nome e Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Nome do Local <span className="text-[#DE1F2A]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Restaurante Sirigado do Cariri"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Slug URL</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ex: restaurante-sirigado-do-cariri"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A] font-mono text-xs"
              />
            </div>
          </div>

          {/* Cidade e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Município <span className="text-[#DE1F2A]">*</span>
              </label>
              <select
                value={cityId}
                onChange={(e) => setCityId(Number(e.target.value))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Categoria <span className="text-[#DE1F2A]">*</span>
              </label>
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
          </div>

          {/* Descrição Curta */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Descrição Curta (Cards)</label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Resumo de uma linha para visualização rápida nos cards"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
            />
          </div>

          {/* Descrição Completa */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Descrição Completa</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Histórico, ambiente, especialidades e informações turísticas..."
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
            />
          </div>

          {/* Endereço e Bairro */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-700 mb-1">Endereço Completo</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número e complemento"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Bairro</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Ex: Centro / Pimenta"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
          </div>

          {/* Coordenadas GPS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#DE1F2A]" />
                <span>Latitude</span>
              </label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                placeholder="-7.2341"
                className="w-full p-2 bg-white border border-gray-200 rounded-xl font-mono text-xs focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#DE1F2A]" />
                <span>Longitude</span>
              </label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                placeholder="-39.4124"
                className="w-full p-2 bg-white border border-gray-200 rounded-xl font-mono text-xs focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
          </div>

          {/* Contatos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-500" />
                <span>Telefone</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(88) 3531-0000"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="88999998888"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Instagram className="w-3.5 h-3.5 text-pink-600" />
                <span>Instagram</span>
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@perfiloficial"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Website</span>
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://meusite.com.br"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
          </div>

          {/* Horários e Preço */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                <span>Horário de Funcionamento</span>
              </label>
              <input
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="Ex: Ter a Dom: 11h às 23h"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-gray-500" />
                <span>Faixa de Preço</span>
              </label>
              <select
                value={priceLevel}
                onChange={(e) => setPriceLevel(Number(e.target.value) as 1 | 2 | 3 | 4)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              >
                <option value={1}>$ - Econômico</option>
                <option value={2}>$$ - Moderado</option>
                <option value={3}>$$$ - Alto Padrão</option>
                <option value={4}>$$$$ - Luxo / Premium</option>
              </select>
            </div>
          </div>

          {/* Imagem de Capa */}
          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
              <span>URL da Imagem de Capa</span>
            </label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
            />
            {coverImage && (
              <div className="mt-2 h-28 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
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

          {/* Status e Destaque */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Status de Publicação</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EntityStatus)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              >
                <option value="published">Publicado</option>
                <option value="draft">Rascunho</option>
                <option value="pending">Pendente de Revisão</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-[#DE1F2A] rounded border-gray-300 focus:ring-[#DE1F2A]"
              />
              <label htmlFor="isFeatured" className="font-bold text-gray-800 text-xs sm:text-sm select-none cursor-pointer">
                Exibir na seção de Destaques
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#DE1F2A] hover:bg-[#C51620] text-white font-bold transition shadow-sm active:scale-98 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Local' : 'Cadastrar Local'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
