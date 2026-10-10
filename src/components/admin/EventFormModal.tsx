import React, { useState, useEffect } from 'react';
import { EventItem, City, Category, Place, EntityStatus } from '../../types';
import { X, Calendar, Clock, MapPin, Ticket, Building, Image as ImageIcon } from 'lucide-react';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<EventItem>) => Promise<void>;
  event?: EventItem | null;
  cities: City[];
  categories: Category[];
  places: Place[];
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  event,
  cities,
  categories,
  places,
}) => {
  const isEditing = !!event;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [cityId, setCityId] = useState<number>(1);
  const [categoryId, setCategoryId] = useState<number>(1);
  const [placeId, setPlaceId] = useState<number | ''>('');
  const [placeName, setPlaceName] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [ticketUrl, setTicketUrl] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState<EntityStatus>('published');
  const [isFeatured, setIsFeatured] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (event) {
      setTitle(event.title || '');
      setSlug(event.slug || '');
      setCityId(event.city_id || cities[0]?.id || 1);
      setCategoryId(event.category_id || categories[0]?.id || 1);
      const targetPlaceId = event.place_id ?? '';
      setPlaceId(targetPlaceId);
      setPlaceName(event.place_name || '');
      setAddress(event.address || '');
      if (targetPlaceId && places.length > 0) {
        const found = places.find((p) => p.id === Number(targetPlaceId));
        if (found) {
          if (!event.place_name) setPlaceName(found.name);
          if (!event.address) setAddress(found.address);
        }
      }
      setStartDate(event.start_date || '');
      setEndDate(event.end_date || '');
      setStartTime(event.start_time || '19:00');
      setEndTime(event.end_time || '');
      setIsFree(!!event.is_free);
      setPrice(event.price);
      setTicketUrl(event.ticket_url || '');
      setOrganizer(event.organizer || '');
      setDescription(event.description || '');
      setCoverImage(event.cover_image || '');
      setStatus(event.status || 'published');
      setIsFeatured(!!event.is_featured);
    } else {
      setTitle('');
      setSlug('');
      setCityId(cities[0]?.id || 1);
      setCategoryId(categories[0]?.id || 1);
      setPlaceId('');
      setPlaceName('');
      setAddress('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setStartTime('19:00');
      setEndTime('');
      setIsFree(true);
      setPrice(undefined);
      setTicketUrl('');
      setOrganizer('Secretaria de Cultura / Produção Independente');
      setDescription('');
      setCoverImage('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80');
      setStatus('published');
      setIsFeatured(false);
    }
    setErrorMsg(null);
  }, [event, isOpen]);

  // Se a lista de locais carregar após a abertura do modal e houver placeId selecionado
  useEffect(() => {
    if (isOpen && placeId && places.length > 0 && !placeName) {
      const found = places.find((p) => p.id === Number(placeId));
      if (found) {
        setPlaceName(found.name);
        if (!address) setAddress(found.address);
      }
    }
  }, [places, placeId, isOpen, placeName, address]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('O título do evento é obrigatório.');
      return;
    }

    const selectedCity = cities.find((c) => c.id === Number(cityId));
    const selectedCat = categories.find((c) => c.id === Number(categoryId));
    const selectedPlace = placeId ? places.find((p) => p.id === Number(placeId)) : null;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSave({
        title: title.trim(),
        slug: slug.trim() || title.toLowerCase().replace(/\s+/g, '-'),
        city_id: Number(cityId),
        city_name: selectedCity?.name || 'Crato',
        city_slug: selectedCity?.slug || 'crato',
        category_id: Number(categoryId),
        category: selectedCat?.name || 'Cultura & Arte',
        place_id: placeId !== '' ? Number(placeId) : null,
        place_name: selectedPlace?.name || placeName.trim() || 'Espaço Cultural no Cariri',
        address: address.trim() || selectedPlace?.address || '',
        start_date: startDate,
        end_date: endDate || undefined,
        display_date: startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'A definir',
        start_time: startTime,
        end_time: endTime || undefined,
        is_free: isFree,
        price: isFree ? 0 : price,
        price_text: isFree ? 'Gratuito' : price ? `R$ ${price.toFixed(2)}` : 'A consultar',
        ticket_url: ticketUrl.trim() || undefined,
        organizer: organizer.trim(),
        description: description.trim(),
        cover_image: coverImage.trim() || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
        status,
        is_featured: isFeatured,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar o evento.';
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
              {isEditing ? `Editar Evento: ${event?.title}` : 'Cadastrar Novo Evento'}
            </h2>
            <p className="text-xs text-gray-500">
              Agenda cultural, festividades e espetáculos do Cariri cearense
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

          {/* Título e Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Título do Evento <span className="text-[#DE1F2A]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ex: Festival de Cordel & Xaxado"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Slug URL</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ex: festival-de-cordel-xaxado"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A] font-mono text-xs"
              />
            </div>
          </div>

          {/* Município e Categoria por ID */}
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
                Categoria (ID do banco) <span className="text-[#DE1F2A]">*</span>
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

          {/* Local Cadastrado ou Local Textual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#DE1F2A]" />
                <span>Vincular a Local Cadastrado (place_id)</span>
              </label>
              <select
                value={placeId}
                onChange={(e) => handlePlaceSelect(e.target.value)}
                className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
              >
                <option value="">-- Nenhum (local externo ou praça pública) --</option>
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Nome do Local / Espaço (location_name)
              </label>
              <input
                type="text"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder="Ex: Praça da Sé / Centro Cultural do Cariri"
                className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Endereço Completo</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Av. Joaquim Pinheiro Bezerra de Menezes, 1"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
            />
          </div>

          {/* Datas e Horários */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#DE1F2A]" />
                <span>Data Início</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Data Fim</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#DE1F2A]" />
                <span>Horário Início</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>Horário Fim</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
          </div>

          {/* Preço e Ingressos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="isFree"
                checked={isFree}
                onChange={(e) => {
                  setIsFree(e.target.checked);
                  if (e.target.checked) setPrice(undefined);
                }}
                className="w-4 h-4 text-[#DE1F2A] rounded border-gray-300 focus:ring-[#DE1F2A]"
              />
              <label htmlFor="isFree" className="font-bold text-gray-800 text-xs sm:text-sm select-none cursor-pointer">
                Evento Gratuito
              </label>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Valor do Ingresso (R$)</label>
              <input
                type="number"
                step="0.01"
                disabled={isFree}
                value={price ?? ''}
                onChange={(e) => setPrice(parseFloat(e.target.value))}
                placeholder={isFree ? 'Entrada Franca' : 'Ex: 25.00'}
                className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A] disabled:opacity-40"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5 text-gray-500" />
                <span>Link Externo de Ingressos</span>
              </label>
              <input
                type="url"
                value={ticketUrl}
                onChange={(e) => setTicketUrl(e.target.value)}
                placeholder="https://sympla.com.br..."
                className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
          </div>

          {/* Organizador */}
          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-gray-500" />
              <span>Organizador / Produtor</span>
            </label>
            <input
              type="text"
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              placeholder="Ex: Centro Cultural do Cariri / SESC Crato"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Descrição do Evento</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Programação, atrações confirmadas, classificação indicativa e orientações..."
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
            />
          </div>

          {/* Imagem de Capa */}
          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
              <span>URL da Imagem / Cartaz (cover_image)</span>
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
                id="eventFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-[#DE1F2A] rounded border-gray-300 focus:ring-[#DE1F2A]"
              />
              <label htmlFor="eventFeatured" className="font-bold text-gray-800 text-xs sm:text-sm select-none cursor-pointer">
                Destacar na página inicial
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
              {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Evento' : 'Cadastrar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
