import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, MapPin, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { placesApi } from '../../services/api/places';
import { eventsApi } from '../../services/api/events';
import { citiesApi } from '../../services/api/cities';
import { categoriesApi } from '../../services/api/categories';
import { PlaceFormModal } from '../admin/PlaceFormModal';
import { EventFormModal } from '../admin/EventFormModal';
import { Place, EventItem, City, Category } from '../../types';
import { mockCities } from '../../mocks/mockCities';
import { mockCategories } from '../../mocks/mockCategories';

// Rotas onde o botão flutuante não deve sobrepor formulários de autenticação
const AUTH_ROUTES = ['/login', '/cadastro', '/esqueci-senha', '/redefinir-senha'];

export const FloatingActionButton: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const [cities, setCities] = useState<City[]>(mockCities);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [places, setPlaces] = useState<Place[]>([]);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const mainButtonRef = useRef<HTMLButtonElement>(null);

  // Não renderiza o botão em rotas de autenticação
  const isAuthRoute = AUTH_ROUTES.includes(location.pathname);

  // Carrega opções de apoio em segundo plano
  useEffect(() => {
    citiesApi.getAll().then(setCities).catch(() => {});
    categoriesApi.getAll().then(setCategories).catch(() => {});
    placesApi.getAll().then(setPlaces).catch(() => {});
  }, []);

  // Fecha o menu ao trocar de rota
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Retomada automática de intenção de cadastro caso venha pela URL
  useEffect(() => {
    const intent = searchParams.get('intent');
    if (!intent) return;

    if (intent === 'create_place') {
      setIsPlaceModalOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('intent');
      const query = newParams.toString();
      navigate(`${location.pathname}${query ? `?${query}` : ''}`, { replace: true });
    } else if (intent === 'create_event') {
      setIsEventModalOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('intent');
      const query = newParams.toString();
      navigate(`${location.pathname}${query ? `?${query}` : ''}`, { replace: true });
    }
  }, [searchParams, navigate, location.pathname]);

  // Fecha ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        mainButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (isAuthRoute) {
    return null;
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 5500);
  };

  // Abre diretamente o modal de criação correspondente
  const handleOpenPlaceOption = () => {
    setIsOpen(false);
    setIsPlaceModalOpen(true);
  };

  const handleOpenEventOption = () => {
    setIsOpen(false);
    setIsEventModalOpen(true);
  };

  const isPublicUser = user?.role !== 'admin';

  const handleSavePlace = async (data: Partial<Place>) => {
    try {
      const created = await placesApi.create(data);
      setIsPlaceModalOpen(false);

      if (isPublicUser) {
        showToast(
          'success',
          `Sua sugestão de local "${created.name}" foi enviada com sucesso! Ela passará por moderação antes de ser publicada no Kariri.app.`
        );
      } else {
        showToast('success', `Local "${created.name}" salvo com sucesso!`);
        if (created.status === 'published' && created.slug) {
          navigate(`/locais/${created.slug}`);
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kariri:places_updated', { detail: created }));
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
      setIsEventModalOpen(false);

      if (isPublicUser) {
        showToast(
          'success',
          `Sua sugestão de evento "${created.title}" foi enviada com sucesso! Ela passará pela equipe de moderação antes de ser publicada.`
        );
      } else {
        showToast('success', `Evento "${created.title}" salvo com sucesso!`);
        if (created.status === 'published' && created.slug) {
          navigate(`/eventos/${created.slug}`);
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kariri:events_updated', { detail: created }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível cadastrar o evento.';
      showToast('error', msg);
      throw err;
    }
  };

  return (
    <>
      {/* Toast flutuante de notificação */}
      {toast && (
        <div className="fixed top-5 right-5 z-[70] max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-600/95 text-white border-emerald-400'
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

      {/* Backdrop para fechar ao clicar fora */}
      {isOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Fechar menu de criação"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setIsOpen(false);
          }}
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* FAB Container: posicionado no canto inferior direito, logo acima do menu inferior no mobile (bottom-[72px]) e no desktop (md:bottom-8 md:right-8) */}
      <div
        className="fixed right-4 bottom-[72px] md:bottom-8 md:right-8 z-50 flex flex-col items-end pointer-events-auto"
      >
        {/* Menu suspenso com as 2 opções: Novo local e Novo evento */}
        {isOpen && (
          <div
            role="menu"
            aria-label="Opções de adição"
            className="mb-3 flex flex-col items-end gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            {/* Opção 1: Novo Evento */}
            <div
              role="menuitem"
              tabIndex={0}
              className="flex items-center gap-2 group cursor-pointer"
              onClick={handleOpenEventOption}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenEventOption();
                }
              }}
            >
              <span className="px-3 py-1.5 rounded-xl bg-white text-gray-800 text-xs font-bold shadow-md border border-gray-100 select-none group-hover:bg-gray-50 transition">
                Novo evento
              </span>
              <button
                type="button"
                tabIndex={-1}
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 text-[#DE1F2A] hover:text-[#C51620] border border-gray-200 shadow-md flex items-center justify-center transition-transform duration-200 group-hover:scale-105 active:scale-95"
                aria-label="Novo evento"
                title="Novo evento"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>

            {/* Opção 2: Novo Local */}
            <div
              role="menuitem"
              tabIndex={0}
              className="flex items-center gap-2 group cursor-pointer"
              onClick={handleOpenPlaceOption}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenPlaceOption();
                }
              }}
            >
              <span className="px-3 py-1.5 rounded-xl bg-white text-gray-800 text-xs font-bold shadow-md border border-gray-100 select-none group-hover:bg-gray-50 transition">
                Novo local
              </span>
              <button
                type="button"
                tabIndex={-1}
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 text-[#DE1F2A] hover:text-[#C51620] border border-gray-200 shadow-md flex items-center justify-center transition-transform duration-200 group-hover:scale-105 active:scale-95"
                aria-label="Novo local"
                title="Novo local"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Botão Flutuante Principal com símbolo + (do mesmo tamanho do botão de favoritar: w-10 h-10) */}
        <button
          ref={mainButtonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={isOpen ? 'Fechar opções de cadastro' : 'Adicionar novo local ou evento'}
          title="Adicionar"
          className={`w-10 h-10 rounded-full bg-[#DE1F2A] hover:bg-[#C51620] text-white shadow-[0_4px_16px_rgba(222,31,42,0.45)] hover:shadow-[0_6px_20px_rgba(222,31,42,0.6)] flex items-center justify-center transition-all duration-300 transform active:scale-90 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#DE1F2A] ${
            isOpen ? 'rotate-45' : 'hover:scale-105'
          }`}
        >
          <Plus className="w-5 h-5 stroke-[2.8px]" />
        </button>
      </div>

      {/* Modal de Criação / Sugestão de Local */}
      <PlaceFormModal
        isOpen={isPlaceModalOpen}
        onClose={() => setIsPlaceModalOpen(false)}
        onSave={handleSavePlace}
        cities={cities}
        categories={categories}
        isPublicContribution={isPublicUser}
      />

      {/* Modal de Criação / Sugestão de Evento */}
      <EventFormModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        cities={cities}
        categories={categories}
        places={places}
        isPublicContribution={isPublicUser}
      />
    </>
  );
};
