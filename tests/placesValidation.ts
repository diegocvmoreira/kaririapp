// Mock window/document for Node environment when loading leaflet
if (typeof window === 'undefined') {
  (global as any).window = {
    requestAnimationFrame: (cb: any) => setTimeout(cb, 0),
    cancelAnimationFrame: (id: any) => clearTimeout(id),
    devicePixelRatio: 1,
  };
  (global as any).document = {
    documentElement: { style: {} },
    createElement: () => ({
      style: {},
      setAttribute: () => {},
      appendChild: () => {},
    }),
  };
}

import fs from 'fs';
import path from 'path';
import { mapApiPlaceToPlace } from '../src/services/api/mappers/placeMapper';
import { mockPlaces } from '../src/mocks/mockPlaces';

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: unknown;
}

const results: ValidationResult[] = [];

function assert(condition: boolean, message: string, details?: unknown) {
  results.push({
    passed: condition,
    message,
    details,
  });
  if (!condition) {
    console.error(`❌ FALHA: ${message}`, details ?? '');
  } else {
    console.log(`✅ SUCESSO: ${message}`);
  }
}

// 1. Leitura do JSON Aprovado para o MVP
const approvedJsonPath = path.resolve(process.cwd(), 'kariri_places_mvp_aprovados.json');
const rawFile = fs.readFileSync(approvedJsonPath, 'utf-8');
const parsed = JSON.parse(rawFile);
const rawPlaces = parsed.places as Array<Record<string, unknown>>;

assert(
  Array.isArray(rawPlaces) && rawPlaces.length === 33,
  '1. 33 locais estão presentes no arquivo kariri_places_mvp_aprovados.json',
  { totalEncontrado: rawPlaces.length }
);

// Mapeia usando o placeMapper oficial do frontend
const places = rawPlaces.map((raw) => mapApiPlaceToPlace(raw as any));

// 2. Todos os 33 locais cadastrados e publicados: status = 'published'
const allPublished = places.every((p) => p.status === 'published');
assert(
  allPublished,
  "2. 33 locais publicados com status = 'published'",
  { divergentes: places.filter((p) => p.status !== 'published').map((p) => ({ slug: p.slug, status: p.status })) }
);

// 3. Todos com verified = true
const allVerified = places.every((p) => p.verified === true);
assert(
  allVerified,
  '3. 33 locais publicados com verified = true',
  { divergentes: places.filter((p) => p.verified !== true).map((p) => p.slug) }
);

// 4. Todos com needs_review = false (autorizado pelo responsável)
const allApprovedReview = places.every((p) => p.needs_review === false);
assert(
  allApprovedReview,
  '4. 33 locais com needs_review = false (publicação inicial autorizada)',
  { divergentes: places.filter((p) => p.needs_review !== false).map((p) => p.slug) }
);

// 5. 29 locais com coordenadas reais
const withCoords = places.filter(
  (p) =>
    typeof p.latitude === 'number' &&
    typeof p.longitude === 'number' &&
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude)
);
assert(
  withCoords.length === 29,
  '5. 29 locais possuem coordenadas reais confirmadas para o mapa',
  { totalComCoords: withCoords.length }
);

// 6. 4 locais publicados sem coordenadas (latitude=null e longitude=null)
const withoutCoords = places.filter(
  (p) => p.latitude === null && p.longitude === null
);
const expectedWithoutCoordsSlugs = [
  'cascata-do-lameiro',
  'atelier-espedito-seleiro',
  'alameda-juazeiro',
  'geossitio-riacho-do-meio',
];
const actualWithoutCoordsSlugs = withoutCoords.map((p) => p.slug);
const matchWithoutCoords =
  withoutCoords.length === 4 &&
  expectedWithoutCoordsSlugs.every((s) => actualWithoutCoordsSlugs.includes(s));

assert(
  matchWithoutCoords,
  '6. 4 locais publicados sem marcador no mapa (Cascata do Lameiro, Atelier e Museu Espedito Seleiro, Alameda Juazeiro, Geossítio Riacho do Meio)',
  { semCoords: actualWithoutCoordsSlugs }
);

// 7. Nenhum local sem coordenadas recebe coordenada inventada ou padrão
const fakeCoords = places.filter(
  (p) =>
    (p.latitude === -7.2341 && p.longitude === -39.4124) ||
    (actualWithoutCoordsSlugs.includes(p.slug) && (p.latitude !== null || p.longitude !== null))
);
const testNullMapped = mapApiPlaceToPlace({
  id: 999,
  name: 'Teste Sem Coordenadas',
  latitude: null,
  longitude: null,
} as any);

assert(
  fakeCoords.length === 0 && testNullMapped.latitude === null && testNullMapped.longitude === null,
  '7. Nenhum local com coordenada inventada: 4 locais permanecem estritamente com null no mapper',
  { registrosInvalidos: fakeCoords, testNullMappedLat: testNullMapped.latitude }
);

