import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Settings2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getStoredConsent,
  saveConsentDecision,
  CookieConsentPreferences,
} from '../../services/consentService';
import { Link } from 'react-router-dom';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Estados dos toggles granulares (Sem caixas pré-marcadas para opcionais!)
  const [functionalityConsent, setFunctionalityConsent] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => {
    // Verifica se usuário já realizou escolha prévia
    const stored = getStoredConsent();
    if (!stored) {
      // Exibe banner após breve intervalo para não interferir na pintura inicial
      const timer = setTimeout(() => setIsVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Escuta requisição para abrir preferências de cookies a partir de qualquer link/botão no footer
  useEffect(() => {
    const handleOpenPreferences = () => {
      const stored = getStoredConsent();
      if (stored) {
        setFunctionalityConsent(stored.preferences.functionality);
        setAnalyticsConsent(stored.preferences.analytics);
        setMarketingConsent(stored.preferences.marketing);
      }
      setShowConfig(true);
      setIsVisible(true);
    };

    window.addEventListener('kariri:open_cookie_preferences', handleOpenPreferences);
    return () => {
      window.removeEventListener('kariri:open_cookie_preferences', handleOpenPreferences);
    };
  }, []);

  if (!isVisible) return null;

  // Botão 1: Aceitar todos
  const handleAcceptAll = () => {
    saveConsentDecision({
      functionality: true,
      analytics: true,
      marketing: true,
    }, 'accept_all_button');
    setIsVisible(false);
  };

  // Botão 2: Recusar opcionais (Equivalente em destaque e facilidade)
  const handleRejectOptional = () => {
    saveConsentDecision({
      functionality: false,
      analytics: false,
      marketing: false,
    }, 'reject_optional_button');
    setIsVisible(false);
  };

  // Botão 3: Salvar preferências customizadas
  const handleSaveCustom = () => {
    saveConsentDecision({
      functionality: functionalityConsent,
      analytics: analyticsConsent,
      marketing: marketingConsent,
    }, 'custom_preferences_modal');
    setIsVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 md:p-6 bg-black/40 backdrop-blur-sm flex justify-center animate-fade-in"
    >
      <div className="w-full max-w-4xl bg-white border border-gray-200/90 rounded-3xl shadow-2xl overflow-hidden text-gray-800">
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#DE1F2A] flex items-center justify-center shrink-0 border border-red-100 mt-0.5">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 id="cookie-banner-title" className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                Sua Privacidade e Controle de Cookies
              </h3>
              <p id="cookie-banner-desc" className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Utilizamos cookies e tecnologias similares para garantir o funcionamento seguro do Kariri.app.
                Com o seu consentimento, também utilizamos ferramentas para métricas anônimas de audiência e comunicação sobre novidades culturais do Cariri.
                Nenhum dado sensível ou de identificação direta (e-mail ou senha) é compartilhado com ferramentas analíticas.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-gray-500 font-medium">
                <Link to="/privacidade" className="text-[#DE1F2A] hover:underline flex items-center gap-1">
                  <span>Aviso de Privacidade</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <Link to="/cookies" className="text-[#DE1F2A] hover:underline flex items-center gap-1">
                  <span>Política de Cookies</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <Link to="/termos" className="text-gray-600 hover:underline">
                  Termos de Uso
                </Link>
              </div>
            </div>
          </div>

          {/* Painel Granular Expansível */}
          {showConfig && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 bg-gray-50/70 p-4 rounded-2xl">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Configurar Preferências Granulares (LGPD)
              </h4>

              {/* 1. Necessários (Sempre ativos) */}
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200/80">
                <div className="pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">Cookies Essenciais / Necessários</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                      Sempre Ativos
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Fornecedor: Kariri.app • Duração: Sessão • Finalidade: Autenticação segura, proteção contra CSRF e funcionamento básico da aplicação.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="w-4 h-4 text-emerald-600 rounded opacity-60 cursor-not-allowed"
                />
              </div>

              {/* 2. Funcionalidade / Preferências */}
              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200/80 cursor-pointer hover:bg-gray-50/80 transition">
                <div className="pr-4">
                  <span className="text-xs font-bold text-gray-900 block">Cookies de Funcionalidade & Preferências</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Fornecedor: Kariri.app • Duração: 30 dias • Finalidade: Guardar cidade de navegação e filtros selecionados entre sessões sem exigir login.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={functionalityConsent}
                  onChange={(e) => setFunctionalityConsent(e.target.checked)}
                  className="w-4 h-4 text-[#DE1F2A] rounded border-gray-300 focus:ring-[#DE1F2A]"
                />
              </label>

              {/* 3. Analytics (GA4) */}
              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200/80 cursor-pointer hover:bg-gray-50/80 transition">
                <div className="pr-4">
                  <span className="text-xs font-bold text-gray-900 block">Cookies de Medição & Analytics (Google Analytics 4)</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Fornecedor: Google LLC (GA4) • Duração: 14 meses • Finalidade: Estatísticas anônimas de páginas acessadas e locais mais visitados. IP mascarado e sem PII.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsConsent}
                  onChange={(e) => setAnalyticsConsent(e.target.checked)}
                  className="w-4 h-4 text-[#DE1F2A] rounded border-gray-300 focus:ring-[#DE1F2A]"
                />
              </label>

              {/* 4. Marketing & Comunicação */}
              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200/80 cursor-pointer hover:bg-gray-50/80 transition">
                <div className="pr-4">
                  <span className="text-xs font-bold text-gray-900 block">Comunicação e Campanhas Culturais</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Fornecedor: Kariri.app • Duração: 1 ano • Finalidade: Exibição de destaques de festivais e eventos conforme a região declarada.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="w-4 h-4 text-[#DE1F2A] rounded border-gray-300 focus:ring-[#DE1F2A]"
                />
              </label>
            </div>
          )}

          {/* Botões de Ação Equivalentes e Claros */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5 transition"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{showConfig ? 'Ocultar opções' : 'Configurar preferências'}</span>
              {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Botão de Recusa Opcional com destaque equivalente */}
              <button
                type="button"
                onClick={handleRejectOptional}
                className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 active:scale-98 text-xs font-bold text-gray-800 transition text-center shadow-sm"
              >
                Recusar Opcionais
              </button>

              {showConfig ? (
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black active:scale-98 text-xs font-bold text-white transition text-center shadow-sm"
                >
                  Salvar Minhas Escolhas
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-6 py-2.5 rounded-xl bg-[#DE1F2A] hover:bg-[#C51620] active:scale-98 text-xs font-bold text-white transition text-center shadow-md shadow-red-500/20"
                >
                  Aceitar Todos
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
