/**
 * Serviço Unificado de Analytics (GA4 + GTM + Consent Mode + LGPD Shield)
 *
 * Filtro rigoroso anti-PII:
 * NUNCA envia e-mail, telefone, senha, token, nome completo, texto de avaliações,
 * endereço pessoal ou dados sensíveis de reivindicação.
 */

import { hasConsent } from './consentService';
import { KaririEventMap, KaririEventName } from '../types/analytics';

// ID do GA4 ou GTM a partir de variáveis de ambiente com fallback para desenvolvimento
export const GA_MEASUREMENT_ID =
  (import.meta as unknown as { env?: { VITE_GA_MEASUREMENT_ID?: string } }).env?.VITE_GA_MEASUREMENT_ID ||
  'G-KARIRI2026';

export const GTM_CONTAINER_ID =
  (import.meta as unknown as { env?: { VITE_GTM_CONTAINER_ID?: string } }).env?.VITE_GTM_CONTAINER_ID ||
  '';

// Lista de chaves proibidas que são removidas caso passem acidentalmente
const FORBIDDEN_PII_KEYS = new Set([
  'email',
  'e-mail',
  'mail',
  'phone',
  'telefone',
  'cellphone',
  'whatsapp_number',
  'password',
  'senha',
  'token',
  'auth_token',
  'bearer',
  'name',
  'full_name',
  'nome',
  'nome_completo',
  'user_name',
  'cpf',
  'cnpj',
  'document',
  'address',
  'endereco',
  'street',
  'rua',
  'comment',
  'content',
  'review_text',
  'proof_document',
  'claim_notes',
]);

/**
 * Sanitizador estrito que remove qualquer chave ou padrão de PII de objetos de analytics
 */
export function sanitizeAnalyticsPayload<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(data)) {
    const keyLower = key.toLowerCase();

    // Rejeita qualquer chave na lista proibida
    if (FORBIDDEN_PII_KEYS.has(keyLower)) {
      continue;
    }

    if (val === null || val === undefined) {
      continue;
    }

    // Se o valor for string, verificar padrões óbvios de e-mail ou tokens
    if (typeof val === 'string') {
      // Rejeita strings que parecem e-mails
      if (val.includes('@') && val.includes('.')) {
        continue;
      }
      // Rejeita telefones longos
      if (val.replace(/\D/g, '').length >= 10 && !isNaN(Number(val.replace(/\D/g, '')))) {
        continue;
      }
      // Limita tamanho para evitar payloads volumosos de texto livre
      sanitized[key] = val.slice(0, 100);
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      sanitized[key] = val;
    } else if (typeof val === 'object' && !Array.isArray(val)) {
      sanitized[key] = sanitizeAnalyticsPayload(val as Record<string, unknown>);
    }
  }

  return sanitized;
}

// Histórico local em memória para debug, testes e painel de diagnóstico
export interface AnalyticsHistoryItem {
  event: string;
  params: Record<string, unknown>;
  timestamp: string;
  dispatchedToGA4: boolean;
  consentGranted: boolean;
}

const localEventHistory: AnalyticsHistoryItem[] = [];
const MAX_HISTORY_ITEMS = 100;

export class AnalyticsService {
  private static instance: AnalyticsService;
  private initialized: boolean = false;
  private scriptLoaded: boolean = false;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Carrega a tag do GA4 de forma assíncrona após consentimento de analytics concedido
   */
  public loadTagIfConsented(): void {
    if (typeof window === 'undefined') return;
    if (this.scriptLoaded) return;

    if (!hasConsent('analytics')) {
      return;
    }

    try {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      if (!window.gtag) {
        window.gtag = function () {
          window.dataLayer.push(arguments);
        };
      }

      window.gtag('js', new Date());
      window.gtag('config', GA_MEASUREMENT_ID, {
        send_page_view: false, // SPA gerencia page_view manualmente
        anonymize_ip: true,
        cookie_flags: 'SameSite=Lax;Secure',
      });

      this.scriptLoaded = true;
    } catch (e) {
      console.warn('Erro ao carregar script do Google Analytics:', e);
    }
  }

  /**
   * Inicializa o serviço e escuta alterações de consentimento
   */
  public init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Tenta carregar a tag se consentimento já estiver concedido
    this.loadTagIfConsented();

    // Escuta evento customizado de atualização de consentimento
    if (typeof window !== 'undefined') {
      window.addEventListener('kariri:consent_updated', () => {
        this.loadTagIfConsented();
      });
    }
  }

  /**
   * Dispara um evento tipado para GA4 / dataLayer garantindo consentimento e filtro de PII
   */
  public track<K extends KaririEventName>(eventName: K, params: KaririEventMap[K]): void {
    const consentGranted = hasConsent('analytics');
    const sanitizedParams = sanitizeAnalyticsPayload(params as Record<string, unknown>);

    const historyRecord: AnalyticsHistoryItem = {
      event: eventName,
      params: sanitizedParams,
      timestamp: new Date().toISOString(),
      dispatchedToGA4: consentGranted && typeof window !== 'undefined' && Boolean(window.gtag),
      consentGranted,
    };

    localEventHistory.unshift(historyRecord);
    if (localEventHistory.length > MAX_HISTORY_ITEMS) {
      localEventHistory.pop();
    }

    // Se consentimento não foi concedido, apenas armazena em buffer de auditoria local
    if (!consentGranted) {
      return;
    }

    // Garante que o script do GA4 está montado
    this.loadTagIfConsented();

    // Envio para GA4 via gtag
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, sanitizedParams);
    }

    // Envio para GTM via dataLayer
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...sanitizedParams,
      });
    }
  }

  /**
   * Dispara page_view em navegação SPA
   */
  public trackPageView(path: string, title: string): void {
    this.track('page_view', {
      page_path: path,
      page_title: title,
      page_location: typeof window !== 'undefined' ? window.location.href : '',
    });
  }

  /**
   * Retorna os eventos capturados na sessão para auditoria e relatórios
   */
  public getEventHistory(): AnalyticsHistoryItem[] {
    return [...localEventHistory];
  }

  /**
   * Limpa histórico em memória (para testes)
   */
  public clearHistory(): void {
    localEventHistory.length = 0;
  }
}

export const analytics = AnalyticsService.getInstance();
