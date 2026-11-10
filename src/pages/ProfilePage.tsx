import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useCity } from '../context/CityContext';
import { PWAInstallButton } from '../components/common/PWAInstallButton';
import { CitySelectorInput } from '../components/common/CitySelectorInput';
import { DeleteAccountModal } from '../components/profile/DeleteAccountModal';
import { citiesApi } from '../services/api/cities';
import { City } from '../types';
import { setPageMeta } from '../utils/seo';
import { EmailVerificationBanner } from '../components/common/EmailVerificationBanner';
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
  Calendar,
  Compass,
  Edit3,
  Save,
  X,
  Mail,
  AlertCircle,
  Trash2,
  Lock,
  Download,
  Bell,
  Camera,
  Shield,
  FileText,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { PasswordRequirements } from '../components/auth/PasswordRequirements';
import { prepareImageForUpload } from '../utils/prepareImageForUpload';
import { uploadImage } from '../services/api/uploads';

type ProfileTab = 'account' | 'preferences' | 'favorites' | 'contributions' | 'privacy';

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, isEmailVerified, logout, deleteAccount, updateProfile, changePassword } = useAuth();
  const { favoriteIds } = useFavorites();
  const { cities, selectedCitySlug, setSelectedCitySlug } = useCity();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ProfileTab>('account');

  // 1. Minha Conta: Nome, Avatar, Email e Senha
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [avatarInput, setAvatarInput] = useState(user?.avatar || '');
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  // Alteração de senha
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 2. Vínculo Regional & Origem
  const [isEditingGeo, setIsEditingGeo] = useState(false);
  const [editBirthCityId, setEditBirthCityId] = useState<number | null>(user?.birth_city_id ?? null);
  const [editBirthCityName, setEditBirthCityName] = useState<string>(user?.birth_city_name ?? '');
  const [editCurrentCityId, setEditCurrentCityId] = useState<number | null>(user?.current_city_id ?? null);
  const [editCurrentCityName, setEditCurrentCityName] = useState<string>(user?.current_city_name ?? '');
  const [editCurrentCityIbgeCode, setEditCurrentCityIbgeCode] = useState<number | null>(user?.current_city_ibge_code ?? null);
  const [editCurrentCityState, setEditCurrentCityState] = useState<string | null>(user?.current_city_state ?? null);
  const [editCaririCityId, setEditCaririCityId] = useState<string>(user?.cariri_city_id ? String(user.cariri_city_id) : '');
  const [editMarketingConsent, setEditMarketingConsent] = useState<boolean>(Boolean(user?.marketing_consent));
  const [caririCities, setCaririCities] = useState<City[]>([]);

  // 3. Preferências de Notificação (persistidas localmente)
  const [notifyNewPlaces, setNotifyNewPlaces] = useState(() => {
    return localStorage.getItem('kariri_pref_new_places') !== 'false';
  });
  const [notifyWeekendEvents, setNotifyWeekendEvents] = useState(() => {
    return localStorage.getItem('kariri_pref_weekend_events') !== 'false';
  });
  const [notifyContributions, setNotifyContributions] = useState(() => {
    return localStorage.getItem('kariri_pref_contributions') !== 'false';
  });

  // Modal de Exclusão de Conta (P1.5)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Estados de feedback geral
  const [isSaving, setIsSaving] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPageMeta({
      title: 'Minha Conta & Perfil – Kariri.app',
      description: 'Gerencie sua conta, preferências regionais, favoritos e histórico de contribuições no Kariri.app.',
    });
    citiesApi.getCaririCities().then(setCaririCities).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setNameInput(user.name || '');
      setAvatarInput(user.avatar || '');
      setEmailInput(user.email || '');
      setEditBirthCityId(user.birth_city_id ?? null);
      setEditBirthCityName(user.birth_city_name ?? '');
      setEditCurrentCityId(user.current_city_id ?? null);
      setEditCurrentCityName(user.current_city_name ?? '');
      setEditCurrentCityIbgeCode(user.current_city_ibge_code ?? null);
      setEditCurrentCityState(user.current_city_state ?? null);
      setEditCaririCityId(user.cariri_city_id ? String(user.cariri_city_id) : '');
      setEditMarketingConsent(Boolean(user.marketing_consent));
    }
  }, [user]);

  const showSuccessFeedback = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSavePublicName = async () => {
    if (!nameInput.trim()) return;
    setIsSaving(true);
    setActionErrorMessage(null);
    try {
      await updateProfile({ name: nameInput.trim() });
      setIsEditingName(false);
      showSuccessFeedback('Nome público atualizado com sucesso!');
    } catch (err: unknown) {
      setActionErrorMessage(err instanceof Error ? err.message : 'Falha ao atualizar nome.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    setActionErrorMessage(null);

    try {
      // Otimização no frontend (compressão para WebP, redimensionamento, máx 15MB de entrada)
      const optimized = await prepareImageForUpload(file);
      // Envio via FormData para POST /api/uploads/images
      const uploaded = await uploadImage(optimized);

      if (uploaded?.url) {
        await updateProfile({ avatar: uploaded.url });
        setAvatarInput(uploaded.url);
        showSuccessFeedback('Foto de perfil atualizada com sucesso!');
      } else {
        throw new Error('Servidor não retornou a URL da imagem.');
      }
    } catch (err: unknown) {
      console.error('Falha no upload do avatar:', err);
      setActionErrorMessage(err instanceof Error ? err.message : 'Falha ao processar e enviar foto de perfil.');
    } finally {
      setIsSaving(false);
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setIsSaving(true);
    try {
      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Usuario')}&background=DE1F2A&color=fff&size=128`;
      await updateProfile({ avatar: defaultAvatar });
      setAvatarInput(defaultAvatar);
      showSuccessFeedback('Foto de perfil removida.');
    } catch {
      setActionErrorMessage('Não foi possível remover o avatar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setActionErrorMessage('Por favor, informe um endereço de e-mail válido.');
      return;
    }
    setIsSaving(true);
    setActionErrorMessage(null);
    try {
      await updateProfile({ email: emailInput.trim().toLowerCase() });
      setIsEditingEmail(false);
      showSuccessFeedback('E-mail atualizado com sucesso!');
    } catch (err: unknown) {
      setActionErrorMessage(err instanceof Error ? err.message : 'Falha ao atualizar e-mail.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError('Informe sua senha atual.');
      return;
    }
    if (newPassword.length < 12) {
      setPasswordError('A nova senha deve possuir no mínimo 12 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('A nova senha e a confirmação não coincidem.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setTimeout(() => {
        setPasswordSuccess(false);
        setIsPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showSuccessFeedback('Senha alterada com sucesso!');
      }, 1800);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Falha ao alterar senha. Verifique a senha atual.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveGeo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setActionErrorMessage(null);
    try {
      await updateProfile({
        birth_city_id: editBirthCityId,
        birth_city_name: editBirthCityName || null,
        current_city_id: editCurrentCityId,
        current_city_name: editCurrentCityName || null,
        current_city_ibge_code: editCurrentCityIbgeCode,
        current_city_state: editCurrentCityState,
        cariri_city_id: editCaririCityId ? Number(editCaririCityId) : null,
        marketing_consent: editMarketingConsent,
      });

      // Se selecionou uma cidade favorita no Cariri, sincroniza com o seletor global
      if (editCaririCityId) {
        const found = caririCities.find((c) => c.id === Number(editCaririCityId));
        if (found) {
          setSelectedCitySlug(found.slug);
        }
      }

      setIsEditingGeo(false);
      showSuccessFeedback('Preferências regionais salvas com sucesso!');
    } catch (err: unknown) {
      setActionErrorMessage(err instanceof Error ? err.message : 'Falha ao salvar dados de localização.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotification = (key: 'new_places' | 'weekend_events' | 'contributions', val: boolean) => {
    if (key === 'new_places') {
      setNotifyNewPlaces(val);
      localStorage.setItem('kariri_pref_new_places', String(val));
    } else if (key === 'weekend_events') {
      setNotifyWeekendEvents(val);
      localStorage.setItem('kariri_pref_weekend_events', String(val));
    } else if (key === 'contributions') {
      setNotifyContributions(val);
      localStorage.setItem('kariri_pref_contributions', String(val));
    }
    showSuccessFeedback('Preferência de notificação salva.');
  };

  const handleExportMyData = () => {
    const dataToExport = {
      export_date: new Date().toISOString(),
      platform: 'Kariri.app',
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        birth_city_name: user?.birth_city_name,
        current_city_name: user?.current_city_name,
        current_city_state: user?.current_city_state,
        marketing_consent: user?.marketing_consent,
        created_at: user?.created_at,
      },
      saved_favorites_count: favoriteIds.length,
      favorite_place_ids: favoriteIds,
      preferences: {
        notify_new_places: notifyNewPlaces,
        notify_weekend_events: notifyWeekendEvents,
        notify_contributions: notifyContributions,
      },
      lgpd_statement: 'Exportação de dados pessoais em conformidade com o Artigo 18, inciso V da LGPD (Lei 13.709/2018).',
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kariri-meus-dados-${user?.name?.toLowerCase().replace(/\s+/g, '-') || 'usuario'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccessFeedback('Arquivo JSON com seus dados baixado com sucesso!');
  };

  const handleConfirmDeleteAccount = async (password: string) => {
    await deleteAccount(password);
    setIsDeleteModalOpen(false);
    navigate('/');
  };

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderador';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-20">
      {/* Toast de Feedback */}
      {actionSuccessMessage && (
        <div className="fixed top-5 right-5 z-[80] max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-4 rounded-2xl shadow-xl border bg-emerald-600 text-white border-emerald-400 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold">{actionSuccessMessage}</span>
          </div>
        </div>
      )}

      {actionErrorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-semibold">{actionErrorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionErrorMessage(null)}
            className="text-red-500 hover:text-red-800 text-xs font-bold"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Cartão de Cabeçalho do Perfil (Com foto, dados e papel) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          {/* Avatar com ação de troca */}
          <div className="relative group shrink-0">
            <img
              src={
                avatarInput ||
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Visitante')}&background=DE1F2A&color=fff&size=128`
              }
              alt={user?.name || 'Usuário'}
              className="w-20 h-20 sm:w-22 sm:h-22 rounded-full object-cover ring-4 ring-[#DE1F2A]/10 shadow-sm"
            />
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Trocar foto de perfil"
                aria-label="Trocar foto de perfil"
              >
                <Camera className="w-5 h-5" />
              </button>
            )}
            <input
              ref={avatarFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFile}
              className="hidden"
            />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {user?.name || 'Visitante'}
              </h1>
              {user?.role && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    user.role === 'admin'
                      ? 'bg-[#FDE8E9] text-[#DE1F2A]'
                      : user.role === 'moderador'
                      ? 'bg-blue-50 text-blue-700'
                      : user.role === 'business'
                      ? 'bg-purple-50 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {user.role}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <p className="text-xs text-gray-500 font-medium">{user?.email || 'Navegando no modo visitante'}</p>
              {isAuthenticated && (
                isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verificado</span>
                  </span>
                ) : (
                  <Link
                    to={`/verificar-email?email=${encodeURIComponent(user?.email || '')}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition"
                  >
                    <Mail className="w-3 h-3 text-amber-700" />
                    <span>Não verificado • Confirmar</span>
                  </Link>
                )
              )}
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-[11px] text-gray-400">
              <MapPin className="w-3.5 h-3.5 text-[#DE1F2A]" />
              <span>
                {user?.current_city_name
                  ? `${user.current_city_name}${user.current_city_state ? `/${user.current_city_state}` : ''}`
                  : 'Região do Cariri Cearense'}
              </span>
            </div>
          </div>
        </div>

        {/* Botão de Logout ou Entrar */}
        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da Conta</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl bg-[#DE1F2A] hover:bg-[#C51620] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar ou Cadastrar</span>
          </Link>
        )}
      </div>

      {/* Navegação por Abas (Redesign P1.4) */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 flex items-center gap-2 ${
            activeTab === 'account'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Minha Conta</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 flex items-center gap-2 ${
            activeTab === 'preferences'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Preferências</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 flex items-center gap-2 ${
            activeTab === 'favorites'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Favoritos ({favoriteIds.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contributions')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 flex items-center gap-2 ${
            activeTab === 'contributions'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Contribuições</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 flex items-center gap-2 ${
            activeTab === 'privacy'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Privacidade & Dados</span>
        </button>
      </div>

      {/* ABA 1: MINHA CONTA */}
      {activeTab === 'account' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <EmailVerificationBanner
            actionLabel="liberar avaliações, novas contribuições e reivindicação de estabelecimentos"
            variant="card"
          />

          {/* Dados Pessoais */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#DE1F2A]" />
              <span>Identificação & Credenciais</span>
            </h2>

            <div className="space-y-4">
              {/* Nome Público */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-2xl">
                <div className="flex-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Nome Público
                  </span>
                  {isEditingName ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A] w-full max-w-sm"
                      />
                      <button
                        type="button"
                        onClick={handleSavePublicName}
                        disabled={isSaving}
                        className="px-3 py-1.5 bg-[#DE1F2A] text-white rounded-xl text-xs font-bold hover:bg-[#C51620] transition disabled:opacity-50"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNameInput(user?.name || '');
                          setIsEditingName(false);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-gray-800">
                      {user?.name || 'Não informado'}
                    </span>
                  )}
                </div>

                {!isEditingName && isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 transition flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                )}
              </div>

              {/* E-mail de Acesso */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-2xl">
                <div className="flex-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Endereço de E-mail
                  </span>
                  {isEditingEmail ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A] w-full max-w-sm"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEmail}
                        disabled={isSaving}
                        className="px-3 py-1.5 bg-[#DE1F2A] text-white rounded-xl text-xs font-bold hover:bg-[#C51620] transition disabled:opacity-50"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailInput(user?.email || '');
                          setIsEditingEmail(false);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">
                        {user?.email || 'Nenhum e-mail vinculado'}
                      </span>
                      {isAuthenticated && (
                        isEmailVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Confirmado</span>
                          </span>
                        ) : (
                          <Link
                            to={`/verificar-email?email=${encodeURIComponent(user?.email || '')}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition"
                          >
                            <Mail className="w-3 h-3 text-amber-700" />
                            <span>Confirmar agora</span>
                          </Link>
                        )
                      )}
                    </div>
                  )}
                </div>

                {!isEditingEmail && isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(true)}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 transition flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Alterar E-mail</span>
                  </button>
                )}
              </div>

              {/* Segurança / Senha */}
              {isAuthenticated && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-2xl">
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      Segurança da Senha
                    </span>
                    <span className="text-sm font-bold text-gray-800">••••••••••••</span>
                    <p className="text-[11px] text-gray-400">Proteja seu login com uma senha forte</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 transition flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Alterar Senha</span>
                  </button>
                </div>
              )}

              {/* Avatar: Gerenciar foto */}
              {isAuthenticated && (
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl">
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      Foto de Perfil
                    </span>
                    <span className="text-xs text-gray-600">
                      Foto visível nas avaliações e colaborações
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                    >
                      Trocar Foto
                    </button>
                    {user?.avatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="p-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-red-600 hover:bg-red-50 transition"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vínculo Regional e Origem */}
          {isAuthenticated && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#DE1F2A]" />
                  <h2 className="text-base font-bold text-gray-900">Suas Raízes & Vínculo com o Cariri</h2>
                </div>
                {!isEditingGeo && (
                  <button
                    type="button"
                    onClick={() => setIsEditingGeo(true)}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                )}
              </div>

              {!isEditingGeo ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-gray-50 rounded-2xl">
                    <span className="text-gray-400 block font-medium">Cidade onde nasceu:</span>
                    <span className="font-bold text-gray-800 text-sm">
                      {user?.birth_city_name || 'Não informada'}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl">
                    <span className="text-gray-400 block font-medium">Onde mora atualmente:</span>
                    <span className="font-bold text-gray-800 text-sm">
                      {user?.current_city_name
                        ? `${user.current_city_name} (${user.current_city_state || 'CE'})`
                        : 'Não informada'}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl sm:col-span-2">
                    <span className="text-gray-400 block font-medium">Cidade favorita no Cariri:</span>
                    <span className="font-bold text-[#DE1F2A] text-sm">
                      {caririCities.find((c) => c.id === user?.cariri_city_id)?.name || 'Todo o Cariri'}
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveGeo} className="space-y-4 text-xs sm:text-sm">
                  <CitySelectorInput
                    label="Cidade onde você nasceu (Naturalidade)"
                    placeholder="Busque pelo município de nascimento..."
                    selectedCityName={editBirthCityName}
                    onSelect={(c) => {
                      setEditBirthCityId(c.cityId);
                      setEditBirthCityName(c.cityName);
                    }}
                  />

                  <CitySelectorInput
                    label="Cidade onde você reside atualmente"
                    placeholder="Busque pelo município onde você mora..."
                    selectedCityName={editCurrentCityName}
                    onSelect={(c) => {
                      setEditCurrentCityId(c.cityId);
                      setEditCurrentCityName(c.cityName);
                      setEditCurrentCityIbgeCode(c.ibgeCode ?? null);
                      setEditCurrentCityState(c.state ?? 'CE');
                    }}
                  />

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Sua cidade principal no Cariri:
                    </label>
                    <select
                      value={editCaririCityId}
                      onChange={(e) => setEditCaririCityId(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                    >
                      <option value="">Todo o Cariri (Visão Geral)</option>
                      {caririCities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingGeo(false)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 rounded-xl bg-[#DE1F2A] text-white font-bold disabled:opacity-50"
                    >
                      Salvar Vínculo Regional
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: PREFERÊNCIAS */}
      {activeTab === 'preferences' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#DE1F2A]" />
              <span>Notificações & Avisos do Guia</span>
            </h2>

            <div className="divide-y divide-gray-100">
              {/* Notificação 1 */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-xs sm:text-sm">Novos locais no Cariri</h3>
                  <p className="text-xs text-gray-500">
                    Avisos quando restaurantes, atrações ou comércios forem aprovados e incluídos.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyNewPlaces}
                  onChange={(e) => handleToggleNotification('new_places', e.target.checked)}
                  className="w-5 h-5 text-[#DE1F2A] rounded border-gray-300 focus:ring-[#DE1F2A] cursor-pointer"
                />
              </div>

              {/* Notificação 2 */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-xs sm:text-sm">Destaques da Agenda Cultural</h3>
                  <p className="text-xs text-gray-500">
                    Resumo semanal com os melhores shows, feiras e festivais de Crato, Juazeiro e Barbalha.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyWeekendEvents}
                  onChange={(e) => handleToggleNotification('weekend_events', e.target.checked)}
                  className="w-5 h-5 text-[#DE1F2A] rounded border-gray-300 focus:ring-[#DE1F2A] cursor-pointer"
                />
              </div>

              {/* Notificação 3 */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-xs sm:text-sm">Status das minhas contribuições</h3>
                  <p className="text-xs text-gray-500">
                    Avisos quando seus locais ou eventos sugeridos forem aprovados pela moderação.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyContributions}
                  onChange={(e) => handleToggleNotification('contributions', e.target.checked)}
                  className="w-5 h-5 text-[#DE1F2A] rounded border-gray-300 focus:ring-[#DE1F2A] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Integração com Seletor Global de Cidade */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#DE1F2A]" />
              <span>Filtro Padrão de Cidade</span>
            </h2>
            <p className="text-xs text-gray-500">
              Defina qual município deve ser priorizado ao abrir a Home e a busca no Kariri.app.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedCitySlug('all');
                  showSuccessFeedback('Filtro definido para Todo o Cariri');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  selectedCitySlug === 'all'
                    ? 'bg-[#DE1F2A] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todo o Cariri
              </button>

              {cities.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCitySlug(c.slug);
                    showSuccessFeedback(`Filtro padrão definido para ${c.name}`);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    selectedCitySlug === c.slug
                      ? 'bg-[#DE1F2A] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: FAVORITOS & HISTÓRICO */}
      {activeTab === 'favorites' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#DE1F2A] fill-[#DE1F2A]" />
                <span>Locais e Atrações Salvas ({favoriteIds.length})</span>
              </h2>

              <Link
                to="/favoritos"
                className="text-xs font-bold text-[#DE1F2A] hover:underline flex items-center gap-1"
              >
                <span>Abrir página completa</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {favoriteIds.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-50 text-[#DE1F2A] flex items-center justify-center mx-auto">
                  <Heart className="w-6 h-6" />
                </div>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Você ainda não favoritou locais. Navegue pela página <strong>Explorar</strong> ou pelo <strong>Mapa</strong> e toque no coração para salvar!
                </p>
                <Link
                  to="/explorar"
                  className="inline-block px-5 py-2.5 bg-[#DE1F2A] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Explorar o Cariri
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-600">
                  Você possui <strong>{favoriteIds.length}</strong> locais salvos na sua lista de favoritos.
                </p>
                <div className="pt-2">
                  <Link
                    to="/favoritos"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition"
                  >
                    <span>Ver todos os locais favoritados</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 4: CONTRIBUIÇÕES */}
      {activeTab === 'contributions' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Resumo por Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-center">
              <span className="text-xl font-black text-amber-600 block">Em Análise</span>
              <span className="text-xs text-gray-500 font-semibold">Moderação ativa</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-center">
              <span className="text-xl font-black text-emerald-600 block">Publicados</span>
              <span className="text-xs text-gray-500 font-semibold">No catálogo</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-center">
              <span className="text-xl font-black text-blue-600 block">Eventos</span>
              <span className="text-xs text-gray-500 font-semibold">Na agenda</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-center">
              <span className="text-xl font-black text-[#DE1F2A] block">Comunidade</span>
              <span className="text-xs text-gray-500 font-semibold">Cariri Cearense</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#DE1F2A]" />
              <span>Ações de Contribuição Comunitária</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Link
                to="/novo-local"
                className="p-4 rounded-2xl border border-gray-200 hover:border-[#DE1F2A] hover:bg-[#FDE8E9]/15 transition flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm group-hover:text-[#DE1F2A] transition">
                    Sugerir Novo Local
                  </h3>
                  <p className="text-[11px] text-gray-500">Restaurante, ponto turístico ou comércio</p>
                </div>
              </Link>

              <Link
                to="/novo-evento"
                className="p-4 rounded-2xl border border-gray-200 hover:border-[#DE1F2A] hover:bg-[#FDE8E9]/15 transition flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm group-hover:text-[#DE1F2A] transition">
                    Cadastrar Evento
                  </h3>
                  <p className="text-[11px] text-gray-500">Show, festa cultural ou feira</p>
                </div>
              </Link>
            </div>

            <div className="pt-2">
              <Link
                to="/minhas-contribuicoes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition"
              >
                <Clock className="w-4 h-4" />
                <span>Acompanhar Fila e Status das Minhas Contribuições</span>
              </Link>
            </div>

            {(isAdmin || isModerator) && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 mt-4 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-amber-900">Acesso Administrativo</span>
                  <p className="text-[11px] text-amber-700">Você possui permissão de moderação e gestão editorial.</p>
                </div>
                <Link
                  to="/admin"
                  className="px-4 py-2 bg-[#DE1F2A] hover:bg-[#C51620] text-white text-xs font-bold rounded-xl transition"
                >
                  Painel de Moderação
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 5: PRIVACIDADE & LGPD */}
      {activeTab === 'privacy' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Direitos do Titular (LGPD) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#DE1F2A]" />
              <span>Seus Direitos e Gestão de Dados (LGPD)</span>
            </h2>

            <p className="text-xs text-gray-600 leading-relaxed">
              Em cumprimento à <strong>Lei Geral de Proteção de Dados (Lei 13.709/2018)</strong>, você tem total controle sobre seus dados pessoais no Kariri.app.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Exportar dados */}
              <button
                type="button"
                onClick={handleExportMyData}
                className="p-4 rounded-2xl border border-gray-200 hover:border-gray-400 bg-gray-50/70 hover:bg-gray-100 text-left transition flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm">Exportar Meus Dados</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Baixe uma cópia estruturada em formato JSON (Art. 18, V).
                  </p>
                </div>
              </button>

              {/* Gerenciar Cookies */}
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('kariri:open_cookie_preferences'));
                }}
                className="p-4 rounded-2xl border border-gray-200 hover:border-[#DE1F2A] bg-gray-50/70 hover:bg-[#FDE8E9]/15 text-left transition flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FDE8E9] text-[#DE1F2A] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm group-hover:text-[#DE1F2A] transition">
                    Preferências de Cookies
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Ajuste permissões de analytics e medição anônima.
                  </p>
                </div>
              </button>
            </div>

            {/* Links Institucionais Transparentes */}
            <div className="divide-y divide-gray-100 pt-2">
              <Link
                to="/privacidade"
                className="py-3 flex items-center justify-between text-xs text-gray-700 hover:text-[#DE1F2A] font-medium"
              >
                <span>Aviso de Privacidade Completo</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </Link>

              <Link
                to="/cookies"
                className="py-3 flex items-center justify-between text-xs text-gray-700 hover:text-[#DE1F2A] font-medium"
              >
                <span>Política de Cookies & Tecnologias de Medição</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </Link>

              <Link
                to="/termos"
                className="py-3 flex items-center justify-between text-xs text-gray-700 hover:text-[#DE1F2A] font-medium"
              >
                <span>Termos de Uso do Kariri.app</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </Link>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl text-[11px] text-gray-500 border border-gray-200 flex items-center justify-between">
              <span>Canal do Encarregado de Dados (DPO):</span>
              <a
                href="mailto:privacidade@kariri.app.br"
                className="text-[#DE1F2A] font-bold underline"
              >
                privacidade@kariri.app.br
              </a>
            </div>
          </div>

          {/* Área Perigosa: Exclusão com Modal Acessível (P1.5) */}
          {isAuthenticated && (
            <div className="bg-red-50/50 rounded-3xl p-6 sm:p-7 border border-red-200 space-y-3">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                <h2 className="text-base font-bold text-red-950">Exclusão Definitiva de Conta</h2>
              </div>
              <p className="text-xs text-red-900/80 leading-relaxed">
                Você pode solicitar a eliminação imediata e definitiva do seu cadastro e de todos os dados vinculados, conforme o Artigo 18 da LGPD.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-2 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Solicitar Exclusão da Minha Conta</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Alteração de Senha */}
      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#DE1F2A]" />
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">Alterar Senha de Acesso</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Senha alterada com sucesso!</h4>
              </div>
            ) : (
              <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs sm:text-sm">
                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Senha Atual</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nova Senha (mínimo 12 caracteres)</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Confirme a Nova Senha</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
                  />
                </div>

                <PasswordRequirements password={newPassword} className="mt-2" />

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-5 py-2 rounded-xl bg-[#DE1F2A] text-white font-bold text-xs disabled:opacity-50"
                  >
                    {isChangingPassword ? 'Salvando...' : 'Atualizar Senha'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Exclusão Segura de Conta (P1.5) */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDeleteAccount}
        userName={user?.name}
      />
    </div>
  );
};
