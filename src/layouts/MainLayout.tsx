import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { BottomNavigation } from '../components/common/BottomNavigation';
import { FloatingActionButton } from '../components/common/FloatingActionButton';
import { KaririLogo } from '../components/common/KaririLogo';
import { CookieConsentBanner } from '../components/common/CookieConsentBanner';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useServiceWorkerUpdate } from '../hooks/useServiceWorkerUpdate';
import { WifiOff, Shield, RefreshCw } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { hasUpdate, updateApp, hasCachedData } = useServiceWorkerUpdate();

  const handleOpenCookiePreferences = () => {
    window.dispatchEvent(new CustomEvent('kariri:open_cookie_preferences'));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#000000] selection:bg-[#DE1F2A] selection:text-white pb-20 md:pb-0">
      {/* Aviso de Nova Versão Disponível */}
      {hasUpdate && (
        <div className="bg-gray-900 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-50 animate-fade-in shadow-md">
          <RefreshCw className="w-3.5 h-3.5 text-[#DE1F2A] animate-spin" />
          <span>Nova versão disponível</span>
          <button
            type="button"
            onClick={updateApp}
            className="ml-2 px-2.5 py-0.5 rounded-lg bg-[#DE1F2A] hover:bg-[#C51620] text-white text-[11px] font-bold transition"
          >
            Atualizar
          </button>
        </div>
      )}

      {/* Offline Toast Honesto */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff className="w-3.5 h-3.5" />
          <span>
            {hasCachedData
              ? 'Modo Offline: Visualizando dados armazenados no dispositivo.'
              : 'Você está offline. Algumas informações podem não estar disponíveis.'}
          </span>
        </div>
      )}

      {/* Main Top Header */}
      <Header />

      {/* Page Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>

      {/* Rodapé Desktop: mantido em resoluções maiores (desktop), removido no mobile (hidden md:block) */}
      <footer className="hidden md:block w-full border-t border-gray-200/80 bg-white/95 backdrop-blur-xs py-6 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-3">
            <KaririLogo size="xs" />
            <span className="text-gray-300 font-bold">|</span>
            <span className="font-semibold text-gray-800">
              Guia Digital e Descoberta no Cariri Cearense
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <Link to="/privacidade" className="hover:text-[#DE1F2A] transition font-medium">
              Aviso de Privacidade
            </Link>
            <Link to="/cookies" className="hover:text-[#DE1F2A] transition font-medium">
              Política de Cookies
            </Link>
            <Link to="/termos" className="hover:text-[#DE1F2A] transition font-medium">
              Termos de Uso
            </Link>
            <button
              type="button"
              onClick={handleOpenCookiePreferences}
              className="text-[#DE1F2A] hover:underline font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Preferências de Cookies</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <div>
            LGPD (Lei 13.709/2018) • Canal DPO: <a href="mailto:privacidade@kariri.app.br" className="text-gray-500 hover:text-[#DE1F2A] font-semibold underline">privacidade@kariri.app.br</a>
          </div>
          <div>
            © {new Date().getFullYear()} Kariri.app • Crato, Juazeiro do Norte e Barbalha
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Fixed Navigation */}
      <BottomNavigation />

      {/* Floating Action Button (+ Novo Local / Novo Evento) */}
      <FloatingActionButton />

      {/* Cookie Consent Banner (Google Consent Mode v2 + LGPD) */}
      <CookieConsentBanner />
    </div>
  );
};

