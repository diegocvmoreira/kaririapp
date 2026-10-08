import React, { useEffect, useState } from 'react';
import { Place, EventItem, BusinessClaim } from '../types';
import { placesApi } from '../services/api/places';
import { eventsApi } from '../services/api/events';
import { businessClaimsApi } from '../services/api/businessClaims';
import {
  runPlacesDiagnostics,
  EndpointDiagnosticResult,
  ApiDiagnosticCategory,
} from '../services/api/diagnostics';
import { API_BASE_URL, USE_MOCK_DATA } from '../services/api/config';
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
  Activity,
  Play,
  Server,
  Terminal,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [claims, setClaims] = useState<BusinessClaim[]>([]);
  const [activeTab, setActiveTab] = useState<'claims' | 'places' | 'events' | 'diagnostics'>('claims');
  const [isLoading, setIsLoading] = useState(true);

  // Diagnostics runner state
  const [diagResults, setDiagResults] = useState<EndpointDiagnosticResult[]>([]);
  const [isRunningDiag, setIsRunningDiag] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: 'Painel Administrativo',
      description: 'Gestão de locais, eventos, usuários e reivindicações de empresas do Kariri.app.',
    });

    Promise.allSettled([
      placesApi.getAll(),
      eventsApi.getAll(),
      businessClaimsApi.getAll(),
    ]).then(([placesRes, eventsRes, claimsRes]) => {
      if (placesRes.status === 'fulfilled') setPlaces(placesRes.value);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value);
      if (claimsRes.status === 'fulfilled') setClaims(claimsRes.value);
      setIsLoading(false);
    });
  }, []);

  const handleUpdateClaimStatus = async (id: number, status: BusinessClaim['status']) => {
    await businessClaimsApi.updateStatus(id, status);
    setClaims((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  const handleRunDiagnostics = async () => {
    setIsRunningDiag(true);
    try {
      const results = await runPlacesDiagnostics();
      setDiagResults(results);
    } finally {
      setIsRunningDiag(false);
    }
  };

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

        <button
          type="button"
          onClick={() => setActiveTab('diagnostics')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'diagnostics'
              ? 'bg-[#D9262E] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Diagnóstico da API</span>
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

      {/* 4. Aba de Diagnóstico Técnico da Integração (placesApi) */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-4">
          {/* Card de Configuração do Ambiente */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#D9262E] uppercase tracking-wider block">
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
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#D9262E] text-white text-xs font-bold rounded-2xl hover:bg-[#b81d24] transition shadow-xs disabled:opacity-50 shrink-0"
              >
                {isRunningDiag ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Testando chamadas...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Executar Diagnóstico dos 5 Métodos</span>
                  </>
                )}
              </button>
            </div>

            {/* Informações da API configurada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100 text-xs">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  URL Base da API Laravel
                </span>
                <code className="text-[11px] font-mono text-gray-800 break-all">
                  {API_BASE_URL}
                </code>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Modo de Dados (VITE_USE_MOCK_DATA)
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      USE_MOCK_DATA ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="font-semibold text-gray-800">
                    {USE_MOCK_DATA ? 'Mocks Ativos (Local)' : 'API Real Ativa (Sem fallback silencioso)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Resultados do Diagnóstico */}
          {diagResults.length > 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">
                  Relatório dos 5 Métodos da placesApi
                </h3>
                <span className="text-xs text-gray-400">
                  {diagResults.filter((r) => r.status === 'ok').length} de {diagResults.length} operacionais
                </span>
              </div>

              <div className="space-y-3">
                {diagResults.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border text-xs transition ${
                      item.status === 'ok'
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-red-50/40 border-red-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200/60">
                      <div className="flex items-center gap-2">
                        {item.status === 'ok' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#D9262E] shrink-0" />
                        )}
                        <span className="font-bold text-gray-900 font-mono text-xs">
                          {item.methodName}
                        </span>
                        <code className="text-[10px] bg-white px-2 py-0.5 rounded-md text-gray-500 border border-gray-200 font-mono">
                          {item.endpoint}
                        </code>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.category && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getCategoryBadge(
                              item.category
                            )}`}
                          >
                            {item.category}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500 font-mono">
                          {item.durationMs}ms
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.status === 'ok'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          Status {item.httpStatus || 0}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      <p className="text-gray-800 font-medium">{item.message}</p>
                      {item.technicalDetails && (
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Causa Técnica Identificada:
                          </span>
                          <p className="text-gray-700 font-mono text-[11px] mt-0.5 leading-relaxed break-words bg-white/70 p-2 rounded-xl border border-gray-200/70">
                            {item.technicalDetails}
                          </p>
                        </div>
                      )}
                      {item.suggestedAction && (
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Ação Recomendada para o Backend Laravel:
                          </span>
                          <p className="text-gray-600 text-[11px] mt-0.5 leading-relaxed">
                            {item.suggestedAction}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-8 text-center">
              <Server className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-900">
                Nenhum diagnóstico executado ainda
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                Clique no botão acima para disparar o teste nas 5 chamadas de locais e verificar a conectividade com o Laravel.
              </p>
              <button
                type="button"
                onClick={handleRunDiagnostics}
                disabled={isRunningDiag}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-black transition active:scale-95"
              >
                <Play className="w-3.5 h-3.5" />
                Iniciar Verificação
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
