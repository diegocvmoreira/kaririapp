import { Place } from '../../../types';

export interface ApiPlaceRaw {
  id: number;
  owner_id?: number | null;
  city_id?: number;
  city_name?: string;
  city_slug?: string;
  category_id?: number;
  category_name?: string;
  category_slug?: string;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  zipcode?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  opening_hours?: string | null;
  price_level?: number | null;
  rating?: string | number | null;
  reviews_count?: number | null;
  featured?: number | boolean | null;
  is_featured?: boolean;
  verified?: number | boolean | null;
  status?: string;
  is_open_now?: boolean;
  cover_image?: string | null;
  image?: string | null;
  images?: string[] | null;
  tags?: string[] | null;
  distance_km?: number | null;
  created_at?: string;
  updated_at?: string;
}

// Resolução de nomes para tabelas ainda sem relacionamento 'with' no backend Laravel
const CITY_NAMES_BY_ID: Record<number, { name: string; slug: string }> = {
  1: { name: 'Crato', slug: 'crato' },
  2: { name: 'Juazeiro do Norte', slug: 'juazeiro-do-norte' },
  3: { name: 'Barbalha', slug: 'barbalha' },
};

const CATEGORY_NAMES_BY_ID: Record<number, { name: string; slug: string }> = {
  1: { name: 'Gastronomia', slug: 'gastronomia' },
  2: { name: 'Turismo', slug: 'turismo' },
  3: { name: 'Cultura & Arte', slug: 'cultura-arte' },
  4: { name: 'Vida Noturna', slug: 'vida-noturna' },
};

// Imagem neutra e realística para estabelecimentos cadastrados sem foto de capa inicial
const DEFAULT_PLACEHOLDER_COVER =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80';

/**
 * Normaliza os dados brutos da API Laravel para o tipo Place do TypeScript.
 * - Não insere dados fictícios como se fossem reais.
 * - Converte números decimais em strings ("4.60" -> 4.6).
 * - Converte flags numéricas para booleanos (featured: 1 -> is_featured: true).
 * - Preserva valores ausentes como vazios/indefinidos.
 */
export function mapApiPlaceToPlace(raw: ApiPlaceRaw): Place {
  const cityInfo = CITY_NAMES_BY_ID[raw.city_id || 1] || { name: 'Cariri', slug: 'cariri' };
  const catInfo = CATEGORY_NAMES_BY_ID[raw.category_id || 1] || { name: 'Geral', slug: 'geral' };

  const parsedRating =
    typeof raw.rating === 'string'
      ? parseFloat(raw.rating)
      : typeof raw.rating === 'number'
      ? raw.rating
      : 0;

  const latNumber =
    raw.latitude !== null && raw.latitude !== undefined
      ? typeof raw.latitude === 'string'
        ? parseFloat(raw.latitude)
        : Number(raw.latitude)
      : -7.2341; // Centro de referência para evitar quebra no Leaflet

  const lngNumber =
    raw.longitude !== null && raw.longitude !== undefined
      ? typeof raw.longitude === 'string'
        ? parseFloat(raw.longitude)
        : Number(raw.longitude)
      : -39.4124;

  const cover = raw.cover_image || raw.image || DEFAULT_PLACEHOLDER_COVER;
  const images = Array.isArray(raw.images) && raw.images.length > 0
    ? raw.images
    : [cover];

  return {
    id: Number(raw.id),
    owner_id: raw.owner_id ? Number(raw.owner_id) : null,
    name: String(raw.name || ''),
    slug: String(raw.slug || ''),
    short_description: raw.short_description || '',
    description: raw.description || raw.short_description || '',
    category_id: Number(raw.category_id || 1),
    category_name: raw.category_name || catInfo.name,
    category_slug: raw.category_slug || catInfo.slug,
    city_id: Number(raw.city_id || 1),
    city_name: raw.city_name || cityInfo.name,
    city_slug: raw.city_slug || cityInfo.slug,
    neighborhood: raw.neighborhood || '',
    address: raw.address || `${cityInfo.name} - CE`,
    zipcode: raw.zipcode || undefined,
    latitude: isNaN(latNumber) ? -7.2341 : latNumber,
    longitude: isNaN(lngNumber) ? -39.4124 : lngNumber,
    cover_image: cover,
    images,
    rating: isNaN(parsedRating) ? 0 : parsedRating,
    reviews_count: Number(raw.reviews_count || 0),
    price_level: (Number(raw.price_level) as 1 | 2 | 3 | 4) || 2,
    is_featured: Boolean(raw.featured === 1 || raw.featured === true || raw.is_featured === true),
    verified: Boolean(raw.verified === 1 || raw.verified === true),
    is_open_now: Boolean(raw.is_open_now ?? (raw.status === 'active')),
    opening_hours: raw.opening_hours || '',
    phone: raw.phone || undefined,
    whatsapp: raw.whatsapp || undefined,
    instagram: raw.instagram || undefined,
    facebook: raw.facebook || undefined,
    website: raw.website || undefined,
    status: (raw.status as Place['status']) || 'published',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    distance_km: typeof raw.distance_km === 'number' ? raw.distance_km : undefined,
  };
}
