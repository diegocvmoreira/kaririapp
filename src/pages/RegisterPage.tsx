import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KaririLogo } from '../components/common/KaririLogo';
import { CitySelectorInput } from '../components/common/CitySelectorInput';
import { citiesApi } from '../services/api/cities';
import { analytics } from '../services/analyticsService';
import { City } from '../types';
import { setPageMeta } from '../utils/seo';
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Compass,
  Check,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Validação estrita para evitar vulnerabilidade de open redirect
  const returnToRaw = searchParams.get('returnTo');
  const safeReturnTo =
    returnToRaw && returnToRaw.startsWith('/') && !returnToRaw.startsWith('//')
      ? returnToRaw
      : '/perfil';

  // Campos básicos
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  // Campos geográficos (distinção explícita)
  const [birthCityId, setBirthCityId] = useState<number | null>(null);
  const [birthCityName, setBirthCityName] = useState<string>('');

  const [currentCityId, setCurrentCityId] = useState<number | null>(null);
  const [currentCityName, setCurrentCityName] = useState<string>('');

  // Preferência de exploração no Cariri (somente municípios do catálogo)
  const [caririCities, setCaririCities] = useState<City[]>([]);
  const [caririCityId, setCaririCityId] = useState<string>('');

  // Consentimento de marketing separado
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Estados de submissão e validação
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: 'Cadastrar no Kariri',
      description: 'Crie seu perfil gratuito no Kariri.app e descubra o melhor do Cariri cearense.',
    });

    analytics.track('sign_up_start', {
      source_page: '/cadastro',
    });

    citiesApi.getCaririCities().then((cities) => {
      setCaririCities(cities);
    });
  }, []);

  // Avaliação simples de força da senha
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Fraca (mín. 8 caracteres)', color: 'bg-red-400' };
      case 2:
        return { score: 2, label: 'Razoável', color: 'bg-amber-400' };
      case 3:
        return { score: 3, label: 'Boa', color: 'bg-blue-500' };
      case 4:
        return { score: 4, label: 'Forte', color: 'bg-emerald-500' };
      default:
        return { score: 1, label: 'Muito curta', color: 'bg-red-400' };
    }
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('A senha deve conter no mínimo 8 caracteres para sua segurança.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMsg('A confirmação de senha não coincide com a senha digitada.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        password_confirmation: passwordConfirmation,
        birth_city_id: birthCityId,
        birth_city_name: birthCityName || null,
        current_city_id: currentCityId,
        current_city_name: currentCityName || null,
        cariri_city_id: caririCityId ? Number(caririCityId) : null,
        marketing_consent: marketingConsent,
      });

      analytics.track('sign_up', {
        method: 'email_password',
        has_birth_city: Boolean(birthCityId || birthCityName),
        has_current_city: Boolean(currentCityId || currentCityName),
        cariri_preferred_city: caririCityId ? String(caririCityId) : 'none',
        marketing_consent: marketingConsent,
      });

      setRegistrationSuccess(true);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Não foi possível concluir o cadastro com os dados informados. Verifique as informações e tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto">
        <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl space-y-6 text-center animate-fade-in">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Conta criada com sucesso!</h1>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Enviamos um link de confirmação para <strong>{email}</strong>.
            </p>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-4 text-xs text-left text-emerald-900 space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-emerald-950">
              <Check className="w-4 h-4 text-emerald-600" />
              Sua conta já está ativa no modo visitante autenticado
            </p>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Você já pode favoritar locais, avaliar experiências e personalizar sua descoberta do Cariri Cearense.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate(safeReturnTo)}
              className="flex-1 py-3 bg-[#DE1F2A] hover:bg-[#C51620] text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm transition"
            >
              {safeReturnTo !== '/perfil' ? 'Continuar navegação' : 'Ver meu perfil'}
            </button>
            <button
              onClick={() => navigate('/explorar')}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs sm:text-sm transition"
            >
              Explorar o Cariri
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 max-w-xl mx-auto">
      <div className="w-full mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao início</span>
        </Link>
      </div>

      <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <KaririLogo size="lg" className="justify-center" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 pt-2">Criar conta no Kariri.app</h1>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            O guia é exclusivo do Cariri, mas você pode morar ou ter nascido em qualquer lugar do Brasil ou do mundo!
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-[#DE1F2A] text-xs font-medium rounded-2xl flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SEÇÃO 1: DADOS DE ACESSO */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1.5">
              1. Dados de Acesso
            </h2>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como gostaria de ser chamado"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A] focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                E-mail <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A] focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Senha <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A] focus:bg-white transition"
                  />
                </div>
                {password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">{passwordStrength.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Confirmar Senha <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Repita a senha"
                    minLength={8}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A] focus:bg-white transition"
                  />
                </div>
                {passwordConfirmation && password !== passwordConfirmation && (
                  <span className="text-[10px] text-red-500 block mt-1">As senhas não coincidem</span>
                )}
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: PERFIL GEOGRÁFICO E DISTINÇÃO DE CIDADES */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                2. Origem e Localização (Opcional)
              </h2>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                Opcional
              </span>
            </div>

            {/* Cidade Natal */}
            <CitySelectorInput
              label="Cidade Natal (Onde você nasceu)"
              placeholder="Ex: Barbalha, Recife, São Paulo, Lisboa..."
              helperText="Finalidade: Perfil cadastral e identificação de raízes culturais. Pode ser qualquer cidade do Brasil ou exterior. Nunca usada como localização atual de GPS."
              selectedCityId={birthCityId}
              selectedCityName={birthCityName}
              onSelect={({ cityId, cityName }) => {
                setBirthCityId(cityId);
                setBirthCityName(cityName);
              }}
            />

            {/* Cidade Atual */}
            <CitySelectorInput
              label="Cidade Atual (Onde você mora hoje)"
              placeholder="Ex: Crato, Juazeiro do Norte, Fortaleza..."
              helperText="Finalidade: Personalização regional e comunicação geográfica somente quando informada. Separada da cidade natal."
              selectedCityId={currentCityId}
              selectedCityName={currentCityName}
              onSelect={({ cityId, cityName }) => {
                setCurrentCityId(cityId);
                setCurrentCityName(cityName);
              }}
            />

            {/* Preferência no Cariri */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Cidade de Preferência no Cariri
              </label>
              <div className="relative">
                <Compass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={caririCityId}
                  onChange={(e) => setCaririCityId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A] focus:bg-white transition"
                >
                  <option value="">Todo o Cariri (Sem filtro fixo)</option>
                  {caririCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name} ({city.places_count || 0} locais)
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Finalidade: Destaque de conteúdo no guia do Cariri. Não altera seus dados residenciais.
              </p>
            </div>
          </div>

          {/* SEÇÃO 3: CONSENTIMENTO E COMUNICAÇÃO */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1.5">
              3. Preferências de Comunicação
            </h2>

            <label className="flex items-start gap-3 p-3 bg-gray-50 hover:bg-gray-100/70 rounded-2xl cursor-pointer border border-gray-200/60 transition">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-1 w-4 h-4 text-[#DE1F2A] rounded border-gray-300 focus:ring-[#DE1F2A]"
              />
              <div className="text-xs space-y-0.5">
                <span className="font-semibold text-gray-900 block">
                  Desejo receber novidades e agenda cultural do Cariri
                </span>
                <span className="text-[11px] text-gray-500 leading-tight block">
                  Finalidade: Envio de seleções semanais de gastronomia, eventos culturais e novos estabelecimentos do Cariri no seu e-mail. Você pode cancelar quando quiser.
                </span>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#DE1F2A] hover:bg-[#C51620] active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 mt-4"
          >
            <span>{isSubmitting ? 'Cadastrando perfil...' : 'Criar Conta no Kariri.app'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Já tem uma conta cadastrada?{' '}
            <Link to="/login" className="text-[#DE1F2A] font-bold hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
