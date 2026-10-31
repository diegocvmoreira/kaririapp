import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { KaririLogo } from './KaririLogo';
import { X, Home, Compass, Map, Heart, PlusCircle, User, Shield, Cookie, FileText } from 'lucide-react';

interface MobileOffCanvasMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileOffCanvasMenu: React.FC<MobileOffCanvasMenuProps> = ({ isOpen, onClose }) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const primaryLinks = [
    { to: '/', label: 'Início', icon: Home },
    { to: '/explorar', label: 'Explorar locais e eventos', icon: Compass },
    { to: '/mapa', label: 'Mapa do Cariri', icon: Map },
    { to: '/favoritos', label: 'Meus salvos', icon: Heart },
    { to: '/locais/novo', label: 'Sugerir um local', icon: PlusCircle },
    { to: '/eventos/novo', label: 'Sugerir um evento', icon: PlusCircle },
    { to: '/perfil', label: 'Meu perfil', icon: User },
  ];

  return (
    <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Menu principal">
      <button type="button" className="absolute inset-0 w-full bg-black/50" onClick={onClose} aria-label="Fechar menu" />
      <aside className="absolute inset-y-0 left-0 w-[min(22rem,88vw)] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <KaririLogo size="sm" />
          <button ref={closeRef} type="button" onClick={onClose} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100" aria-label="Fechar menu">
            <X className="w-5 h-5" />
          </button>
        </header>
        <nav className="p-4 space-y-1 overflow-y-auto" aria-label="Navegação principal mobile">
          <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-wider text-gray-400">Navegação</p>
          {primaryLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-[#FDE8E9] hover:text-[#DE1F2A]">
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          ))}
          <div className="my-4 border-t border-gray-100" />
          <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-wider text-gray-400">Informações</p>
          <Link to="/privacidade" onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-600 hover:bg-gray-50"><FileText className="w-5 h-5" />Privacidade</Link>
          <Link to="/cookies" onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-600 hover:bg-gray-50"><Cookie className="w-5 h-5" />Cookies</Link>
          <Link to="/termos" onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-600 hover:bg-gray-50"><Shield className="w-5 h-5" />Termos de uso</Link>
        </nav>
        <footer className="mt-auto px-5 py-4 border-t border-gray-100 text-[11px] text-gray-400">Guia digital e descoberta no Cariri Cearense</footer>
      </aside>
    </div>
  );
};