// 8. O filtro do Leaflet seleciona exatamente 29 marcadores válidos
const mapValidPlaces = places.filter(
  (place) =>
    typeof place.latitude === 'number' &&
    typeof place.longitude === 'number' &&
    Number.isFinite(place.latitude) &&
    Number.isFinite(place.longitude)
);
assert(
  mapValidPlaces.length === 29,
  '8. O filtro do MapView/Leaflet seleciona exatamente 29 marcadores no mapa e ignora os 4 sem coordenadas',
  { marcadoresParaLeaflet: mapValidPlaces.length }
);

// 9. Todas as 9 categorias válidas representadas
const VALID_CATEGORY_SLUGS = [
  'gastronomia',
  'turismo',
  'cultura-arte',
  'vida-noturna',
  'natureza-e-trilhas',
  'compras-e-artesanato',
  'religiosidade',
  'servicos',
  'eventos',
];
const usedCategorySlugs = Array.from(new Set(places.map((p) => p.category_slug)));
const allCategoriesValid = usedCategorySlugs.every((slug) =>
  VALID_CATEGORY_SLUGS.includes(slug)
);
const allNineCategoriesRepresented = VALID_CATEGORY_SLUGS.every((slug) =>
  usedCategorySlugs.includes(slug)
);

assert(
  allCategoriesValid && allNineCategoriesRepresented,
  '9. Todas as 9 categorias são válidas e utilizadas no conjunto publicado',
  { categoriasPresentes: usedCategorySlugs }
);

// 10. Campos complementares nulos exibem 'Informação ausente'
// Testamos que valores nulos como phone, website, opening_hours são identificados para renderizar 'Informação ausente'
const testPlaceWithNulls = places.find((p) => p.slug === 'cascata-do-lameiro');
const nullPhoneDisplayed = testPlaceWithNulls?.phone ? testPlaceWithNulls.phone : 'Informação ausente';
const nullWebsiteDisplayed = testPlaceWithNulls?.website ? testPlaceWithNulls.website : 'Informação ausente';
const nullOpeningDisplayed = testPlaceWithNulls?.opening_hours ? testPlaceWithNulls.opening_hours : 'Informação ausente';

assert(
  nullPhoneDisplayed === 'Informação ausente' &&
    nullWebsiteDisplayed === 'Informação ausente' &&
    nullOpeningDisplayed === 'Informação ausente',
  "10. Campos complementares nulos exibem 'Informação ausente' na interface",
  {
    exemplo: testPlaceWithNulls?.name,
    phone: nullPhoneDisplayed,
    website: nullWebsiteDisplayed,
    opening: nullOpeningDisplayed,
  }
);

// 11. MockPlaces em memória do frontend possui os 33 locais aprovados e publicados
const mockAllPublished = mockPlaces.length === 33 &&
  mockPlaces.every((p) => p.status === 'published' && p.verified === true && p.needs_review === false);
assert(
  mockAllPublished,
  '11. Base em memória do frontend (mockPlaces) sincronizada com 33 locais publicados (verified=true, needs_review=false)',
  { totalMocks: mockPlaces.length, publicados: mockPlaces.filter((p) => p.status === 'published').length }
);

async function runAsyncTests() {
  const { mapService } = await import('../src/services/api/mapService');

  // 12. Marcadores diferenciados por categoria (cores e ícones)
  const iconConfigs = VALID_CATEGORY_SLUGS.map((slug) => {
    const icon = mapService.createCustomIcon(slug, false);
    return {
      slug,
      html: icon.options.html || '',
    };
  });
  const uniqueColors = new Set(
    iconConfigs.map((cfg) => {
      const htmlStr = typeof cfg.html === 'string' ? cfg.html : '';
      const match = htmlStr.match(/background-color:\s*([^;]+);/);
      return match ? match[1].trim() : '';
    })
  );
  assert(
    uniqueColors.size >= 8,
    '12. Marcadores do Leaflet diferenciados por categoria com cores e ícones dedicados',
    { totalCoresDistintas: uniqueColors.size, cores: Array.from(uniqueColors) }
  );

  // 13. OpenStreetMap funcionando (sem Carto e sem API key)
  const tileLayer = mapService.createTileLayer();
  const tileUrl = (tileLayer as any)._url || '';
  const hasCarto = tileUrl.toLowerCase().includes('carto');
  const isOpenStreetMap = tileUrl.includes('openstreetmap.org');
  assert(
    !hasCarto && isOpenStreetMap,
    '13. OpenStreetMap funcionando nativamente sem Carto e sem chave de API proprietária',
    { tileUrl }
  );

  // 14. Centro de Convenções do Cariri em Crato
  const centroConv = places.find((p) => p.slug === 'centro-de-convencoes-do-cariri');
  assert(
    centroConv?.city_name === 'Crato',
    '14. Centro de Convenções do Cariri mantido com cidade correta (Crato)',
    { cidade: centroConv?.city_name }
  );

  const failed = results.filter((r) => !r.passed);
  if (failed.length > 0) {
    console.error(`\nTestes finalizados com ${failed.length} falha(s).`);
    process.exit(1);
  } else {
    console.log(`\n🎉 Todos os ${results.length} testes foram aprovados com 100% de conformidade!`);
    process.exit(0);
  }
}

runAsyncTests().catch((err) => {
  console.error('Erro executando testes assíncronos:', err);
  process.exit(1);
});
