import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api/auth';
import { KaririLogo } from '../components/common/KaririLogo';
import { setPageMeta } from '../utils/seo';
import { Lock, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: 'Redefinir Senha - Kariri.app',
      description: 'Crie uma nova senha de acesso para sua conta no Kariri.app.',
    });
  }, []);

  // Mesma régua de força de senha do cadastro
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
    setIsTokenExpired(false);

    if (!token) {
      setErrorMsg('Token de recuperação não identificado. Utilize o link enviado ao seu e-mail.');
      setIsTokenExpired(true);
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor, confirme o e-mail associado à sua conta.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('A nova senha deve conter no mínimo 8 caracteres.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMsg('A confirmação de senha não coincide com a nova senha digitada.');
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        token,
        password,
        password_confirmation: passwordConfirmation,
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3500);
    } catch (err: any) {
      const msg =
        err?.message ||
        'Não foi possível redefinir sua senha. O link pode ter expirado ou ser inválido.';
      setErrorMsg(msg);

      if (
        err?.status === 400 ||
        msg.toLowerCase().includes('expir') ||
        msg.toLowerCase().includes('inválid') ||
        msg.toLowerCase().includes('token')
      ) {
        setIsTokenExpired(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const missingUrlParams = !token;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto animate-fade-in">
      <div className="w-full mb-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao login</span>
        </Link>
      </div>

      <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <KaririLogo size="lg" className="justify-center" />
          <h1 className="text-xl font-bold text-gray-900 pt-2">Criar Nova Senha</h1>
          <p className="text-xs text-gray-500">
            Defina uma senha segura para restabelecer o acesso à sua conta.
          </p>
        </div>

        {missingUrlParams ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Link de redefinição incompleto ou inválido</p>
                <p className="text-xs text-amber-800/90 leading-relaxed">
                  Não localizamos o código de validação na URL. Por favor, acesse o link completo recebido por e-mail ou solicite um novo envio.
                </p>
              </div>
            </div>

            <Link
              to="/esqueci-senha"
              className="w-full py-3 bg-[#DE1F2A] hover:bg-[#C51620] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition"
            >
              <span>Solicitar novo link de recuperação</span>
              <RefreshCw className="w-4 h-4" />
            </Link>
          </div>
        ) : isSuccess ? (
          <div className="space-y-4 py-2 text-center animate-fade-in">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-gray-900">Senha Alterada com Sucesso!</h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                Sua credencial de acesso foi atualizada. Você será redirecionado para o login em instantes...
              </p>
            </div>
            <Link
              to="/login"
              className="w-full py-3 bg-[#DE1F2A] hover:bg-[#C51620] text-white rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm transition"
            >
              <span>Entrar agora</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-[#DE1F2A] text-xs font-medium rounded-xl flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span>{errorMsg}</span>
                  {isTokenExpired && (
                    <div className="pt-1">
                      <Link
                        to="/esqueci-senha"
                        className="font-bold underline text-xs block hover:text-red-800"
                      >
                        Clique aqui para solicitar um novo link de recuperação.
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                E-mail cadastrado
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Nova Senha <span className="text-red-500">*</span>
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
                Confirmar Nova Senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Repita a nova senha"
                  minLength={8}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A] focus:bg-white transition"
                />
              </div>
              {passwordConfirmation && password !== passwordConfirmation && (
                <span className="text-[10px] text-red-500 block mt-1">As senhas não coincidem</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#DE1F2A] hover:bg-[#C51620] active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 mt-2"
            >
              <span>{isSubmitting ? 'Salvando nova senha...' : 'Salvar nova senha'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
