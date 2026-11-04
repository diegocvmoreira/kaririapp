import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface EmailVerificationBannerProps {
  actionLabel?: string;
  variant?: 'banner' | 'card' | 'inline';
  className?: string;
  dismissible?: boolean;
}

export const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  actionLabel,
  variant = 'card',
  className = '',
  dismissible = false,
}) => {
  const { user, isAuthenticated, isEmailVerified } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Se não estiver logado ou já estiver com e-mail verificado, não exibe
  if (!isAuthenticated || isEmailVerified || dismissed) {
    return null;
  }

  const emailParam = user?.email ? encodeURIComponent(user.email) : '';
  const verifyUrl = `/verificar-email?email=${emailParam}`;

  if (variant === 'inline') {
    return (
      <div
        role="alert"
        className={`flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="truncate">
            {actionLabel
              ? `Confirme seu e-mail para ${actionLabel}.`
              : 'Confirme seu e-mail para desbloquear todos os recursos.'}
          </span>
        </div>
        <Link
          to={verifyUrl}
          className="shrink-0 font-bold text-[#DE1F2A] hover:underline flex items-center gap-1 min-h-[36px]"
        >
          <span>Confirmar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        role="alert"
        className={`w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2 mx-auto max-w-7xl w-full">
          <Mail className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="flex-1 text-[11px] sm:text-xs">
            <strong className="font-bold">E-mail não confirmado:</strong>{' '}
            {actionLabel
              ? `Para ${actionLabel}, precisamos validar seu endereço de e-mail.`
              : `Enviamos um link de confirmação para ${user?.email || 'seu e-mail'}. Confirme-o para publicar avaliações e contribuições.`}
          </p>
          <Link
            to={verifyUrl}
            className="shrink-0 px-3 py-1 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition text-[11px] flex items-center gap-1 shadow-xs"
          >
            <span>Verificar e-mail</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          {dismissible && (
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-1 text-amber-700 hover:text-amber-900 rounded-md"
              aria-label="Dispensar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Padrão: card
  return (
    <div
      role="alert"
      className={`relative p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/80 shadow-xs space-y-3 ${className}`}
    >
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1 text-amber-700 hover:text-amber-900 rounded-lg hover:bg-amber-100/50 transition"
          aria-label="Dispensar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5" />
        </div>
        <div className="space-y-1 pr-6">
          <h3 className="text-xs sm:text-sm font-bold text-amber-950">
            {actionLabel
              ? `Confirmação de e-mail necessária para ${actionLabel}`
              : 'Confirme seu endereço de e-mail'}
          </h3>
          <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed">
            Sua conta está conectada como <strong className="font-semibold">{user?.email}</strong>,
            mas ainda não foi verificada. Para evitar spam e proteger a comunidade do Kariri.app, recursos como
            avaliações, envio de novos locais/eventos e reivindicação de empresas requerem e-mail confirmado.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 pl-12">
        <Link
          to={verifyUrl}
          className="px-4 py-2 bg-[#DE1F2A] hover:bg-[#C51620] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
        >
          <span>Confirmar e-mail agora</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <span className="text-[11px] text-amber-700">
          Leva menos de 1 minuto
        </span>
      </div>
    </div>
  );
};
