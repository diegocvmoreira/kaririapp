import React from 'react';

export interface KaririLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'white' | 'symbol' | 'icon' | 'icon-dark';
  withSymbol?: boolean;
}

const LOGO_HEIGHTS: Record<string, string> = {
  xs: 'h-5',
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-12',
  xl: 'h-14',
};

const SYMBOL_SIZES: Record<string, string> = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-12 h-12',
  xl: 'w-14 h-14',
};

export const KaririLogo: React.FC<KaririLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'dark',
  withSymbol = false,
}) => {
  // Símbolo compacto (gota/pássaro a 45°)
  if (variant === 'symbol') {
    return (
      <img
        src="/favicon.svg"
        alt="Símbolo Kariri"
        className={`${SYMBOL_SIZES[size]} shrink-0 object-contain ${className}`}
        loading="eager"
        decoding="async"
      />
    );
  }

  // Ícone de app squircle positivo (fundo vermelho)
  if (variant === 'icon') {
    return (
      <img
        src="/app-icon.svg"
        alt="Ícone Kariri.app"
        className={`${SYMBOL_SIZES[size]} shrink-0 object-contain rounded-2xl shadow-xs ${className}`}
        loading="eager"
        decoding="async"
      />
    );
  }

  // Ícone de app squircle escuro (fundo preto)
  if (variant === 'icon-dark') {
    return (
      <img
        src="/app-icon-dark.svg"
        alt="Ícone Kariri.app Escuro"
        className={`${SYMBOL_SIZES[size]} shrink-0 object-contain rounded-2xl shadow-xs ${className}`}
        loading="eager"
        decoding="async"
      />
    );
  }

  // Versão horizontal oficial (Positiva escura ou Negativa branca)
  const logoSrc = variant === 'white' ? '/logo-white.svg' : '/logo.svg';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {withSymbol && (
        <img
          src="/favicon.svg"
          alt=""
          aria-hidden="true"
          className={`${SYMBOL_SIZES[size]} shrink-0 object-contain`}
          loading="eager"
          decoding="async"
        />
      )}
      <img
        src={logoSrc}
        alt="Kariri.app.br"
        className={`${LOGO_HEIGHTS[size]} w-auto shrink-0 object-contain`}
        loading="eager"
        decoding="async"
      />
    </div>
  );
};
