import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useCity } from '../context/CityContext';
import { PWAInstallButton } from '../components/common/PWAInstallButton';
import { setPageMeta } from '../utils/seo';
import {
  User,
  Heart,
  Settings,
  LogOut,
  MapPin,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  LogIn,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { favoriteIds } = useFavorites();
  const { cities } = useCity();
  const navigate = useNavigate();

  React.useEffect(() => {
    setPageMeta({
      title: 'Meu Perfil',
      description: 'Gerencie sua conta, preferências e histórico de descobertas no Kariri.',
    });
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isAdmin = user?.role === 'admin' && (user?.status === 'active' || !user?.status);

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* 1. Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="relative">
          <img
            src={
              user?.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
            }
            alt={user?.name || 'Visitante'}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-[#DE1F2A]/20"
          />
          {isAuthenticated && (
            <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" />
          )}
        </div>

        <div className="flex-1">
          {isAuthenticated && user ? (
            <>
              <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-1 text-xs text-[#DE1F2A] font-semibold mt-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>{user.city_preference || 'Crato, CE'}</span>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900">Visitante</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Entre na sua conta para salvar favoritos e interagir com estabelecimentos.
              </p>
              <div className="flex gap-2 mt-3 justify-center sm:justify-start">
                <Link
                  to="/login"
                  className="px-4 py-1.5 bg-[#DE1F2A] text-white text-xs font-bold rounded-xl hover:bg-[#C51620] transition"
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  className="px-4 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition"
                >
                  Cadastrar
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Stats summary */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/favoritos"
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3 hover:border-gray-200 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FDE8E9] flex items-center justify-center text-[#DE1F2A]">
            <Heart className="w-5 h-5 fill-[#DE1F2A]" />
          </div>
          <div>
            <span className="text-lg font-black text-gray-900">{favoriteIds.length}</span>
            <p className="text-xs text-gray-500">Locais Salvos</p>
          </div>
        </Link>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-black text-gray-900">{cities.length || 3}</span>
            <p className="text-xs text-gray-500">Cidades no Guia</p>
          </div>
        </div>
      </div>

      {/* 3. PWA Banner */}
      <PWAInstallButton variant="banner" />

      {/* 4. Menu Actions */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
        <Link
          to="/favoritos"
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm text-gray-800 hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-3">
            <Heart className="w-4 h-4 text-gray-400" />
            <span className="font-semibold">Meus Favoritos</span>
          </div>
          <span className="text-xs text-gray-400 font-medium">{favoriteIds.length}</span>
        </Link>

        {isAdmin && (
          <Link
            to="/admin"
            className="w-full px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm text-gray-800 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-[#DE1F2A]" />
              <span className="font-semibold text-gray-900">Painel Administrativo (Gestão)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDE8E9] text-[#DE1F2A]">
              Admin
            </span>
          </Link>
        )}

        <div className="w-full px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm text-gray-800 hover:bg-gray-50 transition cursor-pointer">
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-gray-400" />
            <span className="font-semibold">Preferências de Notificação</span>
          </div>
          <span className="text-xs text-gray-400">Ativo</span>
        </div>

        <div className="w-full px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm text-gray-800 hover:bg-gray-50 transition cursor-pointer">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-gray-400" />
            <span className="font-semibold">Privacidade & Termos</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        </div>

        <div className="w-full px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm text-gray-800 hover:bg-gray-50 transition cursor-pointer">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-4 h-4 text-gray-400" />
            <span className="font-semibold">Sobre o Kariri.app</span>
          </div>
          <span className="text-xs text-gray-400">v1.0.0</span>
        </div>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm text-red-600 hover:bg-red-50 transition font-bold"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </div>
          </button>
        ) : (
          <Link
            to="/login"
            className="w-full px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm text-[#DE1F2A] hover:bg-[#FDE8E9]/40 transition font-bold"
          >
            <div className="flex items-center gap-3">
              <LogIn className="w-4 h-4" />
              <span>Entrar com sua Conta</span>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};
