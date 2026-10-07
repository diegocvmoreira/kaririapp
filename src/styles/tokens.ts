// Design System Tokens for KARIRI.APP
// Fonte da Verdade do Design System (Documento Mestre Seção 5)

export const tokens = {
  colors: {
    primary: '#D9262E', // Vermelho Cariri / Soldadinho do Araripe
    primaryHover: '#BF1E25',
    primaryLight: '#FDE8E9',
    secondary: '#1F2024', // Grafite / Charcoal
    secondaryLight: '#374151',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceAlt: '#F3F4F6',
    surfaceHover: '#F9FAFB',
    text: '#111827',
    textSecondary: '#4B5563',
    muted: '#6B7280',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    brandFont: "'Caveat', cursive",
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
    },
  },
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.25rem',// 20px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },
  spacing: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },
  breakpoints: {
    xs: '360px',
    sm: '375px',
    mobileMd: '390px',
    mobileLg: '414px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1440px',
  },
} as const;

export type DesignTokens = typeof tokens;
