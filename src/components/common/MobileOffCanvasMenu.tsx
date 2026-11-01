import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { KaririLogo } from './KaririLogo';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  PlusCircle,
  Shield,
  Cookie,
  FileText,
  User,
  Sparkles,
  Mail,
  HelpCircle,
  Building2,
  Calendar,
  Layers,
  ShieldCheck,
  Compass,
  Settings,
} from 'lucide-react';

interface MobileOffCanvasMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileOffCanvasMenu: React.FC<MobileOffCanvasMenuProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const asideRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Gestão de foco acessível (Focus Trap, tecla Escape e retorno de foco ao disparador)
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;

    // Foco automático inicial no botão de fechar após abertura
    const focusTimer = setTimeout(() => {
      closeRef.current?.focus();
    }, 50);

    // Bloqueio de rolagem do body com proteção para iOS Safari
    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      // Focus Trap cíclico entre o primeiro e o último elemento focável
      if (event.key === 'Tab' && asideRef.current) {
        const focusableElements = asideRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      window.removeEventListener('keydown', handleKeyDown);

      // Retorno do foco para o elemento disparador
      if (previouslyFocusedElement.current && typeof previouslyFocusedElement.current.focus === 'function') {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOpenCookiePreferences = () => {
    onClose();
    window.dispatchEvent(new CustomEvent('kariri:open_cookie_preferences'));
  };

  return (
    <div
      className="fixed inset-0 z-[60] md:hidden flex"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de opções e navegação institucional"
    >
      {/* Backdrop com fechamento ao toque e alvo de clique acessível */}
      <button
        type="button"
        className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-label="Fechar menu"
      />

      {/* Painel Off-Canvas */}
      <aside
        ref={asideRef}
        className="relative z-10 w-[min(22rem,86vw)] bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-200 overflow-hidden"
      >
        {/* Cabeçalho do Menu */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white shrink-0">
          <KaririLogo size="sm" />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none"
            aria-label="Fechar menu lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Conteúdo com rolagem suave em telas de qualquer altura */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5 text-gray-800">
          {/* Card de Identificação do Usuário */}
          {isAuthenticated && user ? (
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
              <div className="flex items-center gap-3">
                <img
                  src={
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=DE1F2A&color=fff&size=80`
                  }
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-[#DE1F2A]/20"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200/60 flex items-center gap-2">
                <Link
                  to="/minhas-contribuicoes"
                  onClick={onClose}
                  className="flex-1 py-1.5 px-2 bg-white text-gray-700 hover:text-[#DE1F2A] border border-gray-200 rounded-xl text-[11px] font-bold text-center transition"
                >
                  Minhas Contribuições
                </Link>
                <Link
                  to="/perfil"
                  onClick={onClose}
                  className="py-1.5 px-2.5 bg-gray-200/70 text-gray-800 hover:bg-gray-200 rounded-xl text-[11px] font-bold transition"
                >
                  Perfil
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-[#FDE8E9]/60 border border-[#DE1F2A]/20 space-y-2.5">
              <div className="flex items-center gap-2 text-[#DE1F2A]">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold">Faça parte do Kariri.app</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Entre na sua conta para salvar favoritos, avaliar locais e colaborar com novidades culturais.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="flex-1 py-2 px-3 bg-[#DE1F2A] hover:bg-[#C51620] text-white text-xs font-bold rounded-xl text-center shadow-xs transition"
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  onClick={onClose}
                  className="flex-1 py-2 px-3 bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl text-center transition"
                >
                  Cadastrar
                </Link>
              </div>
            </div>
          )}

          {/* Seção 1: Contribuir */}
          <section aria-labelledby="heading-contribute">
            <h3 id="heading-contribute" className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400">
              Contribuir com o Guia
            </h3>
            <div className="space-y-1">
              <Link
                to="/locais/novo"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-[#FDE8E9] hover:text-[#DE1F2A] transition"
              >
                <Building2 className="w-4 h-4 text-[#DE1F2A] shrink-0" />
                <span>Sugerir um Local</span>
              </Link>
              <Link
                to="/eventos/novo"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-[#FDE8E9] hover:text-[#DE1F2A] transition"
              >
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Sugerir um Evento</span>
              </Link>
            </div>
          </section>

          {/* Seção 2: Categorias Principais */}
          <section aria-labelledby="heading-categories">
            <div className="flex items-center justify-between px-3 pb-1.5">
              <h3 id="heading-categories" className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Categorias no Cariri
              </h3>
              <Link
                to="/explorar"
                onClick={onClose}
                className="text-[10px] font-bold text-[#DE1F2A] hover:underline"
              >
                Ver todas
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-1.5 px-1">
              <Link
                to="/categorias/gastronomia"
                onClick={onClose}
                className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-medium text-gray-700 transition"
              >
                Gastronomia
              </Link>
              <Link
                to="/categorias/cultura-arte"
                onClick={onClose}
                className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-medium text-gray-700 transition"
              >
                Cultura & Arte
              </Link>
              <Link
                to="/categorias/turismo"
                onClick={onClose}
                className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-medium text-gray-700 transition"
              >
                Turismo
              </Link>
              <Link
                to="/categorias/natureza-e-trilhas"
                onClick={onClose}
                className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs font-medium text-gray-700 transition"
              >
                Natureza & Trilhas
              </Link>
            </div>
          </section>

          {/* Seção 3: Informações Institucionais & LGPD */}
          <section aria-labelledby="heading-info">
            <h3 id="heading-info" className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400">
              Institucional & Privacidade
            </h3>
            <div className="space-y-1">
              <a
                href="mailto:contato@kariri.app.br"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-50 transition"
              >
                <HelpCircle className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Dúvidas & Contato</span>
              </a>

              <Link
                to="/privacidade"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-50 transition"
              >
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Aviso de Privacidade</span>
              </Link>

              <Link
                to="/cookies"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-50 transition"
              >
                <Cookie className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Política de Cookies</span>
              </Link>

              <Link
                to="/termos"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-50 transition"
              >
                <Shield className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Termos de Uso</span>
              </Link>

              <button
                type="button"
                onClick={handleOpenCookiePreferences}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#DE1F2A] hover:bg-[#FDE8E9]/60 transition font-medium text-left"
              >
                <Settings className="w-4 h-4 text-[#DE1F2A] shrink-0" />
                <span>Preferências de Cookies</span>
              </button>

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/70 transition"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Painel Administrativo</span>
                </Link>
              )}
            </div>
          </section>
        </div>

        {/* Rodapé Institucional do Off-Canvas */}
        <footer className="p-4 border-t border-gray-100 bg-gray-50/70 text-[10px] text-gray-400 leading-tight shrink-0">
          <p className="font-semibold text-gray-600">Kariri.app • Guia Digital</p>
          <p className="mt-0.5">Crato, Juazeiro do Norte e Barbalha</p>
        </footer>
      </aside>
    </div>
  );
};
