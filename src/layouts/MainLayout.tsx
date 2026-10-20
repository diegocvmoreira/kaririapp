import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { BottomNavigation } from '../components/common/BottomNavigation';
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

      {/* Desktop / Tablet Minimal Footer with LGPD Compliance Links */}
      <footer className="border-t border-gray-200/80 bg-white/70 py-6 px-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <KaririLogo size="xs" />
            <span className="text-gray-300">|</span>
            <span>Guia Digital e Descoberta no Cariri Cearense</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link to="/privacidade" className="hover:text-[#DE1F2A] transition">
              Aviso de Privacidade
            </Link>
            <Link to="/cookies" className="hover:text-[#DE1F2A] transition">
              Política de Cookies
            </Link>
            <Link to="/termos" className="hover:text-[#DE1F2A] transition">
              Termos de Uso
            </Link>
            <button
              type="button"
              onClick={handleOpenCookiePreferences}
              className="text-[#DE1F2A] hover:underline font-semibold flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Preferências de Cookies</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Fixed Navigation */}
      <BottomNavigation />

      {/* Cookie Consent Banner (Google Consent Mode v2 + LGPD) */}
      <CookieConsentBanner />
    </div>
  );
};

