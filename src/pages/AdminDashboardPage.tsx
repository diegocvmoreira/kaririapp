import React, { useEffect, useState } from 'react';
import { Place, EventItem, BusinessClaim, User, City, Category, EntityStatus, UserRole } from '../types';
import { placesApi } from '../services/api/places';
import { eventsApi } from '../services/api/events';
import { businessClaimsApi } from '../services/api/businessClaims';
import { usersApi } from '../services/api/users';
import { citiesApi } from '../services/api/cities';
import { categoriesApi } from '../services/api/categories';
import {
  runPlacesDiagnostics,
  EndpointDiagnosticResult,
  ApiDiagnosticCategory,
} from '../services/api/diagnostics';
import { API_BASE_URL, USE_MOCK_DATA } from '../services/api/config';
import { setPageMeta } from '../utils/seo';
import { BackButton } from '../components/common/BackButton';
import { PlaceFormModal } from '../components/admin/PlaceFormModal';
import { EventFormModal } from '../components/admin/EventFormModal';
import { RejectClaimModal } from '../components/admin/RejectClaimModal';
import { ConfirmDeleteModal } from '../components/admin/ConfirmDeleteModal';
import {
  Building2,
  Calendar,
  Users,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  Filter,
  Activity,
  Plus,
  Edit2,
  Trash2,
  Search,
  ExternalLink,
  MessageCircle,
  Phone,
  Tag,
  MapPin,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [claims, setClaims] = useState<BusinessClaim[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [activeTab, setActiveTab] = useState<'places' | 'events' | 'users' | 'claims' | 'diagnostics'>('places');
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter states
  const [placeSearch, setPlaceSearch] = useState('');
  const [placeCityFilter, setPlaceCityFilter] = useState('all');
  const [placePage, setPlacePage] = useState(1);
  const PLACES_PER_PAGE = 8;

  const [eventSearch, setEventSearch] = useState('');
  const [eventCityFilter, setEventCityFilter] = useState('all');
  const [eventPage, setEventPage] = useState(1);
  const EVENTS_PER_PAGE = 6;

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 5;

  const [claimPage, setClaimPage] = useState(1);
  const CLAIMS_PER_PAGE = 5;

  useEffect(() => {
    setPlacePage(1);
  }, [placeSearch, placeCityFilter]);

  useEffect(() => {
    setEventPage(1);
  }, [eventSearch, eventCityFilter]);

  useEffect(() => {
    setUserPage(1);
  }, [userSearch, userRoleFilter, userStatusFilter]);

  // Modals state
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  const [rejectingClaim, setRejectingClaim] = useState<BusinessClaim | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'local' | 'evento';
    id: number;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast / feedback message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Diagnostics runner state
  const [diagResults, setDiagResults] = useState<EndpointDiagnosticResult[]>([]);
  const [isRunningDiag, setIsRunningDiag] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadAllData = () => {
    setIsLoading(true);
    Promise.allSettled([
      placesApi.getAll(),
      eventsApi.getAll(),
      businessClaimsApi.getAll(),
      usersApi.getAll(),
      citiesApi.getAll(),
      categoriesApi.getAll(),
    ]).then(([placesRes, eventsRes, claimsRes, usersRes, citiesRes, categoriesRes]) => {
      if (placesRes.status === 'fulfilled') setPlaces(placesRes.value);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value);
      if (claimsRes.status === 'fulfilled') setClaims(claimsRes.value);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.users);
      if (citiesRes.status === 'fulfilled') setCities(citiesRes.value);
      if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    setPageMeta({
      title: 'Painel Administrativo - Kariri.app',
      description: 'Gestão de locais, eventos, usuários e reivindicações de empresas do Kariri.app.',
    });
    loadAllData();
  }, []);

  // Place CRUD handlers
  const handleSavePlace = async (data: Partial<Place>) => {
    try {
      if (editingPlace) {
        const updated = await placesApi.update(editingPlace.id, data);
        setPlaces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showFeedback('success', `Local "${updated.name}" atualizado com sucesso!`);
      } else {
        const created = await placesApi.create(data);
        setPlaces((prev) => [created, ...prev]);
        showFeedback('success', `Local "${created.name}" cadastrado com sucesso!`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar local.';
      showFeedback('error', msg);
      throw err;
    }
  };

  const handleTogglePlaceStatus = async (place: Place) => {
    const nextStatus: EntityStatus = place.status === 'published' ? 'draft' : 'published';
    try {
      await placesApi.updateStatus(place.id, nextStatus);
      setPlaces((prev) =>
        prev.map((p) => (p.id === place.id ? { ...p, status: nextStatus } : p))
      );
      showFeedback('success', `Status de "${place.name}" alterado para ${nextStatus}.`);
    } catch (err: unknown) {
      showFeedback('error', 'Falha ao alterar status do local.');
    }
  };

  // Event CRUD handlers
  const handleSaveEvent = async (data: Partial<EventItem>) => {
    try {
      if (editingEvent) {
        const updated = await eventsApi.update(editingEvent.id, data);
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        showFeedback('success', `Evento "${updated.title}" atualizado com sucesso!`);
      } else {
        const created = await eventsApi.create(data);
        setEvents((prev) => [created, ...prev]);
        showFeedback('success', `Evento "${created.title}" cadastrado com sucesso!`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar evento.';
      showFeedback('error', msg);
      throw err;
    }
  };

  const handleToggleEventStatus = async (event: EventItem) => {
    const nextStatus: EntityStatus = event.status === 'published' ? 'draft' : 'published';
    try {
      await eventsApi.updateStatus(event.id, nextStatus);
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, status: nextStatus } : e))
      );
      showFeedback('success', `Status de "${event.title}" alterado para ${nextStatus}.`);
    } catch (err: unknown) {
      showFeedback('error', 'Falha ao alterar status do evento.');
    }
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'local') {
        await placesApi.delete(deleteTarget.id);
        setPlaces((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        showFeedback('success', `Local "${deleteTarget.title}" excluído.`);
      } else {
        await eventsApi.delete(deleteTarget.id);
        setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
        showFeedback('success', `Evento "${deleteTarget.title}" excluído.`);
      }
      setDeleteTarget(null);
    } catch (err: unknown) {
      showFeedback('error', 'Falha ao realizar exclusão no backend.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Claim handlers
  const handleApproveClaim = async (claim: BusinessClaim) => {
    try {
      await businessClaimsApi.updateStatus(claim.id, 'approved');
      setClaims((prev) =>
        prev.map((c) => (c.id === claim.id ? { ...c, status: 'approved' } : c))
      );
      showFeedback('success', `Reivindicação de "${claim.place_name}" aprovada.`);
    } catch (err: unknown) {
      showFeedback('error', 'Falha ao aprovar reivindicação.');
    }
  };

  const handleConfirmRejectClaim = async (reason: string) => {
    if (!rejectingClaim) return;
    try {
      await businessClaimsApi.updateStatus(rejectingClaim.id, 'rejected', reason);
      setClaims((prev) =>
        prev.map((c) =>
          c.id === rejectingClaim.id ? { ...c, status: 'rejected', message: `${c.message} [Rejeitado: ${reason}]` } : c
        )
      );
      showFeedback('success', `Reivindicação de "${rejectingClaim.place_name}" rejeitada.`);
    } catch (err: unknown) {
      showFeedback('error', 'Falha ao rejeitar reivindicação.');
    }
  };

  // User handlers
  const handleToggleUserStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await usersApi.updateStatus(user.id, nextStatus as 'active' | 'inactive');
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
      );
      showFeedback('success', `Status de ${user.name} alterado para ${nextStatus}.`);
    } catch {
      showFeedback('error', 'Falha ao alterar status do usuário.');
    }
  };

  const handleChangeUserRole = async (user: User, newRole: UserRole) => {
    try {
      await usersApi.updateRole(user.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      showFeedback('success', `Função de ${user.name} alterada para ${newRole}.`);
    } catch {
      showFeedback('error', 'Falha ao alterar função do usuário.');
    }
  };

  // Diagnostics runner
  const handleRunDiagnostics = async () => {
    setIsRunningDiag(true);
    try {
      const results = await runPlacesDiagnostics();
      setDiagResults(results);
    } finally {
      setIsRunningDiag(false);
    }
  };

  // Filtering places
  const filteredPlaces = places.filter((p) => {
    const matchesSearch =
      !placeSearch ||
      p.name.toLowerCase().includes(placeSearch.toLowerCase()) ||
      p.category_name.toLowerCase().includes(placeSearch.toLowerCase());
    const matchesCity = placeCityFilter === 'all' || p.city_slug === placeCityFilter;
    return matchesSearch && matchesCity;
  });

  // Filtering events
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      !eventSearch ||
      e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.category.toLowerCase().includes(eventSearch.toLowerCase());
    const matchesCity = eventCityFilter === 'all' || e.city_slug === eventCityFilter;
    return matchesSearch && matchesCity;
  });

  const totalPlacePages = Math.max(1, Math.ceil(filteredPlaces.length / PLACES_PER_PAGE));
  const paginatedPlaces = filteredPlaces.slice(
    (placePage - 1) * PLACES_PER_PAGE,
    placePage * PLACES_PER_PAGE
  );

  const totalEventPages = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PER_PAGE));
  const paginatedEvents = filteredEvents.slice(
    (eventPage - 1) * EVENTS_PER_PAGE,
    eventPage * EVENTS_PER_PAGE
  );

  // Filtering users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || (u.status || 'active') === userStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * USERS_PER_PAGE,
    userPage * USERS_PER_PAGE
  );

  const totalClaimPages = Math.max(1, Math.ceil(claims.length / CLAIMS_PER_PAGE));
  const paginatedClaims = claims.slice(
    (claimPage - 1) * CLAIMS_PER_PAGE,
    claimPage * CLAIMS_PER_PAGE
  );

  const getCategoryBadge = (category?: ApiDiagnosticCategory) => {
    switch (category) {
      case 'CORS':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'CLOUDFLARE':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'ROTA':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'AUTENTICACAO':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'FORMATO_JSON':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'REDE':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-in fade-in pb-16">
      {/* Toast Alert */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-top duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-bold">{feedback.message}</span>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallbackTo="/perfil" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Painel Administrativo
            </h1>
            <p className="text-xs text-gray-500">
              Gestão completa de locais, eventos, usuários e empresas do Kariri.app
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAllData}
            title="Recarregar dados"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <span className="px-3 py-1.5 bg-black text-white text-[11px] font-bold rounded-xl shadow-xs">
            Modo Administrador
          </span>
        </div>
      </div>

      {/* 1. Indicadores Chave */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FDE8E9] text-[#DE1F2A] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-gray-900">{places.length}</span>
            <p className="text-[11px] text-gray-500">Locais no Guia</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-gray-900">{events.length}</span>
            <p className="text-[11px] text-gray-500">Eventos na Agenda</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-gray-900">{claims.length}</span>
            <p className="text-[11px] text-gray-500">Reivindicações</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-gray-900">{users.length}</span>
            <p className="text-[11px] text-gray-500">Usuários Ativos</p>
          </div>
        </div>
      </div>

      {/* 2. Abas de Navegação */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('places')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'places'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Gestão de Locais ({places.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'events'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Gestão de Eventos ({events.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Usuários ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'claims'
              ? 'bg-black text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Reivindicações ({claims.length})</span>
          {claims.some((c) => c.status === 'pending') && (
            <span className="w-2 h-2 rounded-full bg-[#DE1F2A]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('diagnostics')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'diagnostics'
              ? 'bg-[#DE1F2A] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Diagnóstico da API</span>
        </button>
      </div>

      {/* 3. CONTEÚDO DAS ABAS */}

      {/* ABA: GESTÃO DE LOCAIS (4.1) */}
      {activeTab === 'places' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Locais e Estabelecimentos Cadastrados</h2>
              <p className="text-xs text-gray-500">Criação, edição, exclusão e alteração de status em tempo real</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingPlace(null);
                setIsPlaceModalOpen(true);
              }}
              className="px-4 py-2.5 bg-[#DE1F2A] hover:bg-[#C51620] text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Local</span>
            </button>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={placeSearch}
                onChange={(e) => setPlaceSearch(e.target.value)}
                placeholder="Buscar por nome ou categoria..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
            <select
              value={placeCityFilter}
              onChange={(e) => setPlaceCityFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
            >
              <option value="all">Todas as Cidades</option>
              {cities.map((city) => (
                <option key={city.id} value={city.slug}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de Locais */}
          {filteredPlaces.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              Nenhum local encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="divide-y divide-gray-100">
                {paginatedPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-gray-50/50 p-2 rounded-2xl transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={place.cover_image}
                        alt={place.name}
                        className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-gray-100"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 truncate">{place.name}</h4>
                          {place.is_featured && (
                            <span className="px-1.5 py-0.5 bg-[#FDE8E9] text-[#DE1F2A] font-bold text-[9px] rounded-md">
                              Destaque
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {place.category_name} • {place.city_name} • {place.rating} ★ ({place.reviews_count} avaliações)
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {place.address} {place.phone ? `• ${place.phone}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {/* Botão de Status */}
                      <button
                        type="button"
                        onClick={() => handleTogglePlaceStatus(place)}
                        title="Clique para alternar status"
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 ${
                          place.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : place.status === 'draft'
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{place.status === 'published' ? 'Publicado' : place.status === 'draft' ? 'Rascunho' : 'Pendente'}</span>
                      </button>

                      {/* Editar */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPlace(place);
                          setIsPlaceModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                        title="Editar dados do local"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Excluir */}
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: 'local',
                            id: place.id,
                            title: place.name,
                          })
                        }
                        className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                        title="Excluir local"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Controles de Paginação (Locais) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 px-2">
                <span className="text-xs text-gray-500">
                  Mostrando{' '}
                  <strong className="text-gray-900">
                    {(placePage - 1) * PLACES_PER_PAGE + 1}
                  </strong>{' '}
                  a{' '}
                  <strong className="text-gray-900">
                    {Math.min(placePage * PLACES_PER_PAGE, filteredPlaces.length)}
                  </strong>{' '}
                  de <strong className="text-gray-900">{filteredPlaces.length}</strong> locais
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPlacePage((p) => Math.max(1, p - 1))}
                    disabled={placePage <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1 text-xs font-semibold px-2"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>

                  <span className="text-xs font-bold text-gray-700 px-2">
                    {placePage} / {totalPlacePages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setPlacePage((p) => Math.min(totalPlacePages, p + 1))}
                    disabled={placePage >= totalPlacePages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1 text-xs font-semibold px-2"
                  >
                    <span>Próxima</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA: GESTÃO DE EVENTOS (4.2) */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Programação & Agenda de Eventos</h2>
              <p className="text-xs text-gray-500">Criação, edição, exclusão e gestão de ingressos</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingEvent(null);
                setIsEventModalOpen(true);
              }}
              className="px-4 py-2.5 bg-[#DE1F2A] hover:bg-[#C51620] text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Evento</span>
            </button>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Buscar por título ou atração..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
            <select
              value={eventCityFilter}
              onChange={(e) => setEventCityFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
            >
              <option value="all">Todas as Cidades</option>
              {cities.map((city) => (
                <option key={city.id} value={city.slug}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de Eventos */}
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              Nenhum evento encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="divide-y divide-gray-100">
                {paginatedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-gray-50/50 p-2 rounded-2xl transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={event.cover_image}
                        alt={event.title}
                        className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-gray-100"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 truncate">{event.title}</h4>
                          {event.is_free && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[9px] rounded-md">
                              Gratuito
                            </span>
                          )}
                          {event.is_featured && (
                            <span className="px-1.5 py-0.5 bg-[#FDE8E9] text-[#DE1F2A] font-bold text-[9px] rounded-md">
                              Destaque
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {event.display_date} às {event.start_time} • {event.place_name}, {event.city_name}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {event.category} • {event.price_text} {event.ticket_url ? '• Com Link Oficial' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleToggleEventStatus(event)}
                        title="Clique para alternar status"
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 ${
                          event.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{event.status === 'published' ? 'Publicado' : 'Rascunho'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingEvent(event);
                          setIsEventModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                        title="Editar evento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: 'evento',
                            id: event.id,
                            title: event.title,
                          })
                        }
                        className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                        title="Excluir evento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Controles de Paginação (Eventos) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 px-2">
                <span className="text-xs text-gray-500">
                  Mostrando{' '}
                  <strong className="text-gray-900">
                    {(eventPage - 1) * EVENTS_PER_PAGE + 1}
                  </strong>{' '}
                  a{' '}
                  <strong className="text-gray-900">
                    {Math.min(eventPage * EVENTS_PER_PAGE, filteredEvents.length)}
                  </strong>{' '}
                  de <strong className="text-gray-900">{filteredEvents.length}</strong> eventos
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEventPage((p) => Math.max(1, p - 1))}
                    disabled={eventPage <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1 text-xs font-semibold px-2"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>

                  <span className="text-xs font-bold text-gray-700 px-2">
                    {eventPage} / {totalEventPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setEventPage((p) => Math.min(totalEventPages, p + 1))}
                    disabled={eventPage >= totalEventPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1 text-xs font-semibold px-2"
                  >
                    <span>Próxima</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA: GESTÃO DE USUÁRIOS (4.3) */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Usuários Cadastrados na Plataforma</h2>
              <p className="text-xs text-gray-500">Gestão de permissões, papéis administrativos e status</p>
            </div>
          </div>

          {/* Filtros de Usuários */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>

            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
            >
              <option value="all">Todas as Funções</option>
              <option value="admin">Administrador (admin)</option>
              <option value="business">Comercial / Empresa (business)</option>
              <option value="user">Usuário Comum (user)</option>
            </select>

            <select
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo / Bloqueado</option>
            </select>
          </div>

          {/* Tabela de Usuários */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              Nenhum usuário encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Usuário</th>
                    <th className="py-2.5 px-3">Função</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Cadastro</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 text-xs shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{u.name}</p>
                            <p className="text-[11px] text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeUserRole(u, e.target.value as UserRole)}
                          className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-xs font-semibold focus:outline-none focus:border-[#DE1F2A]"
                        >
                          <option value="user">Usuário (user)</option>
                          <option value="business">Empresa (business)</option>
                          <option value="admin">Admin (admin)</option>
                        </select>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            (u.status || 'active') === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {(u.status || 'active') === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-gray-400 text-[11px]">
                        {u.created_at || '2026-03-01'}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                            (u.status || 'active') === 'active'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {(u.status || 'active') === 'active' ? 'Bloquear' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Controles de Paginação (4.3) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 px-3">
                <span className="text-xs text-gray-500">
                  Mostrando{' '}
                  <strong className="text-gray-900">
                    {(userPage - 1) * USERS_PER_PAGE + 1}
                  </strong>{' '}
                  a{' '}
                  <strong className="text-gray-900">
                    {Math.min(userPage * USERS_PER_PAGE, filteredUsers.length)}
                  </strong>{' '}
                  de <strong className="text-gray-900">{filteredUsers.length}</strong> usuários
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    disabled={userPage <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1 text-xs font-semibold px-2"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>

                  <span className="text-xs font-bold text-gray-700 px-2">
                    {userPage} / {totalUserPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                    disabled={userPage >= totalUserPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1 text-xs font-semibold px-2"
                  >
                    <span>Próxima</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA: REIVINDICAÇÕES DE EMPRESAS (4.4) */}
      {activeTab === 'claims' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Solicitações de Reivindicação ("Este local é meu")
              </h2>
              <p className="text-xs text-gray-500">
                Aprove ou rejeite gestores comerciais antes de conceder acesso de edição
              </p>
            </div>
          </div>

          {claims.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-12">
              Nenhuma solicitação de empresa pendente no momento.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {paginatedClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-[#DE1F2A] uppercase">
                          {claim.place_name}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900">
                          {claim.user_name} ({claim.user_email})
                        </h4>
                        {claim.phone && (
                          <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp: {claim.phone}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            claim.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : claim.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {claim.status === 'approved'
                            ? 'Aprovado'
                            : claim.status === 'rejected'
                            ? 'Rejeitado'
                            : 'Pendente de Análise'}
                        </span>
                        <span className="text-[10px] text-gray-400">{claim.created_at}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-700 bg-white p-3 rounded-xl border border-gray-100 leading-relaxed">
                      "{claim.message}"
                    </p>

                    {claim.proof && (
                      <p className="text-[11px] text-gray-500">
                        <strong>Comprovante / CNPJ:</strong> {claim.proof}
                      </p>
                    )}

                    {claim.status === 'pending' && (
                      <div className="pt-1 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setRejectingClaim(claim)}
                          className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejeitar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApproveClaim(claim)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Aprovar Gestor</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Controles de Paginação (Reivindicações) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 px-2">
                <span className="text-xs text-gray-500">
                  Mostrando{' '}
                  <strong className="text-gray-900">
                    {(claimPage - 1) * CLAIMS_PER_PAGE + 1}
                  </strong>{' '}
                  a{' '}
                  <strong className="text-gray-900">
                    {Math.min(claimPage * CLAIMS_PER_PAGE, claims.length)}
                  </strong>{' '}
                  de <strong className="text-gray-900">{claims.length}</strong> solicitações
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setClaimPage((p) => Math.max(1, p - 1))}
                    disabled={claimPage <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1 text-xs font-semibold px-2"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>

                  <span className="text-xs font-bold text-gray-700 px-2">
                    {claimPage} / {totalClaimPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setClaimPage((p) => Math.min(totalClaimPages, p + 1))}
                    disabled={claimPage >= totalClaimPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1 text-xs font-semibold px-2"
                  >
                    <span>Próxima</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA: DIAGNÓSTICO DA API */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#DE1F2A] uppercase tracking-wider block">
                  Auditoria de Conectividade & Endpoints
                </span>
                <h2 className="text-base sm:text-lg font-black text-gray-900 mt-0.5">
                  Diagnóstico Técnico da Integração de Locais (placesApi)
                </h2>
                <p className="text-xs text-gray-500 mt-1 max-w-xl">
                  Diferencia falhas de CORS, interferência do Cloudflare, rotas não implementadas (404),
                  autenticação (401/403) e formato de resposta/validação JSON (422) no backend Laravel.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunDiagnostics}
                disabled={isRunningDiag}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#DE1F2A] text-white text-xs font-bold rounded-2xl hover:bg-[#C51620] transition shadow-xs disabled:opacity-50 shrink-0"
              >
                {isRunningDiag ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Testando chamadas...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    <span>Executar Diagnóstico Agora</span>
                  </>
                )}
              </button>
            </div>

            {/* Informações da Configuração */}
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs flex flex-wrap gap-4 text-gray-600 font-mono">
              <div>
                <span className="text-gray-400">API URL:</span> {API_BASE_URL}
              </div>
              <div>
                <span className="text-gray-400">Mock Mode:</span> {USE_MOCK_DATA ? 'true (Mocks Ativos)' : 'false (API Real)'}
              </div>
            </div>

            {/* Resultados dos Testes */}
            {diagResults.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Resultados das 5 Operações do placesApi:
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {diagResults.map((res, i) => {
                    const isOk = res.status === 'ok';
                    return (
                      <div
                        key={i}
                        className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          isOk ? 'bg-emerald-50/60 border-emerald-200' : 'bg-red-50/60 border-red-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-xs font-mono">{res.methodName}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadge(
                                res.category
                              )}`}
                            >
                              {res.category || (isOk ? 'SUCESSO' : 'ERRO')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{res.message}</p>
                          {res.technicalDetails && (
                            <p className="text-[11px] text-gray-400 mt-0.5">{res.technicalDetails}</p>
                          )}
                        </div>

                        <div className="text-[11px] text-gray-400 font-mono shrink-0">
                          {res.endpoint} {res.httpStatus ? `• HTTP ${res.httpStatus}` : ''} • {res.durationMs}ms
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAIS */}
      <PlaceFormModal
        isOpen={isPlaceModalOpen}
        onClose={() => {
          setIsPlaceModalOpen(false);
          setEditingPlace(null);
        }}
        onSave={handleSavePlace}
        place={editingPlace}
        cities={cities}
        categories={categories}
      />

      <EventFormModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        event={editingEvent}
        cities={cities}
        categories={categories}
        places={places}
      />

      <RejectClaimModal
        isOpen={!!rejectingClaim}
        onClose={() => setRejectingClaim(null)}
        onConfirm={handleConfirmRejectClaim}
        placeName={rejectingClaim?.place_name}
        userName={rejectingClaim?.user_name}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.title || ''}
        itemType={deleteTarget?.type || 'local'}
        isDeleting={isDeleting}
      />
    </div>
  );
};
