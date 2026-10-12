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
  5: { name: 'Natureza & Trilhas', slug: 'natureza-e-trilhas' },
  6: { name: 'Compras & Artesanato', slug: 'compras-e-artesanato' },
  7: { name: 'Religiosidade', slug: 'religiosidade' },
  8: { name: 'Serviços', slug: 'servicos' },
  9: { name: 'Eventos', slug: 'eventos' },
};

export const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  gastronomia: '/placeholders/gastronomia.svg',
  turismo: '/placeholders/turismo.svg',
  'cultura-arte': '/placeholders/cultura.svg',
  'vida-noturna': '/placeholders/local.svg',
  'natureza-e-trilhas': '/placeholders/natureza.svg',
  'compras-e-artesanato': '/placeholders/compras.svg',
  religiosidade: '/placeholders/religiosidade.svg',
  servicos: '/placeholders/servicos.svg',
  eventos: '/placeholders/eventos.svg',
};

/**
 * Normaliza os dados brutos da API Laravel para o tipo Place do TypeScript.
 * - Jamais insere coordenadas padrão (Crato/Juazeiro/Barbalha) quando latitude ou longitude forem nulas/indefinidas.
 * - Preserva null estrito para locais sem coordenadas confirmadas.
 * - Converte números decimais em strings ("4.60" -> 4.6).
 * - Converte flags numéricas para booleanos (featured: 1 -> is_featured: true).
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
    raw.latitude === null || raw.latitude === undefined || raw.latitude === ''
      ? null
      : Number(raw.latitude);

  const lngNumber =
    raw.longitude === null || raw.longitude === undefined || raw.longitude === ''
      ? null
      : Number(raw.longitude);

  const finalLatitude = Number.isFinite(latNumber) ? (latNumber as number) : null;
  const finalLongitude = Number.isFinite(lngNumber) ? (lngNumber as number) : null;

  const categorySlug = raw.category_slug || catInfo.slug;
  const placeholderCover = CATEGORY_PLACEHOLDERS[categorySlug] || '/placeholders/local.svg';
  const cover = raw.cover_image || raw.image || placeholderCover;
  const images = Array.isArray(raw.images) && raw.images.length > 0
    ? raw.images
    : [];

  return {
    id: Number(raw.id),
    owner_id: raw.owner_id ? Number(raw.owner_id) : null,
    name: String(raw.name || ''),
    slug: String(raw.slug || ''),
    short_description: raw.short_description || '',
    description: raw.description || raw.short_description || '',
    category_id: Number(raw.category_id || 1),
    category_name: raw.category_name || catInfo.name,
    category_slug: categorySlug,
    city_id: Number(raw.city_id || 1),
    city_name: raw.city_name || cityInfo.name,
    city_slug: raw.city_slug || cityInfo.slug,
    neighborhood: raw.neighborhood || '',
    address: raw.address || `${cityInfo.name} - CE`,
    zipcode: raw.zipcode || undefined,
    latitude: finalLatitude,
    longitude: finalLongitude,
    coordinate_source: (raw as Record<string, unknown>).coordinate_source as string | undefined,
    coordinate_confidence: (raw as Record<string, unknown>).coordinate_confidence as string | undefined,
    needs_review: (raw as Record<string, unknown>).needs_review !== undefined
      ? Boolean((raw as Record<string, unknown>).needs_review)
      : true,
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
    status: (raw.status as Place['status']) || 'pending',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    distance_km: typeof raw.distance_km === 'number' ? raw.distance_km : undefined,
  };
}
