import { City } from '../../../types';

// Contrato bruto retornado pela API Laravel (MySQL)
export interface ApiCityRaw {
  id: number;
  name: string;
  slug: string;
  state?: string;
  country?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  status?: string;
  is_active?: boolean;
  is_cariri_region?: boolean;
  image?: string | null;
  places_count?: number;
  events_count?: number;
  created_at?: string;
  updated_at?: string;
}

// Imagens padrão de alta resolução para as cidades principais caso a API retorne null
const DEFAULT_CITY_IMAGES: Record<string, string> = {
  'crato': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
  'juazeiro-do-norte': 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
  'barbalha': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
};

// Slugs conhecidos da região metropolitana / bacia do Cariri Cearense
const CARIRI_SLUGS = new Set([
  'juazeiro-do-norte',
  'crato',
  'barbalha',
  'nova-olinda',
  'santana-do-cariri',
  'missao-velha',
  'jardim',
  'brejo-santo',
  'mauriti',
  'porteiras',
  'milagres',
  'caririacu',
  'farias-brito',
  'altaneira',
  'assare',
  'antonina-do-norte',
  'araripe',
  'campos-sales',
  'potengi',
  'salitre',
  'abaiara',
  'barro',
  'aurora',
  'cedro',
  'penaforte',
  'jati',
]);

/**
 * Normaliza os dados brutos da API Laravel para o tipo City do TypeScript.
 * - Converte strings decimais de latitude/longitude para numbers ou null (sem inventar coordenadas).
 * - Normaliza o campo status ("active") para o booleano is_active.
 * - Distingue explicitamente se a cidade pertence ao território atendido pelo catálogo do Cariri.
 */
export function mapApiCityToCity(raw: ApiCityRaw): City {
  let latNumber: number | null = null;
  if (raw.latitude !== null && raw.latitude !== undefined && raw.latitude !== '') {
    const parsed = typeof raw.latitude === 'string' ? parseFloat(raw.latitude) : Number(raw.latitude);
    latNumber = isNaN(parsed) ? null : parsed;
  }

  let lngNumber: number | null = null;
  if (raw.longitude !== null && raw.longitude !== undefined && raw.longitude !== '') {
    const parsed = typeof raw.longitude === 'string' ? parseFloat(raw.longitude) : Number(raw.longitude);
    lngNumber = isNaN(parsed) ? null : parsed;
  }

  const slug = String(raw.slug || '').toLowerCase().trim();
  const isCariri = raw.is_cariri_region !== undefined
    ? Boolean(raw.is_cariri_region)
    : CARIRI_SLUGS.has(slug);

  return {
    id: Number(raw.id),
    name: String(raw.name || ''),
    slug,
    state: String(raw.state || 'CE').toUpperCase(),
    country: String(raw.country || 'Brasil'),
    latitude: latNumber,
    longitude: lngNumber,
    image: raw.image || DEFAULT_CITY_IMAGES[slug] || undefined,
    status: raw.status || 'active',
    is_active: raw.status === 'active' || raw.is_active === true,
    is_cariri_region: isCariri,
    places_count: typeof raw.places_count === 'number' ? raw.places_count : undefined,
    events_count: typeof raw.events_count === 'number' ? raw.events_count : undefined,
  };
}
