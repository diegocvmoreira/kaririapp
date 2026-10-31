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

export const FloatingActionButton: React.FC = () => {
  const { user } = useAuth();
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
  const firstMenuItemRef = useRef<HTMLButtonElement>(null);

  // P0.2 — Exibir somente em Home, Explorar e Mapa
  // Ocultar em detalhes (que possuem barra de ações persistente própria), cadastro, perfil e admin
  const pathname = location.pathname;
  const isAllowedRoute =
    pathname === '/' ||
    pathname === '/explorar' ||
    pathname === '/mapa';

  // Carrega opções de apoio em segundo plano
  useEffect(() => {
    if (!isAllowedRoute) return;
    citiesApi.getAll().then(setCities).catch(() => {});
    categoriesApi.getAll().then(setCategories).catch(() => {});
    placesApi.getAll().then(setPlaces).catch(() => {});
  }, [isAllowedRoute]);

  // Fecha o menu ao trocar de rota
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Gestão de foco acessível ao abrir e fechar o menu
  useEffect(() => {
    if (isOpen) {
      // Move o foco para o primeiro item acessível do menu
      const timer = setTimeout(() => {
        firstMenuItemRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Fecha ao pressionar Escape e restaura o foco no botão de disparo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        mainButtonRef.current?.focus();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  // Retomada automática de intenção de cadastro via URL
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

  if (!isAllowedRoute) {
    return null;
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 5500);
  };

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

      {/* Scrim discreto ao abrir (sem blur pesado em tela inteira) */}
      {isOpen && (
        <div
          aria-hidden="true"
          onClick={() => {
            setIsOpen(false);
            mainButtonRef.current?.focus();
          }}
          className="fixed inset-0 z-40 bg-black/20 transition-opacity duration-200"
        />
      )}

      {/* FAB Container: 
          Posicionamento seguro considerando safe-area-inset-bottom e altura da BottomNavigation (4.5rem/72px + safe area + 12px) 
          Desktop: md:bottom-8 md:right-8
      */}
      <div
        style={{
          bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px) + 12px)',
        }}
        className="fixed right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end pointer-events-auto"
      >
        {/* Menu Speed-Dial Semântico */}
        {isOpen && (
          <div
            id="fab-speeddial-menu"
            role="menu"
            aria-labelledby="fab-main-trigger"
            className="mb-3 flex flex-col items-end gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            {/* Opção 1: Novo Local */}
            <button
              ref={firstMenuItemRef}
              role="menuitem"
              type="button"
              onClick={handleOpenPlaceOption}
              className="group flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 rounded-full bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold shadow-lg border border-gray-200 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#DE1F2A]"
            >
              <span className="select-none text-gray-800 group-hover:text-[#DE1F2A] transition">
                Novo local
              </span>
              <div className="w-8 h-8 rounded-full bg-[#DE1F2A] text-white flex items-center justify-center shadow-xs">
                <MapPin className="w-4 h-4" />
              </div>
            </button>

            {/* Opção 2: Novo Evento */}
            <button
              role="menuitem"
              type="button"
              onClick={handleOpenEventOption}
              className="group flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 rounded-full bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold shadow-lg border border-gray-200 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#DE1F2A]"
            >
              <span className="select-none text-gray-800 group-hover:text-[#DE1F2A] transition">
                Novo evento
              </span>
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Botão Flutuante Principal:
            Alvo de toque acessível (48px - 52px: w-12 h-12 md:w-13 md:h-13)
            com aria-expanded, aria-controls e rotação suave
        */}
        <button
          ref={mainButtonRef}
          id="fab-main-trigger"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-controls="fab-speeddial-menu"
          aria-label={isOpen ? 'Fechar opções de cadastro' : 'Contribuir: cadastrar novo local ou evento'}
          title="Contribuir com o Kariri.app"
          className={`w-12 h-12 md:w-13 md:h-13 rounded-full bg-[#DE1F2A] hover:bg-[#C51620] text-white shadow-[0_4px_16px_rgba(222,31,42,0.45)] hover:shadow-[0_6px_20px_rgba(222,31,42,0.6)] flex items-center justify-center transition-all duration-300 transform active:scale-90 focus:outline-none focus:ring-3 focus:ring-[#DE1F2A]/40 focus:ring-offset-2 ${
            isOpen ? 'rotate-45' : 'hover:scale-105'
          }`}
        >
          <Plus className="w-6 h-6 stroke-[2.6px]" />
        </button>
      </div>

      {/* Modal de Criação / Sugestão de Local */}
      <PlaceFormModal
        isOpen={isPlaceModalOpen}
        onClose={() => {
          setIsPlaceModalOpen(false);
          mainButtonRef.current?.focus();
        }}
        onSave={handleSavePlace}
        cities={cities}
        categories={categories}
        isPublicContribution={isPublicUser}
      />

      {/* Modal de Criação / Sugestão de Evento */}
      <EventFormModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          mainButtonRef.current?.focus();
        }}
        onSave={handleSaveEvent}
        cities={cities}
        categories={categories}
        places={places}
        isPublicContribution={isPublicUser}
      />
    </>
  );
};
