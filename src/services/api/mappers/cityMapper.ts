import { City } from '../../../types';

// Contrato bruto retornado pela API Laravel (MySQL)
export interface ApiCityRaw {
  id: number;
  name: string;
  slug: string;
  state?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  status?: string;
  is_active?: boolean;
  image?: string | null;
  places_count?: number;
  created_at?: string;
  updated_at?: string;
}

// Imagens padrão de alta resolução para as cidades principais caso a API retorne null
const DEFAULT_CITY_IMAGES: Record<string, string> = {
  'crato': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
  'juazeiro-do-norte': 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
  'barbalha': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
};

/**
 * Normaliza os dados brutos da API Laravel para o tipo City do TypeScript.
 * - Converte strings decimais de latitude/longitude ("-7.31130000") para numbers.
 * - Normaliza o campo status ("active") para o booleano is_active.
 * - Garante fallback de imagem para municípios conhecidos se vier null.
 */
export function mapApiCityToCity(raw: ApiCityRaw): City {
  const latNumber = raw.latitude !== null && raw.latitude !== undefined
    ? (typeof raw.latitude === 'string' ? parseFloat(raw.latitude) : Number(raw.latitude))
    : 0;

  const lngNumber = raw.longitude !== null && raw.longitude !== undefined
    ? (typeof raw.longitude === 'string' ? parseFloat(raw.longitude) : Number(raw.longitude))
    : 0;

  const slug = String(raw.slug || '').toLowerCase().trim();

  return {
    id: Number(raw.id),
    name: String(raw.name || ''),
    slug,
    state: String(raw.state || 'CE'),
    latitude: isNaN(latNumber) ? 0 : latNumber,
    longitude: isNaN(lngNumber) ? 0 : lngNumber,
    image: raw.image || DEFAULT_CITY_IMAGES[slug] || undefined,
    status: raw.status || 'active',
    is_active: raw.status === 'active' || raw.is_active === true,
    places_count: typeof raw.places_count === 'number' ? raw.places_count : undefined,
  };
}
