import L from 'leaflet';
import { Place } from '../../types';

export interface MapCoordinates {
  lat: number;
  lng: number;
}

// Cariri Crajubar center default coordinates (between Crato, Juazeiro, Barbalha)
export const CARIRI_DEFAULT_CENTER: MapCoordinates = {
  lat: -7.2280,
  lng: -39.3500,
};

export const mapService = {
  // Tile layer using OpenStreetMap / CartoDB Voyager for high-end aesthetic map
  createTileLayer(): L.TileLayer {
    return L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    });
  },

  createCustomIcon(categorySlug?: string, isSelected: boolean = false): L.DivIcon {
    const size = isSelected ? 44 : 36;
    const bgClass = isSelected ? 'bg-[#D9262E] scale-110 shadow-lg ring-4 ring-white' : 'bg-[#1F2024] hover:bg-[#D9262E] shadow-md';

    const html = `
      <div style="position: relative; width: ${size}px; height: ${size}px;" class="transition-transform duration-200">
        <div class="w-full h-full rounded-full ${bgClass} flex items-center justify-center text-white border-2 border-white cursor-pointer">
          <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; background-color: #D9262E; border-radius: 9999px;"></div>
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

  createUserLocationIcon(): L.DivIcon {
    const html = `
      <div class="relative flex items-center justify-center w-8 h-8">
        <div class="absolute w-8 h-8 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
        <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md"></div>
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
