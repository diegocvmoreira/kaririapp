/**
 * Serviço de Consentimento e Cookies (LGPD / Google Consent Mode v2)
 *
 * Gerencia preferências de consentimento:
 * - necessary (sempre true)
 * - functionality (preferências de interface e cidade de navegação)
 * - analytics (GA4, métricas de navegação, conversão)
 * - marketing (publicidade/remarketing, campanhas)
 */

export interface CookieConsentPreferences {
  necessary: boolean; // Sempre true
  functionality: boolean; // UI / preferências
  analytics: boolean; // GA4 / métricas
  marketing: boolean; // Campanhas / anúncios
}

export interface StoredConsentRecord {
  version: string;
  timestamp: string;
  preferences: CookieConsentPreferences;
  source: string;
}

const CONSENT_STORAGE_KEY = 'kariri_cookie_consent_v1';
const CONSENT_POLICY_VERSION = '2026.1';

// Declaração de tipos globais para gtag / dataLayer
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

/**
 * Inicializa Google Consent Mode v2 com padrão NEGADO (Privacy by Default)
 * Deve ser chamado antes de qualquer tag carregar
 */
export function initializeGoogleConsentMode(): void {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  // Verificar se já existe consentimento salvo
  const saved = getStoredConsent();

  if (!saved) {
    // Padrão estrito da LGPD: Tudo negado até manifestação livre do usuário
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500,
    });
  } else {
    // Aplicar consentimento salvo previamente
    applyGoogleConsent(saved.preferences);
  }
}

/**
 * Atualiza o Google Consent Mode de acordo com a escolha explícita do usuário
 */
export function applyGoogleConsent(prefs: CookieConsentPreferences): void {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('consent', 'update', {
    ad_storage: prefs.marketing ? 'granted' : 'denied',
    ad_user_data: prefs.marketing ? 'granted' : 'denied',
    ad_personalization: prefs.marketing ? 'granted' : 'denied',
    analytics_storage: prefs.analytics ? 'granted' : 'denied',
  });
}

/**
 * Retorna o consentimento armazenado no navegador
 */
export function getStoredConsent(): StoredConsentRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredConsentRecord;
  } catch {
    return null;
  }
}

/**
 * Salva a decisão de consentimento e notifica o Google Consent Mode
 */
export function saveConsentDecision(
  prefs: Omit<CookieConsentPreferences, 'necessary'>,
  source: string = 'cookie_banner'
): StoredConsentRecord {
  const fullPrefs: CookieConsentPreferences = {
    necessary: true,
    functionality: Boolean(prefs.functionality),
    analytics: Boolean(prefs.analytics),
    marketing: Boolean(prefs.marketing),
  };

  const record: StoredConsentRecord = {
    version: CONSENT_POLICY_VERSION,
    timestamp: new Date().toISOString(),
    preferences: fullPrefs,
    source,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    } catch (e) {
      console.warn('Não foi possível salvar consentimento em localStorage:', e);
    }

    // Atualiza Google Consent Mode v2
    applyGoogleConsent(fullPrefs);

    // Dispara evento customizado para reatividade na SPA
    window.dispatchEvent(
      new CustomEvent('kariri:consent_updated', { detail: record })
    );
  }

  return record;
}

/**
 * Verifica se uma determinada categoria possui consentimento ativo
 */
export function hasConsent(category: keyof CookieConsentPreferences): boolean {
  if (category === 'necessary') return true;
  const stored = getStoredConsent();
  if (!stored) return false;
  return Boolean(stored.preferences[category]);
}

/**
 * Revoga todos os cookies opcionais (mantém apenas necessários)
 */
export function revokeOptionalConsent(): StoredConsentRecord {
  return saveConsentDecision(
    {
      functionality: false,
      analytics: false,
      marketing: false,
    },
    'user_revocation'
  );
}
