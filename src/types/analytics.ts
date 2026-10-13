/**
 * Tipos e Definições de Eventos de Analytics do Kariri.app
 *
 * Em total conformidade com a LGPD e Diretrizes de Privacidade:
 * NENHUM dado pessoal identificável (PII) é enviado.
 * Proibidos: e-mail, telefone, senha, token, nome completo, conteúdo de review,
 * endereço pessoal residencial, dados de claims confidenciais.
 */

export interface BaseEventParams {
  page_path?: string;
  page_title?: string;
  [key: string]: unknown;
}

// 1. page_view
export interface PageViewParams extends BaseEventParams {
  page_path: string;
  page_title: string;
  page_location?: string;
}

// 2. search
export interface SearchParams extends BaseEventParams {
  search_term: string;
  results_count?: number;
  category_slug?: string;
  city_slug?: string;
}

// 3. city_selected
export interface CitySelectedParams extends BaseEventParams {
  city_id: number;
  city_slug: string;
  city_name: string;
  selection_context: 'header' | 'modal' | 'filter' | 'explore' | 'manual';
  is_cariri_region: boolean;
}

// 4. category_selected
export interface CategorySelectedParams extends BaseEventParams {
  category_id: number;
  category_slug: string;
  category_name: string;
}

// 5. place_view
export interface PlaceViewParams extends BaseEventParams {
  place_id: number;
  place_slug: string;
  place_name: string;
  category_slug: string;
  city_slug: string;
  is_verified?: boolean;
}

// 6. event_view
export interface EventViewParams extends BaseEventParams {
  event_id: number;
  event_slug: string;
  event_title: string;
  city_slug: string;
  is_free?: boolean;
}

// 7. map_open
export interface MapOpenParams extends BaseEventParams {
  source_context?: 'navbar' | 'place_card' | 'place_detail' | 'button';
  initial_city_slug?: string;
}

// 8. directions_click
export interface DirectionsClickParams extends BaseEventParams {
  target_id: number;
  target_type: 'place' | 'event';
  target_slug: string;
  city_slug: string;
}

// 9. whatsapp_click
export interface WhatsappClickParams extends BaseEventParams {
  place_id: number;
  place_slug: string;
  city_slug: string;
  category_slug?: string;
}

// 10. phone_click
export interface PhoneClickParams extends BaseEventParams {
  place_id: number;
  place_slug: string;
  city_slug: string;
}

// 11. website_click
export interface WebsiteClickParams extends BaseEventParams {
  place_id: number;
  place_slug: string;
  city_slug: string;
}

// 12. favorite_add & 13. favorite_remove
export interface FavoriteEventParams extends BaseEventParams {
  item_id: number;
  item_type: 'place' | 'event';
  item_slug: string;
  city_slug?: string;
}

// 14. sign_up_start
export interface SignUpStartParams extends BaseEventParams {
  source_page?: string;
}

// 15. sign_up
export interface SignUpParams extends BaseEventParams {
  method: 'email_password';
  has_birth_city: boolean;
  has_current_city: boolean;
  cariri_preferred_city?: string;
  marketing_consent: boolean;
}

// 16. login
export interface LoginParams extends BaseEventParams {
  method: 'email_password';
  user_role: 'visitor' | 'user' | 'business' | 'admin';
}

// 17. password_reset_request
export interface PasswordResetRequestParams extends BaseEventParams {
  status: 'requested';
}

// 18. review_start
export interface ReviewStartParams extends BaseEventParams {
  place_id: number;
  place_slug: string;
}

// 19. review_submit & 20. review_published
export interface ReviewParams extends BaseEventParams {
  place_id: number;
  place_slug: string;
  rating: number; // 1-5
  has_title?: boolean;
}

// 21. claim_start
export interface ClaimStartParams extends BaseEventParams {
  place_id: number;
  place_slug: string;
}

// 22. claim_submit & 23. claim_approved
export interface ClaimParams extends BaseEventParams {
  place_id: number;
  place_slug: string;
  claim_role_type?: string; // ex: 'owner' | 'manager'
}

// 24. share_place
export interface SharePlaceParams extends BaseEventParams {
  place_id: number;
  place_slug: string;
  share_channel: 'whatsapp' | 'native_share' | 'copy_link';
}

// 25. share_event
export interface ShareEventParams extends BaseEventParams {
  event_id: number;
  event_slug: string;
  share_channel: 'whatsapp' | 'native_share' | 'copy_link';
}

// 26. install_pwa
export interface InstallPwaParams extends BaseEventParams {
  outcome: 'accepted' | 'dismissed';
  platform?: string;
}

// 27. api_error (agregado por status HTTP, sem PII)
export interface ApiErrorEventParams extends BaseEventParams {
  http_status: number;
  endpoint_path: string;
  diagnostic_category?: string;
}

export type KaririEventMap = {
  page_view: PageViewParams;
  search: SearchParams;
  city_selected: CitySelectedParams;
  category_selected: CategorySelectedParams;
  place_view: PlaceViewParams;
  event_view: EventViewParams;
  map_open: MapOpenParams;
  directions_click: DirectionsClickParams;
  whatsapp_click: WhatsappClickParams;
  phone_click: PhoneClickParams;
  website_click: WebsiteClickParams;
  favorite_add: FavoriteEventParams;
  favorite_remove: FavoriteEventParams;
  sign_up_start: SignUpStartParams;
  sign_up: SignUpParams;
  login: LoginParams;
  password_reset_request: PasswordResetRequestParams;
  review_start: ReviewStartParams;
  review_submit: ReviewParams;
  review_published: ReviewParams;
  claim_start: ClaimStartParams;
  claim_submit: ClaimParams;
  claim_approved: ClaimParams;
  share_place: SharePlaceParams;
  share_event: ShareEventParams;
  install_pwa: InstallPwaParams;
  api_error: ApiErrorEventParams;
};

export type KaririEventName = keyof KaririEventMap;
