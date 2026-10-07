import React, { useEffect, useState } from 'react';
import { Place, EventItem, BusinessClaim, Review } from '../types';
import { placesApi } from '../services/api/places';
import { eventsApi } from '../services/api/events';
import { businessClaimsApi } from '../services/api/businessClaims';
import { setPageMeta } from '../utils/seo';
import { BackButton } from '../components/common/BackButton';
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
  Filter,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [claims, setClaims] = useState<BusinessClaim[]>([]);
  const [activeTab, setActiveTab] = useState<'claims' | 'places' | 'events'>('claims');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPageMeta({
      title: 'Painel Administrativo',
      description: 'Gestão de locais, eventos, usuários e reivindicações de empresas do Kariri.app.',
    });

    Promise.all([
      placesApi.getAll(),
      eventsApi.getAll(),
      businessClaimsApi.getAll(),
    ])
      .then(([placesData, eventsData, claimsData]) => {
        setPlaces(placesData);
        setEvents(eventsData);
        setClaims(claimsData);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleUpdateClaimStatus = async (id: number, status: BusinessClaim['status']) => {
    await businessClaimsApi.updateStatus(id, status);
    setClaims((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-in fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton fallbackTo="/perfil" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Painel Administrativo
            </h1>
            <p className="text-xs text-gray-500">
              Moderação e governança da plataforma Kariri.app
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-gray-900 text-white text-[11px] font-bold rounded-xl">
          Modo Administrador
        </span>
      </div>

      {/* 1. Indicadores Chave (Seção 30) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FDE8E9] text-[#D9262E] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-gray-900">{places.length}</span>
            <p className="text-[11px] text-gray-500">Locais Ativos</p>
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
            <span className="text-xl font-black text-gray-900">328</span>
            <p className="text-[11px] text-gray-500">Usuários na Região</p>
          </div>
        </div>
      </div>

      {/* 2. Abas de Moderação */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'claims'
              ? 'bg-[#1F2024] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>Reivindicações de Empresas</span>
          {claims.some((c) => c.status === 'pending') && (
            <span className="w-2 h-2 rounded-full bg-[#D9262E]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('places')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'places'
              ? 'bg-[#1F2024] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Gestão de Locais ({places.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'events'
              ? 'bg-[#1F2024] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Gestão de Eventos ({events.length})
        </button>
      </div>

      {/* 3. Conteúdo da Aba */}
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
            <p className="text-xs text-gray-500 text-center py-8">
              Nenhuma solicitação de empresa pendente no momento.
            </p>
          ) : (
            <div className="space-y-3">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-[#D9262E] uppercase">
                        {claim.place_name}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900">
                        {claim.user_name} ({claim.user_email})
                      </h4>
                      {claim.phone && (
                        <p className="text-xs text-gray-500 font-medium">WhatsApp: {claim.phone}</p>
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
                      <strong>Comprovante/CNPJ:</strong> {claim.proof}
                    </p>
                  )}

                  {claim.status === 'pending' && (
                    <div className="pt-1 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateClaimStatus(claim.id, 'rejected')}
                        className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rejeitar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateClaimStatus(claim.id, 'approved')}
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
          )}
        </div>
      )}

      {activeTab === 'places' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-5 space-y-3">
          <h2 className="text-base font-bold text-gray-900 mb-2">Locais Cadastrados no Guia</h2>
          <div className="divide-y divide-gray-100">
            {places.map((place) => (
              <div key={place.id} className="py-3 first:pt-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={place.cover_image}
                    alt={place.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{place.name}</h4>
                    <p className="text-[11px] text-gray-500 truncate">
                      {place.category_name} • {place.city_name} • {place.rating} ★ ({place.reviews_count} avaliações)
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold shrink-0">
                  Publicado
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-5 space-y-3">
          <h2 className="text-base font-bold text-gray-900 mb-2">Eventos na Programação</h2>
          <div className="divide-y divide-gray-100">
            {events.map((event) => (
              <div key={event.id} className="py-3 first:pt-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={event.cover_image}
                    alt={event.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{event.title}</h4>
                    <p className="text-[11px] text-gray-500 truncate">
                      {event.display_date} • {event.city_name} • {event.price_text}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold shrink-0">
                  Publicado
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
