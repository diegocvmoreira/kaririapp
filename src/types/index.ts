// Entidades do Domínio para KARIRI.APP
// Alinhado rigorosamente com o Documento Mestre Seção 24 (Banco de Dados) e Seção 25 (Relacionamentos)

export type UserRole = 'visitor' | 'user' | 'business' | 'admin';
export type EntityStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'archived';
export type ClaimStatus = 'pending' | 'reviewed' | 'approved' | 'rejected';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status?: string;
  city_preference?: string;
  created_at?: string;
}

export interface City {
  id: number;
  name: string;
  slug: string;
  state: string;
  latitude: number;
  longitude: number;
  image?: string;
  status?: string;
  is_active: boolean;
  places_count?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  image?: string;
  parent_id?: number | null;
  sort_order?: number;
  status?: EntityStatus;
  color?: string;
  count?: number;
  subcategories?: Category[];
}

export interface Review {
  id: number;
  place_id: number;
  user_id?: number;
  user_name: string;
  user_avatar?: string;
  rating: number;
  title?: string;
  content?: string;
  comment: string; // alias for compatibility
  status?: EntityStatus;
  created_at: string;
}

export interface PlaceImage {
  id: number;
  place_id: number;
  path: string;
  alt?: string;
  caption?: string;
  sort_order?: number;
  is_cover: boolean;
}

export interface Place {
  id: number;
  owner_id?: number | null;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  city_id: number;
  city_name: string;
  city_slug: string;
  neighborhood: string;
  address: string;
  zipcode?: string;
  latitude: number;
  longitude: number;
  cover_image: string;
  images: string[];
  rating: number;
  reviews_count: number;
  price_level: 1 | 2 | 3 | 4; // 1 = $, 2 = $$, 3 = $$$, 4 = $$$$
  is_featured: boolean;
  verified?: boolean;
  is_open_now: boolean;
  opening_hours: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  status?: EntityStatus;
  tags: string[];
  distance_km?: number;
  reviews?: Review[];
}

export interface EventItem {
  id: number;
  place_id?: number | null;
  city_id?: number;
  category_id?: number;
  title: string;
  slug: string;
  description: string;
  cover_image: string;
  start_date: string;
  end_date?: string;
  display_date: string;
  start_time: string;
  end_time?: string;
  place_name: string;
  city_name: string;
  city_slug: string;
  address: string;
  price_text: string;
  price?: number;
  is_free: boolean;
  ticket_url?: string;
  organizer?: string;
  category: string;
  is_featured: boolean;
  status?: EntityStatus;
}

export interface BusinessClaim {
  id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  place_id: number;
  place_name?: string;
  message: string;
  proof?: string;
  phone?: string;
  status: ClaimStatus;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface Report {
  id: number;
  user_id?: number;
  place_id?: number;
  event_id?: number;
  type: string;
  message: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface SearchFilters {
  query?: string;
  city_slug?: string;
  category_slug?: string;
  subcategories?: string[];
  min_rating?: number;
  price_levels?: number[];
  open_now?: boolean;
  is_featured?: boolean;
  sort_by?: 'featured' | 'rating' | 'reviews' | 'distance';
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
  };
  message?: string;
}
