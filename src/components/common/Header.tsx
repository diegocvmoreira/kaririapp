import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { KaririLogo } from './KaririLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { useCity } from '../../context/CityContext';
import { useAuth } from '../../context/AuthContext';
import {
  MapPin,
  ChevronDown,
  User as UserIcon,
  Search,
  Plus,
  Building2,
  Calendar,
  X,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { cities, selectedCitySlug, setSelectedCitySlug, selectedCity, isLoading, error } = useCity();
  const { user, isAuthenticated } = useAuth();
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const contributeDropdownRef = useRef<HTMLDivElement>(null);

  // Fecha dropdowns com clique fora ou tecla Escape
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setIsCityDropdownOpen(false);
      }
      if (contributeDropdownRef.current && !contributeDropdownRef.current.contains(e.target as Node)) {
        setIsContributeOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCityDropdownOpen(false);
        setIsContributeOpen(false);
      }
      // Atalho global ⌘K / Ctrl+K para busca rápida
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('/explorar');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  // Fecha dropdowns na troca de rota
  useEffect(() => {
    setIsCityDropdownOpen(false);
    setIsContributeOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Início', to: '/' },
    { label: 'Explorar', to: '/explorar' },
    { label: 'Mapa', to: '/mapa' },
    { label: 'Salvos', to: '/favoritos' },
  ];

  const isCityFiltered = selectedCitySlug !== 'all' && Boolean(selectedCity);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Brand Logo & Persistent City Filter */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className="flex items-center focus-visible:ring-2 focus-visible:ring-[#DE1F2A] rounded-xl outline-none"
            aria-label="Kariri.app Início"
          >
            <KaririLogo size="md" />
          </Link>

          {/* Persistent City selector with clear Active Filter state */}
          <div className="relative" ref={cityDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none ${
                isCityFiltered
                  ? 'bg-[#FDE8E9] text-[#DE1F2A] border border-[#DE1F2A]/30 shadow-2xs'
                  : 'bg-gray-100/90 hover:bg-gray-200/80 text-gray-800'
              }`}
              aria-expanded={isCityDropdownOpen}
              aria-haspopup="listbox"
              aria-label={`Cidade selecionada: ${selectedCity ? selectedCity.name : 'Todo o Cariri'}. Clique para alterar.`}
            >
              <MapPin className={`w-3.5 h-3.5 ${isCityFiltered ? 'text-[#DE1F2A]' : 'text-gray-500'}`} />
              <span className="truncate max-w-[100px] sm:max-w-[140px]">
                {selectedCity ? selectedCity.name : 'Todo o Cariri'}
              </span>
              {isCityFiltered && (
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#DE1F2A]" title="Filtro de cidade ativo" />
              )}
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>

            {isCityDropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                role="listbox"
              >
                <div className="px-3 pb-1.5 mb-1 border-b border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>Filtrar por cidade</span>
                  {isCityFiltered && (
                    <button
                      type="button"
                      onClick={() => setSelectedCitySlug('all')}
                      className="text-[#DE1F2A] hover:underline flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" />
                      <span>Limpar</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCitySlug('all')}
                  className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center justify-between hover:bg-gray-50 transition ${
                    selectedCitySlug === 'all' ? 'text-[#DE1F2A] bg-[#FDE8E9]/50' : 'text-gray-700'
                  }`}
                >
                  <span>Todo o Cariri (Sem filtro)</span>
                  {selectedCitySlug === 'all' && <span className="w-2 h-2 rounded-full bg-[#DE1F2A]" />}
                </button>

                {isLoading && (
                  <div className="px-4 py-2 text-[11px] text-gray-400">
                    Carregando cidades do Cariri...
                  </div>
                )}

                {error && !isLoading && (
                  <div className="px-4 py-2 text-[11px] text-red-500">
                    Falha ao carregar cidades
                  </div>
                )}

                {cities.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCitySlug(c.slug)}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between hover:bg-gray-50 transition ${
                      selectedCitySlug === c.slug ? 'text-[#DE1F2A] font-bold bg-[#FDE8E9]/50' : 'text-gray-700'
                    }`}
                  >
                    <span>{c.name}</span>
                    {selectedCitySlug === c.slug && <span className="w-2 h-2 rounded-full bg-[#DE1F2A]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Desktop Navigation Bar + Quick Search Trigger */}
        <div className="hidden md:flex items-center gap-3">
          <nav className="flex items-center gap-1" aria-label="Navegação principal desktop">
            {navLinks.map((link) => {
              const isActive =
                link.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none ${
                    isActive
                      ? 'bg-[#1F2024] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Search Access Button */}
          <button
            type="button"
            onClick={() => navigate('/explorar')}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100/80 hover:bg-gray-200/80 rounded-xl text-xs text-gray-500 font-medium transition focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none active:scale-95"
            title="Abrir busca no Cariri (Atalho: Ctrl+K ou ⌘K)"
            aria-label="Buscar locais e eventos no Cariri"
          >
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden lg:inline text-gray-600">Buscar no Cariri...</span>
            <kbd className="hidden lg:inline-block text-[10px] bg-white border border-gray-200 text-gray-400 px-1 py-0.2 rounded font-mono shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Actions (Desktop Contribuir CTA + PWA install + User Profile / Login) */}
        <div className="flex items-center gap-2">
          {/* Desktop Contribuir CTA button */}
          <div className="relative hidden md:block" ref={contributeDropdownRef}>
            <button
              type="button"
              onClick={() => setIsContributeOpen(!isContributeOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#DE1F2A] hover:bg-[#C51620] text-white text-xs font-bold transition active:scale-95 shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#DE1F2A] outline-none"
              aria-expanded={isContributeOpen}
              aria-haspopup="true"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Contribuir</span>
              <ChevronDown className="w-3 h-3 text-white/80" />
            </button>

            {isContributeOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <Link
                  to="/locais/novo"
                  className="px-4 py-2.5 text-xs font-bold text-gray-700 hover:text-[#DE1F2A] hover:bg-gray-50 flex items-center gap-2.5 transition"
                  onClick={() => setIsContributeOpen(false)}
                >
                  <Building2 className="w-4 h-4 text-[#DE1F2A]" />
                  <div>
                    <p className="leading-tight">Cadastrar Local</p>
                    <p className="text-[10px] text-gray-400 font-normal">Restaurante, ponto turístico...</p>
                  </div>
                </Link>

                <Link
                  to="/eventos/novo"
                  className="px-4 py-2.5 text-xs font-bold text-gray-700 hover:text-[#DE1F2A] hover:bg-gray-50 flex items-center gap-2.5 transition border-t border-gray-50"
                  onClick={() => setIsContributeOpen(false)}
                >
                  <Calendar className="w-4 h-4 text-[#DE1F2A]" />
                  <div>
                    <p className="leading-tight">Cadastrar Evento</p>
                    <p className="text-[10px] text-gray-400 font-normal">Festa, festival, feira...</p>
                  </div>
                </Link>
              </div>
            )}
          </div>

          <PWAInstallButton variant="button" />

          {isAuthenticated && user ? (
            <Link
              to="/perfil"
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full hover:bg-gray-100 transition group focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none"
              title="Meu Perfil"
              aria-label={`Meu perfil: ${user.name}`}
            >
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#DE1F2A]/20 group-hover:ring-[#DE1F2A]"
              />
              <span className="hidden sm:inline text-xs font-bold text-gray-700 group-hover:text-gray-900">
                {user.name.split(' ')[0]}
              </span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none"
            >
              <UserIcon className="w-3.5 h-3.5 text-gray-600" />
              <span className="hidden sm:inline">Entrar</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
