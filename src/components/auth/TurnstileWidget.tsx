import React, { useEffect, useRef } from 'react';
// import { USE_MOCK_DATA } from '../../services/api/config';

/*
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void; 'error-callback'?: () => void; theme?: 'light' | 'dark' | 'auto' }) => string;
      reset: (widgetId?: string) => void;
    };
  }
}
*/

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
}

// const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({ onToken }) => {
  /*
  // Turnstile desativado temporariamente a pedido do usuário.
  // Código original mantido como comentário para reativação futura:
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (USE_MOCK_DATA || !containerRef.current) {
      onToken('mock-token');
      return;
    }

    if (!SITE_KEY) {
      console.error('VITE_TURNSTILE_SITE_KEY não configurada para o ambiente real.');
      onToken('');
      return;
    }

    let widgetId: string | undefined;
    let cancelled = false;
    const render = () => {
      if (!cancelled && containerRef.current && window.turnstile) {
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: 'light',
          callback: onToken,
          'expired-callback': () => onToken(''),
          'error-callback': () => onToken(''),
        });
      }
    };

    if (window.turnstile) {
      render();
    } else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', render, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
    };
  }, [onToken]);

  if (USE_MOCK_DATA) return null;
  return <div ref={containerRef} className="min-h-[65px]" aria-label="Verificação de segurança" />;
  */

  // Turnstile desativado temporariamente
  useEffect(() => {
    onToken('');
  }, [onToken]);

  return null;
};
