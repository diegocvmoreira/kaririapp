import { Category } from '../../../types';

// Contrato bruto retornado pela API Laravel (MySQL)
export interface ApiCategoryRaw {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  parent_id?: number | null;
  sort_order?: number;
  status?: string;
  color?: string | null;
  count?: number;
  subcategories?: ApiCategoryRaw[];
  created_at?: string;
  updated_at?: string;
}

// Mapa de correspondência de ícones retornados pelo backend para ícones Lucide
const ICON_MAP: Record<string, string> = {
  restaurant: 'UtensilsCrossed',
  utensils: 'UtensilsCrossed',
  terrain: 'Trees',
  palette: 'Landmark',
  local_bar: 'Beer',
  hotel: 'Hotel',
  shopping_bag: 'ShoppingBag',
  local_cafe: 'Coffee',
  museum: 'Landmark',
  event: 'Calendar',
  calendar: 'Calendar',
  spa: 'Sparkles',
};

// Cores temáticas para categorias da região do Cariri
const CATEGORY_COLORS: Record<string, string> = {
  gastronomia: '#DE1F2A',
  turismo: '#0284C7',
  'cultura-arte': '#D97706',
  cultura: '#D97706',
  'vida-noturna': '#2563EB',
  lazer: '#059669',
  hospedagem: '#4F46E5',
  compras: '#EA580C',
  servicos: '#6B7280',
  eventos: '#DE1F2A',
};

/**
 * Normaliza os dados brutos da categoria da API Laravel para o tipo Category do TypeScript.
 * - Trata description quando vier null do backend.
 * - Mapeia nomes de ícones do Material para Lucide.
 * - Atribui cores temáticas consistentes com a identidade do Cariri.
 */
export function mapApiCategoryToCategory(raw: ApiCategoryRaw): Category {
  const slug = String(raw.slug || '').toLowerCase().trim();
  const rawIcon = String(raw.icon || '').toLowerCase().trim();
  const normalizedIcon = ICON_MAP[rawIcon] || raw.icon || 'Sparkles';

  return {
    id: Number(raw.id),
    name: String(raw.name || ''),
    slug,
    icon: normalizedIcon,
    description: raw.description && raw.description.trim().length > 0
      ? raw.description
      : `Descubra o melhor em ${raw.name || 'experiências'} no Cariri.`,
    image: raw.image || undefined,
    parent_id: raw.parent_id !== null && raw.parent_id !== undefined ? Number(raw.parent_id) : null,
    sort_order: Number(raw.sort_order || 0),
    status: (raw.status as Category['status']) || 'published',
    color: raw.color || CATEGORY_COLORS[slug] || '#DE1F2A',
    count: typeof raw.count === 'number' ? raw.count : undefined,
    subcategories: Array.isArray(raw.subcategories)
      ? raw.subcategories.map(mapApiCategoryToCategory)
      : [],
  };
}
