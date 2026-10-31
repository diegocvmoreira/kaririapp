import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Map, Heart, User } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext';

export const BottomNavigation: React.FC = () => {
  const { favoriteIds, favoriteEventIds } = useFavorites();
  const totalSavedCount = favoriteIds.length + (favoriteEventIds?.length || 0);

  const navItems = [
    { label: 'Início', to: '/', icon: Home },
    { label: 'Explorar', to: '/explorar', icon: Compass },
    { label: 'Mapa', to: '/mapa', icon: Map },
    {
      label: 'Salvos',
      to: '/favoritos',
      icon: Heart,
      badge: totalSavedCount > 0 ? totalSavedCount : undefined,
    },
    { label: 'Perfil', to: '/perfil', icon: User },
  ];

  return (
    <nav
      aria-label="Navegação inferior mobile"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 px-2 py-1 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center min-h-[44px] min-w-[48px] py-1 px-2 rounded-2xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#DE1F2A] outline-none ${
                  isActive
                    ? 'text-[#DE1F2A] font-bold'
                    : 'text-gray-600 hover:text-gray-900 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        isActive ? 'scale-110 stroke-[2.4px]' : 'stroke-[1.8px]'
                      }`}
                    />
                    {item.badge !== undefined && (
                      <span className="absolute -top-1 -right-2 bg-[#DE1F2A] text-white text-[9px] font-bold px-1 rounded-full min-w-3.5 h-3.5 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 w-1.5 h-1.5 bg-[#DE1F2A] rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
