import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api/auth';
import { USE_MOCK_DATA } from '../services/api/config';
import { analytics } from '../services/analyticsService';
import { KaririLogo } from '../components/common/KaririLogo';
import { setPageMeta } from '../utils/seo';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mockTokenLink, setMockTokenLink] = useState<string | null>(null);

  useEffect(() => {
    setPageMeta({
      title: 'Recuperar Senha - Kariri.app',
      description: 'Solicite a redefinição de senha da sua conta no Kariri.app.',
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await authApi.forgotPassword(email.trim());

      // Dispara analytics sem PII (apenas status)
      analytics.track('password_reset_request', {
        status: 'requested',
      });

      setIsSuccess(true);

      // No modo mock, recupera o token gerado para facilitar testes
      if (USE_MOCK_DATA) {
        try {
          const raw = localStorage.getItem('kariri_mock_reset_token');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.token) {
              setMockTokenLink(
                `/redefinir-senha?token=${parsed.token}&email=${encodeURIComponent(email.trim())}`
              );
            }
          }
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      if (err?.status === 429) {
        setErrorMsg(
          err?.message ||
            'Muitas tentativas em curto período. Por favor, aguarde alguns instantes antes de tentar novamente.'
        );
      } else if (err?.status === 0 || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        setErrorMsg(
          'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.'
        );
      } else if (err?.status >= 500) {
        setErrorMsg(
          'O serviço de recuperação de senha está temporariamente indisponível. Por favor, tente novamente mais tarde.'
        );
      } else {
        setErrorMsg(
          err?.message ||
            'Não foi possível processar a recuperação de senha no momento. Tente novamente mais tarde.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-xl font-bold text-gray-900 pt-2">Recuperar Senha</h1>
          <p className="text-xs text-gray-500">
            Informe o e-mail cadastrado na sua conta para receber o link de redefinição.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-[#DE1F2A] text-xs font-medium rounded-xl flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-5 py-2 animate-fade-in">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs sm:text-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Solicitação processada</span>
              </div>
              <p className="text-xs text-emerald-800/90 leading-relaxed">
                Se o e-mail informado estiver cadastrado, enviamos um link seguro com instruções para redefinição da sua senha.
                Verifique sua caixa de entrada e também a pasta de spam.
              </p>
            </div>

            {mockTokenLink && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>Ambiente de Demonstração (Mock)</span>
                </div>
                <p className="text-[11px] text-amber-800/90">
                  Como o envio de e-mails reais depende do servidor Laravel configurado, use o link simulado abaixo para prosseguir com o teste de redefinição:
                </p>
                <Link
                  to={mockTokenLink}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#DE1F2A] hover:underline pt-1"
                >
                  <span>Abrir tela de redefinição com token de teste</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition"
              >
                <span>Retornar para o Login</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                E-mail da sua conta
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#DE1F2A] hover:bg-[#C51620] active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Lembrou da sua senha?{' '}
            <Link to="/login" className="text-[#DE1F2A] font-bold hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
