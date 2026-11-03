import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api/auth';
import { ApiError } from '../services/api/config';
import { TurnstileWidget } from '../components/auth/TurnstileWidget';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const verified = searchParams.get('verified') === '1';
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const resend = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSending(true);
    try {
      const response = await authApi.resendVerification(email, turnstileToken);
      setMessage(response.message);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.userFriendlyMessage || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Não foi possível reenviar o link agora.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl border border-gray-100 space-y-5">
        {verified ? (
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
        ) : (
          <Mail className="mx-auto h-14 w-14 text-[#DE1F2A]" />
        )}
        <h1 className="text-2xl font-bold text-gray-900">
          {verified ? 'E-mail confirmado' : 'Confirme seu e-mail'}
        </h1>
        <p className="text-sm text-gray-600">
          {verified
            ? 'Sua conta está pronta. Faça login para continuar.'
            : 'Use o link recebido por e-mail para ativar sua conta.'}
        </p>

        {!verified && (
          <form onSubmit={resend} className="space-y-3 text-left">
            <label className="block text-sm font-semibold text-gray-700" htmlFor="verification-email">
              Reenviar para
            </label>
            <input
              id="verification-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#DE1F2A]"
              placeholder="seu.email@exemplo.com"
            />
            <TurnstileWidget onToken={setTurnstileToken} />
            {error && <p className="text-sm text-red-600 flex gap-2"><AlertCircle className="h-4 w-4" />{error}</p>}
            {message && <p className="text-sm text-emerald-700">{message}</p>}
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-xl bg-[#DE1F2A] py-3 font-bold text-white disabled:opacity-50"
            >
              {sending ? 'Enviando...' : 'Reenviar link'}
            </button>
          </form>
        )}

        <Link to="/login" className="inline-block font-bold text-[#DE1F2A] hover:underline">
          Ir para o login
        </Link>
      </div>
    </div>
  );
};
