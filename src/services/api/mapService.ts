import L from 'leaflet';

export interface MapCoordinates {
  lat: number;
  lng: number;
}

// Cariri Crajubar center default coordinates (between Crato, Juazeiro, Barbalha)
export const CARIRI_DEFAULT_CENTER: MapCoordinates = {
  lat: -7.2280,
  lng: -39.3500,
};

/**
 * Normaliza o slug da categoria removendo acentos e caracteres especiais
 */
function normalizeCategorySlug(slug?: string): string {
  if (!slug) return '';
  return slug
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '')
    .trim();
}

/**
 * Retorna a cor e o SVG do ícone conforme o slug da categoria
 */
function getCategoryVisualConfig(categorySlug?: string): { color: string; svgContent: string } {
  const normalized = normalizeCategorySlug(categorySlug);

  // 1. gastronomia: laranja (#EA580C)
  if (normalized === 'gastronomia' || normalized.includes('gastronomia') || normalized.includes('restaurante')) {
    return {
      color: '#EA580C',
      svgContent: `
        <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 11v11" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 2v20M6 2c2 0 3 2 3 5s-1 5-3 5" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      `,
    };
  }

  // 2. turismo: azul (#0284C7)
  if (normalized === 'turismo' || normalized.includes('turismo') || normalized.includes('atrac')) {
    return {
      color: '#0284C7',
      svgContent: `
        <path d="m8 3 4 8 5-5 5 15H2L8 3z" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      `,
    };
  }

  // 3. cultura-arte: vermelho (#DE1F2A)
  if (normalized === 'cultura-arte' || normalized.includes('cultura') || normalized.includes('arte') || normalized.includes('museu')) {
    return {
      color: '#DE1F2A',
      svgContent: `
        <path d="M9 18V5l12-2v13" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="6" cy="18" r="3" fill="#FFFFFF"/>
        <circle cx="18" cy="16" r="3" fill="#FFFFFF"/>
      `,
    };
  }

  // 4. vida-noturna: roxo (#9333EA)
  if (normalized === 'vida-noturna' || normalized.includes('vida-noturna') || normalized.includes('bar') || normalized.includes('noite')) {
    return {
      color: '#9333EA',
      svgContent: `
        <path d="M8 22h8M12 15v7M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      `,
    };
  }

  // 5. natureza-e-trilhas: verde (#16A34A)
  if (normalized === 'natureza-e-trilhas' || normalized.includes('natureza') || normalized.includes('trilha') || normalized.includes('parque')) {
    return {
      color: '#16A34A',
      svgContent: `
        <path d="M11 20A7 7 0 0 1 4 13a10 10 0 0 1 10-10 7 7 0 0 1 7 7c0 5.5-4.5 10-10 10zM2 21c0-4.5 4-8.5 8.5-8.5" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      `,
    };
  }

  // 6. compras-e-artesanato: dourado (#D97706)
  if (normalized === 'compras-e-artesanato' || normalized.includes('compra') || normalized.includes('artesanato') || normalized.includes('shopping')) {
    return {
      color: '#D97706',
      svgContent: `
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 10a4 4 0 0 1-8 0" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
      `,
    };
  }

  // 7. religiosidade: roxo escuro (#581C87)
  if (normalized === 'religiosidade' || normalized.includes('religia') || normalized.includes('fe') || normalized.includes('igreja') || normalized.includes('santuario')) {
    return {
      color: '#581C87',
      svgContent: `
        <path d="M12 2v20M7 8h10" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
      `,
    };
  }

  // 8. servicos: cinza azulado (#475569)
  if (normalized === 'servicos' || normalized.includes('servico') || normalized.includes('utilidade')) {
    return {
      color: '#475569',
      svgContent: `
        <rect x="2" y="7" width="20" height="14" rx="2" fill="none" stroke="#FFFFFF" stroke-width="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" fill="none" stroke="#FFFFFF" stroke-width="2"/>
      `,
    };
  }

  // 9. eventos: laranja (#F59E0B)
  if (normalized === 'eventos' || normalized.includes('evento') || normalized.includes('show') || normalized.includes('festa')) {
    return {
      color: '#F59E0B',
      svgContent: `
        <rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="#FFFFFF" stroke-width="2"/>
        <line x1="16" y1="2" x2="16" y2="6" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
        <line x1="8" y1="2" x2="8" y2="6" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
        <line x1="3" y1="10" x2="21" y2="10" stroke="#FFFFFF" stroke-width="2"/>
      `,
    };
  }

  // Categoria padrão
  return {
    color: '#000000',
    svgContent: `
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="10" r="3" fill="#FFFFFF"/>
    `,
  };
}

export const mapService = {
  /**
   * Tile layer usando OpenStreetMap oficial com Leaflet (100% livre de chaves de API)
   */
  createTileLayer(): L.TileLayer {
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
      crossOrigin: true,
    });
  },

  /**
   * Marcador customizado por categoria com estilos inline independentes do Tailwind.
   * Quando selecionado:
   * - aumenta o tamanho;
   * - usa a cor principal #DE1F2A;
   * - adiciona borda/ring branco;
   * - mantém o mesmo ícone da categoria.
   */
  createCustomIcon(categorySlug?: string, isSelected: boolean = false): L.DivIcon {
    const config = getCategoryVisualConfig(categorySlug);
    const size = isSelected ? 44 : 34;
    const iconSize = isSelected ? 20 : 16;
    const pinColor = isSelected ? '#DE1F2A' : config.color;
    const ringStyle = isSelected
      ? 'box-shadow: 0 0 0 3px #FFFFFF, 0 10px 20px rgba(0, 0, 0, 0.4); border: 2px solid #FFFFFF;'
      : 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); border: 2px solid #FFFFFF;';

    const html = `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; pointer-events: auto;">
        <div style="width: 100%; height: 100%; border-radius: 9999px; background-color: ${pinColor}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; ${ringStyle}">
          <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" style="display: block;">
            ${config.svgContent}
          </svg>
        </div>
        <div style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; background-color: ${pinColor}; border-radius: 9999px; box-shadow: 0 1px 3px rgba(0,0,0,0.35);"></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'kariri-marker-pin',
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size],
    });
  },

  /**
   * Marcador de localização do usuário com estilos inline seguros
   */
  createUserLocationIcon(): L.DivIcon {
    const html = `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 28px; height: 28px; background-color: #3B82F6; border-radius: 9999px; opacity: 0.35;"></div>
        <div style="position: relative; width: 14px; height: 14px; background-color: #1D4ED8; border-radius: 9999px; border: 2px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'kariri-user-pin',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  },

  async getUserLocation(): Promise<MapCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  },
};
