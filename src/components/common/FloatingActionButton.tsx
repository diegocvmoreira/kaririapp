import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { placesApi } from '../../services/api/places';
import { eventsApi } from '../../services/api/events';
import { citiesApi } from '../../services/api/cities';
import { categoriesApi } from '../../services/api/categories';
import { PlaceFormModal } from '../admin/PlaceFormModal';
import { EventFormModal } from '../admin/EventFormModal';
import { Place, EventItem, City, Category } from '../../types';
import { mockCities } from '../../mocks/mockCities';
import { mockCategories } from '../../mocks/mockCategories';

export const FloatingActionButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const [cities, setCities] = useState<City[]>(mockCities);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [places, setPlaces] = useState<Place[]>([]);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const navigate = useNavigate();

  // Carrega opções de apoio para os modais em segundo plano
  useEffect(() => {
    citiesApi.getAll().then(setCities).catch(() => {});
    categoriesApi.getAll().then(setCategories).catch(() => {});
    placesApi.getAll().then(setPlaces).catch(() => {});
  }, []);

  // Fecha o menu ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleOpenPlaceModal = () => {
    setIsOpen(false);
    setIsPlaceModalOpen(true);
  };

  const handleOpenEventModal = () => {
    setIsOpen(false);
    setIsEventModalOpen(true);
  };

  const handleSavePlace = async (data: Partial<Place>) => {
    try {
      const created = await placesApi.create(data);
      showToast('success', `Local "${created.name}" cadastrado com sucesso!`);
      setIsPlaceModalOpen(false);

      // Dispara evento para sincronização em tempo real de listas abertas
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kariri:places_updated', { detail: created }));
      }

      // Redireciona para o novo local caso possua slug
      if (created.slug) {
        navigate(`/locais/${created.slug}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível cadastrar o local.';
      showToast('error', msg);
      throw err;
    }
  };

  const handleSaveEvent = async (data: Partial<EventItem>) => {
    try {
      const created = await eventsApi.create(data);
      showToast('success', `Evento "${created.title}" cadastrado com sucesso!`);
      setIsEventModalOpen(false);

      // Dispara evento para sincronização em tempo real de agendas abertas
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kariri:events_updated', { detail: created }));
      }

      // Redireciona para o novo evento caso possua slug
      if (created.slug) {
        navigate(`/eventos/${created.slug}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível cadastrar o evento.';
      showToast('error', msg);
      throw err;
    }
  };

  return (
    <>
      {/* Toast de notificação global pós-cadastro */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-500/95 text-white border-emerald-400'
                : 'bg-rose-600/95 text-white border-rose-500'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {toast.message}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop para fechar ao clicar fora quando o menu estiver aberto */}
      {isOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Fechar menu de opções"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setIsOpen(false);
          }}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* Container fixo do Botão Flutuante (FAB) - no canto inferior direito em desktop e mobile */}
      <div className="fixed right-4 bottom-[72px] md:bottom-8 md:right-8 z-[60] flex flex-col items-end">
        {/* Menu Speed Dial suspenso com as 2 opções */}
        {isOpen && (
          <div className="mb-2.5 flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Opção 1: Novo Evento */}
            <div className="flex items-center gap-2 group cursor-pointer" onClick={handleOpenEventModal}>
              <span className="px-2.5 py-1 rounded-xl bg-white text-gray-800 text-xs font-bold shadow-md border border-gray-100 select-none group-hover:bg-gray-50 transition">
                Novo Evento
              </span>
              <button
                type="button"
                onClick={handleOpenEventModal}
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 text-[#DE1F2A] hover:text-[#C51620] border border-gray-200/90 shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-[#DE1F2A]"
                title="Cadastrar Novo Evento"
                aria-label="Cadastrar Novo Evento"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>

            {/* Opção 2: Novo Local */}
            <div className="flex items-center gap-2 group cursor-pointer" onClick={handleOpenPlaceModal}>
              <span className="px-2.5 py-1 rounded-xl bg-white text-gray-800 text-xs font-bold shadow-md border border-gray-100 select-none group-hover:bg-gray-50 transition">
                Novo Local
              </span>
              <button
                type="button"
                onClick={handleOpenPlaceModal}
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 text-[#DE1F2A] hover:text-[#C51620] border border-gray-200/90 shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-[#DE1F2A]"
                title="Cadastrar Novo Local"
                aria-label="Cadastrar Novo Local"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Botão Flutuante Principal com o símbolo + (tamanho idêntico ao FavoriteButton: w-10 h-10) */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Fechar menu de criação' : 'Adicionar novo local ou evento'}
          title={isOpen ? 'Fechar menu' : 'Adicionar novo local ou evento (+)'}
          className={`w-10 h-10 rounded-full bg-[#DE1F2A] hover:bg-[#C51620] text-white shadow-[0_4px_16px_rgba(222,31,42,0.45)] hover:shadow-[0_6px_20px_rgba(222,31,42,0.6)] flex items-center justify-center transition-all duration-300 transform active:scale-90 focus:outline-hidden focus:ring-2 focus:ring-red-400 ${
            isOpen ? 'rotate-45' : 'hover:scale-105'
          }`}
        >
          <Plus className="w-5 h-5 stroke-[2.8px]" />
        </button>
      </div>

      {/* Modal de Criação de Local */}
      <PlaceFormModal
        isOpen={isPlaceModalOpen}
        onClose={() => setIsPlaceModalOpen(false)}
        onSave={handleSavePlace}
        cities={cities}
        categories={categories}
      />

      {/* Modal de Criação de Evento */}
      <EventFormModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        cities={cities}
        categories={categories}
        places={places}
      />
    </>
  );
};
