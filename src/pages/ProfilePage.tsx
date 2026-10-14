import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useCity } from '../context/CityContext';
import { PWAInstallButton } from '../components/common/PWAInstallButton';
import { CitySelectorInput } from '../components/common/CitySelectorInput';
import { citiesApi } from '../services/api/cities';
import { City } from '../types';
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
  CheckCircle2,
  Clock,
  Compass,
  Edit3,
  Save,
  X,
  Mail,
  AlertCircle,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const { favoriteIds } = useFavorites();
  const { cities } = useCity();
  const navigate = useNavigate();

  // Modo de edição do perfil geográfico
  const [isEditingGeo, setIsEditingGeo] = useState(false);
  const [editBirthCityId, setEditBirthCityId] = useState<number | null>(user?.birth_city_id ?? null);
  const [editBirthCityName, setEditBirthCityName] = useState<string>(user?.birth_city_name ?? '');
  const [editCurrentCityId, setEditCurrentCityId] = useState<number | null>(user?.current_city_id ?? null);
  const [editCurrentCityName, setEditCurrentCityName] = useState<string>(user?.current_city_name ?? '');
  const [editCaririCityId, setEditCaririCityId] = useState<string>(user?.cariri_city_id ? String(user.cariri_city_id) : '');
  const [editMarketingConsent, setEditMarketingConsent] = useState<boolean>(Boolean(user?.marketing_consent));

  const [caririCities, setCaririCities] = useState<City[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setPageMeta({
      title: 'Meu Perfil',
      description: 'Gerencie sua conta, preferências e histórico de descobertas no Kariri.',
    });

    citiesApi.getCaririCities().then(setCaririCities);
  }, []);

  useEffect(() => {
    if (user) {
      setEditBirthCityId(user.birth_city_id ?? null);
      setEditBirthCityName(user.birth_city_name ?? '');
      setEditCurrentCityId(user.current_city_id ?? null);
      setEditCurrentCityName(user.current_city_name ?? '');
      setEditCaririCityId(user.cariri_city_id ? String(user.cariri_city_id) : '');
      setEditMarketingConsent(Boolean(user.marketing_consent));
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSaveGeo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateProfile({
        birth_city_id: editBirthCityId,
        birth_city_name: editBirthCityName || null,
        current_city_id: editCurrentCityId,
        current_city_name: editCurrentCityName || null,
        cariri_city_id: editCaririCityId ? Number(editCaririCityId) : null,
        marketing_consent: editMarketingConsent,
      });
      setSaveSuccess(true);
      setIsEditingGeo(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Não foi possível salvar as preferências geográficas.');
    } finally {
      setIsSaving(false);
    }
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 w-fit mx-auto sm:mx-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Conta Ativa
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>

              <div className="flex items-center justify-center sm:justify-start gap-1 text-xs text-[#DE1F2A] font-semibold mt-2">
                <Compass className="w-3.5 h-3.5" />
                <span>
                  Catálogo:{' '}
                  {user.cariri_city_id
                    ? caririCities.find((c) => c.id === user.cariri_city_id)?.name || 'Cariri'
                    : 'Todo o Cariri'}
                </span>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900">Visitante</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Entre na sua conta para salvar favoritos, avaliar locais e personalizar seu guia.
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

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Preferências geográficas atualizadas com sucesso!</span>
        </div>
      )}

      {/* 2. Cartão de Distinção Geográfica (Exclusivo para autenticado) */}
      {isAuthenticated && user && (
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Identificação Geográfica & Origem
              </h2>
              <p className="text-[11px] text-gray-400">
                Distinção transparente entre suas raízes, residência e exploração do Cariri.
              </p>
            </div>
            {!isEditingGeo ? (
              <button
                type="button"
                onClick={() => setIsEditingGeo(true)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingGeo(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Cancelar edição"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {!isEditingGeo ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                  Cidade Natal (Origem / Perfil)
                </span>
                <span className="font-semibold text-gray-800">
                  {user.birth_city_name || 'Não informada'}
                </span>
                <p className="text-[10px] text-gray-400 mt-1">
                  Pode ser qualquer cidade do Brasil ou exterior. Não afeta GPS.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                  Cidade Atual (Residência)
                </span>
                <span className="font-semibold text-gray-800">
                  {user.current_city_name || 'Não informada'}
                </span>
                <p className="text-[10px] text-gray-400 mt-1">
                  Separada da cidade natal. Usada para comunicação regional se autorizada.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                  Preferência no Catálogo do Cariri
                </span>
                <span className="font-semibold text-gray-800">
                  {user.cariri_city_id
                    ? caririCities.find((c) => c.id === user.cariri_city_id)?.name || 'Município selecionado'
                    : 'Todo o Cariri'}
                </span>
                <p className="text-[10px] text-gray-400 mt-1">
                  Filtragem padrão do guia cultural do Cariri.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                  Consentimento de Notícias / Marketing
                </span>
                <span className="font-semibold text-gray-800">
                  {user.marketing_consent ? '✓ Autorizado' : 'Não autorizado'}
                </span>
                <p className="text-[10px] text-gray-400 mt-1">
                  Comunicação informativa sobre cultura e gastronomia.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveGeo} className="space-y-4 pt-1">
              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 text-[#DE1F2A] text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <CitySelectorInput
                label="Cidade Natal (Onde você nasceu)"
                placeholder="Ex: Barbalha, Recife, São Paulo, Lisboa..."
                helperText="Qualquer município do Brasil ou exterior. Usado para identificação cadastral e procedência."
                selectedCityId={editBirthCityId}
                selectedCityName={editBirthCityName}
                onSelect={({ cityId, cityName }) => {
                  setEditBirthCityId(cityId);
                  setEditBirthCityName(cityName);
                }}
              />

              <CitySelectorInput
                label="Cidade Atual (Onde reside atualmente)"
                placeholder="Ex: Crato, Juazeiro do Norte, Fortaleza..."
                helperText="Separada da cidade natal. Usada para comunicação regional se autorizada."
                selectedCityId={editCurrentCityId}
                selectedCityName={editCurrentCityName}
                onSelect={({ cityId, cityName }) => {
                  setEditCurrentCityId(cityId);
                  setEditCurrentCityName(cityName);
                }}
              />

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Cidade de Preferência no Cariri
                </label>
                <select
                  value={editCaririCityId}
                  onChange={(e) => setEditCaririCityId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A]"
                >
                  <option value="">Todo o Cariri (Sem filtro fixo)</option>
                  {caririCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name} ({city.places_count || 0} locais)
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={editMarketingConsent}
                  onChange={(e) => setEditMarketingConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#DE1F2A] rounded border-gray-300 focus:ring-[#DE1F2A]"
                />
                <span className="text-xs text-gray-700 leading-tight">
                  Autorizo o envio de novidades culturais, agenda de eventos e destaques gastronômicos do Cariri.
                </span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-[#DE1F2A] hover:bg-[#C51620] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingGeo(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-xs transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 3. Stats summary */}
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

      {/* 4. PWA Banner */}
      <PWAInstallButton variant="banner" />

      {/* 5. Menu Actions */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
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

        <div className="w-full px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm text-gray-800 hover:bg-gray-50 transition">
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-gray-400" />
            <span className="font-semibold">Preferências de Notificação</span>
          </div>
          <span className="text-xs text-gray-400">Ativo</span>
        </div>

        <Link
          to="/privacidade"
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm text-gray-800 hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-gray-400" />
            <span className="font-semibold">Privacidade & Termos</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        </Link>

        <div className="w-full px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm text-gray-800 hover:bg-gray-50 transition">
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
