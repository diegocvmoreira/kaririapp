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
  opening_hours?: string | Record<string, unknown> | null;
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
  needs_review?: boolean | null;
  coordinate_source?: string | null;
  coordinate_confidence?: string | null;
  distance_km?: number | null;
  tags?: string[] | null;
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
 * Traduz e formata valores de horário de funcionamento para exibição limpa em português.
 * Suporta strings, JSON em string e objetos com chaves de dias ({ monday, tuesday, ... }).
 */
export function formatOpeningHours(raw: unknown): string {
  if (!raw) return '';

  // Se for string, verifica se é um JSON serializado
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return formatOpeningHours(parsed);
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  // Se for array
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>;
          const day = rec.day || rec.dia || '';
          const hours = rec.hours || rec.horario || rec.time || '';
          if (day && hours) return `${day}: ${hours}`;
          return formatOpeningHours(item);
        }
        return String(item);
      })
      .filter(Boolean)
      .join(' • ');
  }

  // Se for objeto com dias da semana (ex: { monday: "...", tuesday: "...", ... })
  if (typeof raw === 'object' && raw !== null) {
    const dayMap: Record<string, { label: string; order: number }> = {
      monday: { label: 'Seg', order: 1 },
      mon: { label: 'Seg', order: 1 },
      segunda: { label: 'Seg', order: 1 },
      seg: { label: 'Seg', order: 1 },

      tuesday: { label: 'Ter', order: 2 },
      tue: { label: 'Ter', order: 2 },
      terca: { label: 'Ter', order: 2 },
      terça: { label: 'Ter', order: 2 },
      ter: { label: 'Ter', order: 2 },

      wednesday: { label: 'Qua', order: 3 },
      wed: { label: 'Qua', order: 3 },
      quarta: { label: 'Qua', order: 3 },
      qua: { label: 'Qua', order: 3 },

      thursday: { label: 'Qui', order: 4 },
      thu: { label: 'Qui', order: 4 },
      quinta: { label: 'Qui', order: 4 },
      qui: { label: 'Qui', order: 4 },

      friday: { label: 'Sex', order: 5 },
      fri: { label: 'Sex', order: 5 },
      sexta: { label: 'Sex', order: 5 },
      sex: { label: 'Sex', order: 5 },

      saturday: { label: 'Sáb', order: 6 },
      sat: { label: 'Sáb', order: 6 },
      sabado: { label: 'Sáb', order: 6 },
      sábado: { label: 'Sáb', order: 6 },
      sab: { label: 'Sáb', order: 6 },

      sunday: { label: 'Dom', order: 7 },
      sun: { label: 'Dom', order: 7 },
      domingo: { label: 'Dom', order: 7 },
      dom: { label: 'Dom', order: 7 },
    };

    const normalizeHourValue = (val: unknown): string => {
      if (val === null || val === undefined || val === false || val === '') return 'Fechado';
      if (typeof val === 'string') {
        const lower = val.trim().toLowerCase();
        if (lower === 'closed' || lower === 'fechado') return 'Fechado';
        if (lower === '24 hours' || lower === '24h' || lower === '24 horas') return '24 horas';
        return val.trim();
      }
      if (typeof val === 'object' && val !== null) {
        const v = val as Record<string, unknown>;
        const open = v.open || v.start || v.from || v.opens;
        const close = v.close || v.end || v.to || v.closes;
        if (open && close) return `${open} - ${close}`;
        if (v.closed || v.fechado) return 'Fechado';
      }
      return String(val);
    };

    const entries: { key: string; label: string; order: number; hours: string }[] = [];
    const unrecognized: string[] = [];

    for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      const meta = dayMap[lowerKey];
      const hours = normalizeHourValue(val);
      if (meta) {
        entries.push({ key: lowerKey, label: meta.label, order: meta.order, hours });
      } else {
        unrecognized.push(`${key}: ${hours}`);
      }
    }

    if (entries.length === 0 && unrecognized.length > 0) {
      return unrecognized.join(' • ');
    }

    entries.sort((a, b) => a.order - b.order);

    // Se todos os 7 dias tiverem o mesmo horário
    if (entries.length === 7 && entries.every((e) => e.hours === entries[0].hours)) {
      return entries[0].hours === 'Fechado'
        ? 'Temporariamente fechado'
        : `Todos os dias: ${entries[0].hours}`;
    }

    // Agrupa dias consecutivos com horários idênticos
    const groups: { startLabel: string; endLabel: string; hours: string }[] = [];
    for (const entry of entries) {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.hours === entry.hours) {
        lastGroup.endLabel = entry.label;
      } else {
        groups.push({
          startLabel: entry.label,
          endLabel: entry.label,
          hours: entry.hours,
        });
      }
    }

    const formattedGroups = groups.map((g) => {
      const range = g.startLabel === g.endLabel ? g.startLabel : `${g.startLabel} a ${g.endLabel}`;
      return `${range}: ${g.hours}`;
    });

    if (unrecognized.length > 0) {
      formattedGroups.push(...unrecognized);
    }

    return formattedGroups.join(' • ');
  }

  return String(raw);
}

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
    coordinate_source: raw.coordinate_source || undefined,
    coordinate_confidence: raw.coordinate_confidence || undefined,
    needs_review: raw.needs_review !== undefined && raw.needs_review !== null
      ? Boolean(raw.needs_review)
      : false,
    cover_image: cover,
    images,
    rating: isNaN(parsedRating) ? 0 : parsedRating,
    reviews_count: Number(raw.reviews_count || 0),
    price_level: (Number(raw.price_level) as 1 | 2 | 3 | 4) || 2,
    is_featured: Boolean(raw.featured === 1 || raw.featured === true || raw.is_featured === true),
    verified: Boolean(raw.verified === 1 || raw.verified === true),
    is_open_now: Boolean(raw.is_open_now ?? (raw.status === 'active')),
    opening_hours: formatOpeningHours(raw.opening_hours),
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
