import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KaririLogo } from '../components/common/KaririLogo';
import { setPageMeta } from '../utils/seo';
import { Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    setPageMeta({
      title: 'Entrar na Conta',
      description: 'Acesse sua conta no Kariri.app para gerenciar favoritos e experiências.',
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await login({ email, password });
      navigate('/perfil');
    } catch {
      setErrorMsg('Não foi possível realizar o login. Verifique seus dados.');
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

      <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <KaririLogo size="lg" className="justify-center" />
          <h1 className="text-xl font-bold text-gray-900 pt-2">Acesse sua conta</h1>
          <p className="text-xs text-gray-500">
            Descubra o melhor de Crato, Juazeiro e Barbalha
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-[#D9262E] text-xs font-medium rounded-xl">
            {errorMsg}
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
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#D9262E] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700">Senha</label>
              <a
                href="#esqueci"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Recuperação de senha via e-mail será ativada no backend Laravel.');
                }}
                className="text-[11px] font-semibold text-[#D9262E] hover:underline"
              >
                Esqueceu a senha?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#D9262E] focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#D9262E] hover:bg-[#BF1E25] active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Entrando...' : 'Entrar'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="text-[#D9262E] font-bold hover:underline">
              Criar conta gratuita
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
