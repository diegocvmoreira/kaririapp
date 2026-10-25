import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { eventsApi } from '../services/api/events';
import { placesApi } from '../services/api/places';
import { categoriesApi } from '../services/api/categories';
import { Category, Place, EventItem } from '../types';
import { setPageMeta } from '../utils/seo';
import { Calendar, Clock, MapPin, CheckCircle2, ArrowLeft, Ticket, Image as ImageIcon, Building } from 'lucide-react';

export const CreateEventPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { cities } = useCity();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

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
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [ticketUrl, setTicketUrl] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80');

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('O título do evento é obrigatório.');
      return;
    }

    const selectedCity = cities.find((c) => c.id === Number(cityId));
    const selectedCat = categories.find((c) => c.id === Number(categoryId));
    const selectedPlace = placeId ? places.find((p) => p.id === Number(placeId)) : null;

    setIsSubmitting(true);
    setErrorMessage(null);

    const isPublicUser = user?.role !== 'admin';

    try {
      const created = await eventsApi.create({
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
        price_text: isFree ? 'Gratuito' : price ? `R$ ${price.toFixed(2)}` : 'A consultar',
        ticket_url: ticketUrl.trim() || undefined,
        organizer: organizer.trim(),
        description: description.trim(),
        cover_image: coverImage.trim() || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
        status: isPublicUser ? 'pending' : 'published',
        is_featured: false,
      });

      setCreatedEvent(created);
      setSuccess(true);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kariri:events_updated', { detail: created }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao cadastrar evento.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success && createdEvent) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-5 animate-in fade-in">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Evento enviado para moderação!</h1>
          <p className="text-sm text-gray-600 leading-relaxed max-w-lg mx-auto">
            O evento <strong>{createdEvent.title}</strong> foi recebido com sucesso.
            Nossa equipe editorial revisará as informações antes da inclusão na agenda cultural do Kariri.app.
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
                setTitle('');
                setDescription('');
                setStartDate('');
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
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
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

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold">
          <Calendar className="w-3.5 h-3.5 text-amber-600" />
          <span>Agenda Regional do Cariri</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Cadastrar Novo Evento
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
          Divulgue espetáculos, shows ao vivo, festas tradicionais, feiras gastronômicas e oficinas no Cariri.
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

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6 text-xs sm:text-sm">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
            1. Informações do Evento
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Título do Evento <span className="text-[#DE1F2A]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ex: Festival de Cordel e Xaxado"
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
              <label className="block font-bold text-gray-700 mb-1">Vincular a Local Cadastrado</label>
              <select
                value={placeId}
                onChange={(e) => handlePlaceSelect(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              >
                <option value="">Outro local / Não listado</option>
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Nome do Espaço / Local</label>
              <input
                type="text"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder="Ex: Teatro Rachel de Queiroz"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Endereço</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número e referências"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Data de Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Horário de Início</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Organizador / Produção</label>
              <input
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="Ex: Secretaria de Cultura"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isFreePage"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="w-4 h-4 text-[#DE1F2A] rounded border-gray-300"
            />
            <label htmlFor="isFreePage" className="font-bold text-gray-700 cursor-pointer">
              Evento com entrada gratuita
            </label>
          </div>

          {!isFree && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Valor do Ingresso (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price ?? ''}
                  onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="0.00"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Link de Ingressos (Sympla, etc.)</label>
                <input
                  type="url"
                  value={ticketUrl}
                  onChange={(e) => setTicketUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-gray-700 mb-1">Descrição do Evento</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Atrações musicais, classificação etária, programação e detalhes do evento..."
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A]"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
            2. Imagem de Divulgação (URL)
          </h2>
          <input
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://exemplo.com/cartaz.jpg"
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
            {isSubmitting ? 'Enviando...' : 'Cadastrar Evento para Moderação'}
          </button>
        </div>
      </form>
    </div>
  );
};
