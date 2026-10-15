/**
 * Utilitários Geográficos e Cálculo de Distâncias Reais (Haversine)
 * Alinhado às diretrizes de precisão do Kariri.app:
 * - Jamais inventa distâncias se o lugar ou a referência não tiverem coordenadas válidas.
 * - Utiliza a fórmula de Haversine esférica com o raio médio da Terra (6.371 km).
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Valida se um par de coordenadas é composto por números finitos e dentro dos intervalos válidos.
 */
export function isValidCoordinate(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  if (lat === null || lat === undefined || typeof lat !== 'number' || !Number.isFinite(lat)) {
    return false;
  }
  if (lng === null || lng === undefined || typeof lng !== 'number' || !Number.isFinite(lng)) {
    return false;
  }
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Calcula a distância em quilômetros entre dois pontos geográficos usando a fórmula de Haversine.
 * Retorna null se qualquer coordenada for inválida ou nula (sem fallback arbitrário).
 */
export function calculateHaversineDistanceKm(
  lat1: number | null | undefined,
  lon1: number | null | undefined,
  lat2: number | null | undefined,
  lon2: number | null | undefined
): number | null {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    return null;
  }

  // Raio médio da Terra em km
  const EARTH_RADIUS_KM = 6371;
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRadians((lat2 as number) - (lat1 as number));
  const dLon = toRadians((lon2 as number) - (lon1 as number));

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1 as number)) *
      Math.cos(toRadians(lat2 as number)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  // Arredonda para 1 casa decimal (ex.: 0.8 km, 2.4 km)
  return Math.round(distance * 10) / 10;
}

/**
 * Aplica distâncias reais aos lugares a partir de uma coordenada de referência
 * e opcionalmente ordena por proximidade.
 * - Lugares com coordenadas válidas recebem distance_km calculado com precisão.
 * - Lugares sem coordenadas válidas permanecem estritamente com distance_km = undefined (sem inventar distâncias).
 */
export function enrichAndSortPlacesByDistance<T extends { latitude: number | null; longitude: number | null; distance_km?: number }>(
  places: T[],
  referenceCoords?: Coordinates | null,
  sortByDistance: boolean = true
): T[] {
  if (!referenceCoords || !isValidCoordinate(referenceCoords.latitude, referenceCoords.longitude)) {
    // Sem coordenadas de referência válidas: não calcula nem inventa distâncias
    return places.map((place) => ({
      ...place,
      distance_km: place.distance_km !== undefined ? place.distance_km : undefined,
    }));
  }

  const enriched = places.map((place) => {
    const dist = calculateHaversineDistanceKm(
      referenceCoords.latitude,
      referenceCoords.longitude,
      place.latitude,
      place.longitude
    );

    return {
      ...place,
      // Se não tem coordenadas válidas no cadastro, distance_km fica undefined
      distance_km: dist !== null ? dist : undefined,
    };
  });

  if (!sortByDistance) {
    return enriched;
  }

  // Ordena por proximidade:
  // Lugares com distância calculada vêm primeiro (da menor para a maior).
  // Lugares sem coordenadas (distance_km === undefined) vão para o final da lista.
  return enriched.sort((a, b) => {
    const hasDistA = typeof a.distance_km === 'number';
    const hasDistB = typeof b.distance_km === 'number';

    if (hasDistA && hasDistB) {
      return (a.distance_km as number) - (b.distance_km as number);
    }
    if (hasDistA && !hasDistB) return -1;
    if (!hasDistA && hasDistB) return 1;
    return 0;
  });
}
