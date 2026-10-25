import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { KaririLogo } from './KaririLogo';
import { X, Shield, Cookie, FileText, ExternalLink, MapPin } from 'lucide-react';

interface MobileOffCanvasMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileOffCanvasMenu: React.FC<MobileOffCanvasMenuProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOpenCookiePreferences = () => {
    onClose();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('kariri:open_cookie_preferences'));
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Off-canvas Drawer Panel */}
      <div
        className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col justify-between p-6 animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de informações e termos"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <KaririLogo size="sm" />
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition active:scale-95"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subtítulo do Guia */}
          <div className="py-3.5 flex items-center gap-2 text-xs text-gray-500 font-medium border-b border-gray-100">
            <span className="text-gray-300 font-bold">|</span>
            <span>Guia Digital e Descoberta no Cariri Cearense</span>
          </div>

          {/* Páginas do Rodapé */}
          <div className="mt-6 space-y-1.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 px-3 mb-2">
              Páginas Institucionais & LGPD
            </p>

            <Link
              to="/privacidade"
              onClick={onClose}
              className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold text-gray-700 hover:text-[#DE1F2A] hover:bg-gray-50 active:bg-gray-100 transition"
            >
              <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <span className="flex-1">Aviso de Privacidade</span>
            </Link>

            <Link
              to="/cookies"
              onClick={onClose}
              className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold text-gray-700 hover:text-[#DE1F2A] hover:bg-gray-50 active:bg-gray-100 transition"
            >
              <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                <Cookie className="w-4 h-4" />
              </div>
              <span className="flex-1">Política de Cookies</span>
            </Link>

            <Link
              to="/termos"
              onClick={onClose}
              className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold text-gray-700 hover:text-[#DE1F2A] hover:bg-gray-50 active:bg-gray-100 transition"
            >
              <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                <ExternalLink className="w-4 h-4" />
              </div>
              <span className="flex-1">Termos de Uso</span>
            </Link>

            <button
              type="button"
              onClick={handleOpenCookiePreferences}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold text-[#DE1F2A] hover:bg-[#FDE8E9]/40 active:bg-[#FDE8E9]/60 transition text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-[#FDE8E9] text-[#DE1F2A] flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <span className="flex-1">Preferências de Cookies</span>
            </button>
          </div>
        </div>

        {/* Rodapé interno no menu off-canvas */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#DE1F2A]" />
            <span>Crato • Juazeiro do Norte • Barbalha</span>
          </div>
          <p className="text-[11px] text-gray-400">
            © {new Date().getFullYear()} Kariri.app • Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};
