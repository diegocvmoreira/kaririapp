import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api/auth';
import { KaririLogo } from '../components/common/KaririLogo';
import { setPageMeta } from '../utils/seo';
import { analytics } from '../services/analyticsService';
import { Mail, Lock, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { TurnstileWidget } from '../components/auth/TurnstileWidget';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Validação estrita para evitar vulnerabilidade de open redirect (suporta returnTo e redirect)
  const returnToRaw = searchParams.get('returnTo') || searchParams.get('redirect');
  const intentRaw = searchParams.get('intent');

  const baseReturnTo =
    returnToRaw && returnToRaw.startsWith('/') && !returnToRaw.startsWith('//')
      ? returnToRaw
      : '/';

  const safeReturnTo =
    intentRaw && ['create_place', 'create_event'].includes(intentRaw)
      ? `${baseReturnTo}${baseReturnTo.includes('?') ? '&' : '?'}intent=${encodeURIComponent(intentRaw)}`
      : (returnToRaw && returnToRaw.startsWith('/') && !returnToRaw.startsWith('//') ? returnToRaw : '/perfil');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [showVerificationPanel, setShowVerificationPanel] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  React.useEffect(() => {
    setPageMeta({
      title: 'Entrar na Conta',
      description: 'Acesse sua conta no Kariri.app para gerenciar favoritos e experiências no Cariri.',
    });

    if (searchParams.get('expired') === '1') {
      setErrorMsg('Sua sessão expirou (validade de 30 dias). Por favor, faça login novamente para continuar.');
    } else if (intentRaw === 'create_place') {
      setInfoMsg('Entre na sua conta para enviar uma sugestão de novo local para o guia.');
    } else if (intentRaw === 'create_event') {
      setInfoMsg('Entre na sua conta para cadastrar um novo evento cultural no Kariri.app.');
    }
  }, [searchParams, intentRaw]);

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;

    setIsResending(true);
    setResendMessage('');
    setResendError('');

    try {
      const response = await authApi.resendVerification(
        unverifiedEmail,
        turnstileToken
      );

      setResendMessage(
        response.message ||
          'Se a conta puder receber confirmação, um novo link será enviado.'
      );
    } catch (err: any) {
      if (err?.status === 429) {
        setResendError(
          'Muitas solicitações. Aguarde alguns minutos antes de tentar novamente.'
        );
      } else {
        setResendError(
          err?.message ||
            'Não foi possível reenviar o link. Tente novamente mais tarde.'
        );
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor, informe seu e-mail e sua senha.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      await login({
        email: email.trim(),
        password,
        turnstile_token: turnstileToken,
      });

      // Dispara evento de login sem PII
      analytics.track('login', {
        method: 'email_password',
        user_role: 'user',
      });

      // Retorna para a página original que exigiu autenticação ou para o perfil
      navigate(safeReturnTo);
    } catch (err: any) {
      if (err?.status === 403 && (err?.data?.requires_verification || err?.data?.email_verified === false)) {
        setUnverifiedEmail(email.trim().toLowerCase());
        setShowVerificationPanel(true);
        setErrorMsg('');
        return;
      }

      setErrorMsg(
        err?.message ||
          'Não foi possível entrar. Verifique seus dados e tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto">
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
          <h1 className="text-xl font-bold text-gray-900 pt-2">Acesse sua conta</h1>
          <p className="text-xs text-gray-500">
            Descubra o melhor de Crato, Juazeiro, Barbalha e todo o Cariri
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-[#DE1F2A] text-xs font-medium rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {showVerificationPanel && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-4 animate-in fade-in">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

              <div className="space-y-1">
                <h2 className="text-sm font-bold text-amber-950">
                  E-mail ainda não confirmado
                </h2>

                <p className="text-xs leading-relaxed text-amber-900">
                  Confirme o endereço associado à sua conta antes de entrar.
                  Verifique também a caixa de spam.
                </p>

                <p className="break-all text-xs font-semibold text-amber-950">
                  {unverifiedEmail}
                </p>
              </div>
            </div>

            <TurnstileWidget onToken={setTurnstileToken} />

            {resendMessage && (
              <p className="text-xs font-medium text-emerald-700">
                {resendMessage}
              </p>
            )}

            {resendError && (
              <p className="text-xs font-medium text-red-700">
                {resendError}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="flex-1 rounded-xl bg-[#DE1F2A] hover:bg-[#C51620] px-4 py-3 text-xs font-bold text-white disabled:opacity-50 transition active:scale-98 shadow-xs"
              >
                {isResending ? 'Reenviando...' : 'Reenviar link de confirmação'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowVerificationPanel(false);
                  setResendMessage('');
                  setResendError('');
                }}
                className="flex-1 rounded-xl bg-gray-100 hover:bg-gray-200 px-4 py-3 text-xs font-bold text-gray-800 transition"
              >
                Usar outro e-mail
              </button>
            </div>

            <Link
              to="/verificar-email"
              className="block text-center text-xs font-bold text-[#DE1F2A] hover:underline"
            >
              Já confirmei meu e-mail
            </Link>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium rounded-xl">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              E-mail
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700">Senha</label>
              <Link
                to={`/esqueci-senha${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`}
                className="text-[11px] font-semibold text-[#DE1F2A] hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Turnstile desativado temporariamente:
          <TurnstileWidget onToken={setTurnstileToken} />
          */}

          <button
            type="submit"
            disabled={isSubmitting /* || !turnstileToken */}
            className="w-full py-3 bg-[#DE1F2A] hover:bg-[#C51620] active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Entrando...' : 'Entrar'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Ainda não tem conta?{' '}
            <Link
              to={`/cadastro${returnToRaw ? `?returnTo=${encodeURIComponent(returnToRaw)}` : ''}${intentRaw ? `${returnToRaw ? '&' : '?'}intent=${encodeURIComponent(intentRaw)}` : ''}`}
              className="text-[#DE1F2A] font-bold hover:underline"
            >
              Criar conta gratuita
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
