import React, { useState, useEffect } from 'react';
import { Shield, Lock, FileText, CheckCircle2, RotateCcw, AlertTriangle, Mail } from 'lucide-react';
import {
  getStoredConsent,
  saveConsentDecision,
  revokeOptionalConsent,
  CookieConsentPreferences,
} from '../services/consentService';

export const LegalPrivacyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'cookies' | 'terms'>('privacy');
  const [consentPrefs, setConsentPrefs] = useState<CookieConsentPreferences>({
    necessary: true,
    functionality: false,
    analytics: false,
    marketing: false,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      setConsentPrefs(stored.preferences);
    }
  }, []);

  const handleSaveCookiePrefs = () => {
    saveConsentDecision({
      functionality: consentPrefs.functionality,
      analytics: consentPrefs.analytics,
      marketing: consentPrefs.marketing,
    }, 'legal_privacy_page');
    setSuccessMessage('Suas preferências de privacidade foram atualizadas com sucesso.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleRevokeAll = () => {
    const updated = revokeOptionalConsent();
    setConsentPrefs(updated.preferences);
    setSuccessMessage('Todos os cookies opcionais foram revogados.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2 border-b border-gray-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#DE1F2A] text-xs font-bold uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5" />
          <span>LGPD & Transparência</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Privacidade, Termos e Cookies do Kariri.app
        </h1>
        <p className="text-sm text-gray-600">
          Versão 2026.1 • Em vigor para Crato, Juazeiro do Norte, Barbalha e usuários de todo o Brasil e exterior.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-2 sm:gap-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('privacy')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'border-[#DE1F2A] text-[#DE1F2A]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Aviso de Privacidade (LGPD)
        </button>
        <button
          onClick={() => setActiveTab('cookies')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'cookies'
              ? 'border-[#DE1F2A] text-[#DE1F2A]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Central de Preferências de Cookies
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'terms'
              ? 'border-[#DE1F2A] text-[#DE1F2A]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Termos de Uso
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* CONTEÚDO: AVISO DE PRIVACIDADE */}
      {activeTab === 'privacy' && (
        <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm">
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">1. Controlador dos Dados & Encarregado (DPO)</h2>
            <p>
              O <strong>Kariri.app</strong> atua como controlador de dados pessoais coletados nesta plataforma.
              Para exercer seus direitos garantidos pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD) ou falar com nosso Encarregado pelo Tratamento de Dados Pessoais (DPO):
            </p>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 inline-block text-xs font-mono">
              E-mail de Contato / DPO: <strong className="text-gray-900">privacidade@kariri.app.br</strong>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">2. Categorias de Dados Coletados & Finalidades</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li>
                <strong>Dados Cadastrais de Acesso:</strong> Nome e e-mail. Finalidade: Autenticação segura, perfil de usuário e prevenção a fraudes (Base legal: Execução de contrato).
              </li>
              <li>
                <strong>Cidade Natal (Opcional):</strong> Município de nascimento informado voluntariamente. Finalidade: Perfil cadastral e pertencimento cultural. Pode ser qualquer cidade do Brasil ou exterior. <em>Nunca é utilizada para inferir localização atual ou presença física de GPS.</em>
              </li>
              <li>
                <strong>Cidade Atual (Opcional):</strong> Localidade de residência informada separadamente. Finalidade: Personalização regional da interface e sugestões de eventos relevantes quando autorizada.
              </li>
              <li>
                <strong>Geolocalização do Dispositivo:</strong> Solicitada pontualmente apenas no mapa após consentimento explícito. Não realizamos rastreamento contínuo em segundo plano.
              </li>
              <li>
                <strong>Consentimento de Marketing:</strong> Registrado separadamente no cadastro com carimbo de data/hora e revogável a qualquer momento.
              </li>
              <li>
                <strong>Avaliações e Reivindicações (Claims):</strong> Armazenadas para moderação editorial da comunidade e proteção de identidade dos estabelecimentos.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">3. Não envio de PII para Ferramentas Analíticas</h2>
            <p>
              Nosso sistema implementa um filtro de blindagem técnica em conformidade com o Google Consent Mode v2:
              sob nenhuma circunstância dados de identificação pessoal (e-mail, senha, telefone, textos de reviews ou documentos de empresas) são repassados ao Google Analytics ou plataformas de anúncios.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">4. Direitos do Titular de Dados</h2>
            <p>
              Você pode a qualquer momento solicitar: confirmação de tratamento, acesso aos dados, correção de informações incompletas ou inexatas, anonimização, bloqueio, eliminação ou revogação de consentimento através do canal oficial de privacidade.
            </p>
          </section>
        </div>
      )}

      {/* CONTEÚDO: CENTRAL DE COOKIES */}
      {activeTab === 'cookies' && (
        <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              Gerenciar Preferências de Cookies e Tecnologias de Rastreio
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Conforme as diretrizes da ANPD e LGPD, cookies opcionais permanecem desativados até que você escolha ativá-los.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {/* Necessários */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-gray-900">Cookies Necessários (Sessão & Segurança)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Sempre Ativos
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Essenciais para autenticação de conta, integridade de tokens e segurança de requisições. Não podem ser desativados.
                </p>
              </div>
              <input type="checkbox" checked disabled className="w-4 h-4 text-emerald-600 opacity-60" />
            </div>

            {/* Funcionalidade */}
            <label className="p-4 rounded-2xl border border-gray-200 hover:border-gray-300 bg-white flex items-center justify-between cursor-pointer transition">
              <div>
                <span className="text-xs sm:text-sm font-bold text-gray-900 block">Cookies de Funcionalidade & Cidade</span>
                <p className="text-xs text-gray-500 mt-1">
                  Guardam sua cidade de preferência no Cariri e filtros para evitar reconfigurações manuais.
                </p>
              </div>
              <input
                type="checkbox"
                checked={consentPrefs.functionality}
                onChange={(e) => setConsentPrefs({ ...consentPrefs, functionality: e.target.checked })}
                className="w-4 h-4 text-[#DE1F2A] rounded border-gray-300 focus:ring-[#DE1F2A]"
              />
            </label>

            {/* Analytics */}
            <label className="p-4 rounded-2xl border border-gray-200 hover:border-gray-300 bg-white flex items-center justify-between cursor-pointer transition">
              <div>
                <span className="text-xs sm:text-sm font-bold text-gray-900 block">Medição & Google Analytics 4 (Sem PII)</span>
                <p className="text-xs text-gray-500 mt-1">
                  Métricas anônimas e agregadas de páginas e locais visitados. IP mascarado e Google Consent Mode ativo.
                </p>
              </div>
              <input
                type="checkbox"
                checked={consentPrefs.analytics}
                onChange={(e) => setConsentPrefs({ ...consentPrefs, analytics: e.target.checked })}
                className="w-4 h-4 text-[#DE1F2A] rounded border-gray-300 focus:ring-[#DE1F2A]"
              />
            </label>

            {/* Marketing */}
            <label className="p-4 rounded-2xl border border-gray-200 hover:border-gray-300 bg-white flex items-center justify-between cursor-pointer transition">
              <div>
                <span className="text-xs sm:text-sm font-bold text-gray-900 block">Marketing & Campanhas Regionais</span>
                <p className="text-xs text-gray-500 mt-1">
                  Permite exibir promoções e novidades culturais alinhadas aos municípios do Cariri cearense.
                </p>
              </div>
              <input
                type="checkbox"
                checked={consentPrefs.marketing}
                onChange={(e) => setConsentPrefs({ ...consentPrefs, marketing: e.target.checked })}
                className="w-4 h-4 text-[#DE1F2A] rounded border-gray-300 focus:ring-[#DE1F2A]"
              />
            </label>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleRevokeAll}
              className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Revogar Todos os Opcionais</span>
            </button>

            <button
              type="button"
              onClick={handleSaveCookiePrefs}
              className="px-6 py-2.5 rounded-xl bg-[#DE1F2A] hover:bg-[#C51620] text-xs font-bold text-white shadow-md shadow-red-500/20"
            >
              Salvar Minhas Preferências
            </button>
          </div>
        </div>
      )}

      {/* CONTEÚDO: TERMOS DE USO */}
      {activeTab === 'terms' && (
        <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm">
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">1. Natureza do Serviço</h2>
            <p>
              O Kariri.app é uma plataforma colaborativa de descoberta local, turismo, eventos culturais e gastronomia focada nos municípios da Região Metropolitana do Cariri cearense (Crato, Juazeiro do Norte, Barbalha e cidades vizinhas).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">2. Diretrizes da Comunidade e Avaliações</h2>
            <p>
              Todas as avaliações publicadas por usuários devem refletir experiências reais de consumo ou visitação. É proibida a postagem de conteúdo calunioso, difamatório, ofensivo ou publicitário não autorizado.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">3. Reivindicação de Estabelecimentos (Claims)</h2>
            <p>
              Proprietários e gestores de locais podem reivindicar seus negócios mediante apresentação de comprovante de titularidade para atualização de cardápio, horários e contato.
            </p>
          </section>
        </div>
      )}
    </div>
  );
};
