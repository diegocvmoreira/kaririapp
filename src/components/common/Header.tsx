import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { KaririLogo } from './KaririLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { useCity } from '../../context/CityContext';
import { useAuth } from '../../context/AuthContext';
import { MapPin, ChevronDown, User as UserIcon } from 'lucide-react';

export const Header: React.FC = () => {
  const { cities, selectedCitySlug, setSelectedCitySlug, selectedCity, isLoading, error } = useCity();
  const { user, isAuthenticated } = useAuth();
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const location = useLocation();

  // Navigation Links for Desktop Topbar
  const navLinks = [
    { label: 'Início', to: '/' },
    { label: 'Explorar', to: '/explorar' },
    { label: 'Mapa', to: '/mapa' },
    { label: 'Favoritos', to: '/favoritos' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center focus:outline-none" aria-label="Kariri.app Início">
            <KaririLogo size="md" />
          </Link>

          {/* City selector pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100/80 hover:bg-gray-200/70 text-gray-800 text-xs font-semibold transition active:scale-95"
              aria-expanded={isCityDropdownOpen}
              aria-haspopup="listbox"
            >
              <MapPin className="w-3.5 h-3.5 text-[#DE1F2A]" />
              <span className="truncate max-w-[110px] sm:max-w-none">
                {selectedCity ? selectedCity.name : 'Todo o Cariri'}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>

            {isCityDropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setIsCityDropdownOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCitySlug('all')}
                  className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between hover:bg-gray-50 ${
                    selectedCitySlug === 'all' ? 'text-[#DE1F2A] bg-[#FDE8E9]/50' : 'text-gray-700'
                  }`}
                >
                  <span>Todo o Cariri</span>
                  {selectedCitySlug === 'all' && <span className="w-1.5 h-1.5 rounded-full bg-[#DE1F2A]" />}
                </button>

                {isLoading && (
                  <div className="px-4 py-2 text-[11px] text-gray-400">
                    Carregando cidades...
                  </div>
                )}

                {error && !isLoading && (
                  <div className="px-4 py-2 text-[11px] text-red-500">
                    Falha ao carregar cidades
                  </div>
                )}

                {!isLoading && !error && cities.length === 0 && (
                  <div className="px-4 py-2 text-[11px] text-gray-400">
                    Nenhuma cidade cadastrada
                  </div>
                )}

                {cities.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCitySlug(c.slug)}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between hover:bg-gray-50 ${
                      selectedCitySlug === c.slug ? 'text-[#DE1F2A] bg-[#FDE8E9]/50' : 'text-gray-700'
                    }`}
                  >
                    <span>{c.name}</span>
                    {selectedCitySlug === c.slug && <span className="w-1.5 h-1.5 rounded-full bg-[#DE1F2A]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Desktop Navigation Bar */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              link.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#000000] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions (PWA install + User Profile) */}
        <div className="flex items-center gap-2.5">
          <PWAInstallButton variant="button" />

          {isAuthenticated && user ? (
            <Link
              to="/perfil"
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full hover:bg-gray-100 transition group"
              title="Meu Perfil"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Entrar</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
