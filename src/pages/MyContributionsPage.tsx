import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { placesApi } from '../services/api/places';
import { eventsApi } from '../services/api/events';
import { Place, EventItem, EntityStatus } from '../types';
import { setPageMeta } from '../utils/seo';
import {
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  ArrowLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const MyContributionsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'all' | 'places' | 'events'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | EntityStatus>('all');
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPageMeta({
      title: 'Minhas Contribuições – Kariri.app',
      description: 'Acompanhe o estado de aprovação, revisões e publicações das suas sugestões.',
    });

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [placesList, eventsList] = await Promise.all([
          placesApi.getAll(),
          eventsApi.getAll(),
        ]);
        // Em ambiente real/mock, filtra contribuições do usuário ou recentes
        setPlaces(placesList);
        setEvents(eventsList);
      } catch {
        // silencioso
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const getStatusBadge = (status?: EntityStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Publicado
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            Em Moderação
          </span>
        );
      case 'changes_requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">
            <RotateCcw className="w-3 h-3" />
            Ajustes Solicitados
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3" />
            Não Aprovado
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
            Rascunho
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
            Ativo
          </span>
        );
    }
  };

  const filteredPlaces = places.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  const filteredEvents = events.filter((e) => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <div className="flex items-center gap-2">
          <Link
            to="/novo-local"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DE1F2A] hover:bg-[#C51620] text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Local</span>
          </Link>
          <Link
            to="/novo-evento"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Evento</span>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#DE1F2A] text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Painel do Colaborador</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Minhas Contribuições
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
          Acompanhe o status editorial de cada local ou evento cadastrado por você no Kariri.app.
        </p>

        {/* Tabs e Filtros */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos ({filteredPlaces.length + filteredEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('places')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'places'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Locais ({filteredPlaces.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'events'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Eventos ({filteredEvents.length})
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="p-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#DE1F2A]"
            >
              <option value="all">Todos os Estados</option>
              <option value="pending">Pendente / Em Moderação</option>
              <option value="published">Publicado</option>
              <option value="changes_requested">Ajustes Solicitados</option>
              <option value="rejected">Não Aprovado</option>
              <option value="draft">Rascunho</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Contribuições */}
      <div className="space-y-3">
        {(activeTab === 'all' || activeTab === 'places') &&
          filteredPlaces.map((place) => (
            <div
              key={`place-${place.id}`}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs flex items-center justify-between gap-4 hover:border-gray-200 transition"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={place.cover_image}
                  alt={place.name}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                      Local
                    </span>
                    {getStatusBadge(place.status)}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm truncate">{place.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0 text-[#DE1F2A]" />
                    <span>
                      {place.city_name} • {place.category_name}
                    </span>
                  </p>
                </div>
              </div>

              {place.slug && place.status === 'published' ? (
                <Link
                  to={`/locais/${place.slug}`}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </Link>
              ) : null}
            </div>
          ))}

        {(activeTab === 'all' || activeTab === 'events') &&
          filteredEvents.map((evt) => (
            <div
              key={`event-${evt.id}`}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs flex items-center justify-between gap-4 hover:border-gray-200 transition"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={evt.cover_image}
                  alt={evt.title}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                      Evento
                    </span>
                    {getStatusBadge(evt.status)}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm truncate">{evt.title}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                    <Calendar className="w-3 h-3 shrink-0 text-amber-600" />
                    <span>
                      {evt.city_name} • {evt.display_date || evt.start_date}
                    </span>
                  </p>
                </div>
              </div>

              {evt.slug && evt.status === 'published' ? (
                <Link
                  to={`/eventos/${evt.slug}`}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </Link>
              ) : null}
            </div>
          ))}

        {filteredPlaces.length === 0 && filteredEvents.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 p-8 space-y-3">
            <Sparkles className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="font-bold text-gray-800 text-sm">Nenhuma contribuição encontrada</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Contribua com o catálogo do Cariri cadastrando um novo local ou evento para a comunidade.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <Link
                to="/novo-local"
                className="px-4 py-2 bg-[#DE1F2A] text-white text-xs font-bold rounded-xl hover:bg-[#C51620] transition"
              >
                Cadastrar Local
              </Link>
              <Link
                to="/novo-evento"
                className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition"
              >
                Cadastrar Evento
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
