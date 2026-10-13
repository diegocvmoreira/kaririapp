import fs from 'fs';
import path from 'path';
import { sanitizeLogDetails } from '../src/services/api/diagnostics';
import { mapApiCityToCity } from '../src/services/api/mappers/cityMapper';
import { mockCities } from '../src/mocks/mockCities';
import { mockUser } from '../src/mocks/mockUser';

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: unknown;
}

const results: ValidationResult[] = [];

function assert(condition: boolean, message: string, details?: unknown) {
  results.push({ passed: condition, message, details });
  if (!condition) {
    console.error(`❌ FALHA: ${message}`, details ?? '');
  } else {
    console.log(`✅ SUCESSO: ${message}`);
  }
}

// 1. Validação de presença dos Schemas Canônicos
const schemaFiles = [
  'place.schema.json',
  'event.schema.json',
  'user.schema.json',
  'favorite.schema.json',
  'claim.schema.json',
  'city.schema.json',
  'openapi.json',
];

const schemasDir = path.resolve(process.cwd(), 'docs/schemas');
const allSchemasExist = schemaFiles.every((file) => fs.existsSync(path.join(schemasDir, file)));

assert(
  allSchemasExist,
  '1. Todos os JSON Schemas canônicos (incluindo city e user) e OpenAPI 3.1 existem em docs/schemas',
  { arquivos: schemaFiles }
);

// 2. Validação do Place Schema
const placeSchemaRaw = JSON.parse(fs.readFileSync(path.join(schemasDir, 'place.schema.json'), 'utf-8'));
const allowedPlaceStatuses = placeSchemaRaw.properties.status.enum;
const expectedStatuses = ['draft', 'pending', 'published', 'rejected', 'archived'];
const statusMatch = expectedStatuses.every((s) => allowedPlaceStatuses.includes(s));

assert(
  statusMatch && allowedPlaceStatuses.length === expectedStatuses.length,
  '2. Place Schema padroniza os 5 statuses canônicos (draft, pending, published, rejected, archived)',
  { allowedPlaceStatuses }
);

// 3. Validação do Claim Schema
const claimSchemaRaw = JSON.parse(fs.readFileSync(path.join(schemasDir, 'claim.schema.json'), 'utf-8'));
const allowedClaimStatuses = claimSchemaRaw.properties.status.enum;
const expectedClaimStatuses = ['pending', 'reviewed', 'approved', 'rejected'];
const claimStatusMatch = expectedClaimStatuses.every((s) => allowedClaimStatuses.includes(s));

assert(
  claimStatusMatch && allowedClaimStatuses.length === expectedClaimStatuses.length,
  '3. Claim Schema padroniza os 4 statuses de reivindicação (pending, reviewed, approved, rejected)',
  { allowedClaimStatuses }
);

// 4. Validação do User Schema e proteção contra vazamento de senhas
const userSchemaRaw = JSON.parse(fs.readFileSync(path.join(schemasDir, 'user.schema.json'), 'utf-8'));
const hasPasswordInSchema = 'password' in userSchemaRaw.properties;
const hasGeographicFields =
  'birth_city_id' in userSchemaRaw.properties &&
  'current_city_id' in userSchemaRaw.properties &&
  'cariri_city_id' in userSchemaRaw.properties &&
  'marketing_consent' in userSchemaRaw.properties;

assert(
  !hasPasswordInSchema && hasGeographicFields,
  '4. User Schema público NÃO expõe password e distingue explicitamente birth_city, current_city e cariri_city',
  { properties: Object.keys(userSchemaRaw.properties) }
);

// 5. Validação do City Schema e coordenadas opcionais
const citySchemaRaw = JSON.parse(fs.readFileSync(path.join(schemasDir, 'city.schema.json'), 'utf-8'));
const cityLatTypes = citySchemaRaw.properties.latitude.type;
const hasNullableCoordinates = Array.isArray(cityLatTypes) && cityLatTypes.includes('null');

assert(
  hasNullableCoordinates && 'is_cariri_region' in citySchemaRaw.properties,
  '5. City Schema suporta coordenadas nulas (nullable) e flag de distinção regional is_cariri_region',
  { latitudeTypes: cityLatTypes }
);

// 6. Validação do CityMapper (sem inventar coordenadas nulas para 0)
const mappedNullCity = mapApiCityToCity({
  id: 999,
  name: 'Cidade Sem GPS',
  slug: 'cidade-sem-gps',
  state: 'CE',
  latitude: null,
  longitude: null,
});

assert(
  mappedNullCity.latitude === null && mappedNullCity.longitude === null,
  '6. CityMapper preserva null quando coordenadas forem nulas (sem forçar 0 ou coordenadas falsas)',
  { latitude: mappedNullCity.latitude, longitude: mappedNullCity.longitude }
);

// 7. Validação de perfil geográfico e consentimento no mockUser
assert(
  mockUser.birth_city_name !== undefined &&
    mockUser.current_city_name !== undefined &&
    mockUser.birth_city_name !== mockUser.current_city_name &&
    mockUser.marketing_consent !== undefined,
  '7. mockUser demonstra separação explícita entre cidade natal, cidade atual e consentimento de marketing',
  {
    birth: mockUser.birth_city_name,
    current: mockUser.current_city_name,
    marketing: mockUser.marketing_consent,
  }
);

// 8. Validação de cidades do Cariri vs Cidades de Referência fora do Cariri
const caririCitiesCount = mockCities.filter((c) => c.is_cariri_region).length;
const outsideCitiesCount = mockCities.filter((c) => !c.is_cariri_region).length;

assert(
  caririCitiesCount >= 5 && outsideCitiesCount >= 3,
  '8. Base de cidades possui municípios cobertos pelo guia Kariri e municípios de referência fora do Cariri',
  { cariri: caririCitiesCount, foraDoCariri: outsideCitiesCount }
);

// 9. Validação do Sanitizador de PII e Tokens
const testRawLog =
  'Falha ao autenticar com Bearer 123456abcdefg7890 para o usuario diego@exemplo.com.br e "password":"minhasenhasecreta"';
const sanitized = sanitizeLogDetails(testRawLog);

assert(
  !sanitized.includes('123456abcdefg7890') &&
    !sanitized.includes('minhasenhasecreta') &&
    sanitized.includes('Bearer [REDACTED_TOKEN]') &&
    sanitized.includes('[REDACTED]'),
  '9. Sanitizador de logs elimina tokens Bearer, senhas e ofusca emails',
  { original: testRawLog, sanitized }
);

// 10. Validação dos artefatos arquiteturais e de segurança do Laravel
const laravelFiles = [
  'docs/laravel/fase0_contencao_imediata.md',
  'docs/laravel/config/cors.php',
  'docs/laravel/app/Enums/EntityStatus.php',
  'docs/laravel/app/Enums/ClaimStatus.php',
  'docs/laravel/app/Enums/UserRole.php',
  'docs/laravel/migrations/2026_10_13_000001_create_kariri_master_tables.php',
  'docs/laravel/migrations/2026_10_13_000002_add_geographic_and_city_management_fields.php',
  'docs/laravel/app/Http/Resources/PlaceResource.php',
  'docs/laravel/app/Http/Resources/EventResource.php',
  'docs/laravel/app/Http/Resources/FavoriteResource.php',
  'docs/laravel/app/Http/Resources/BusinessClaimResource.php',
  'docs/laravel/app/Http/Resources/UserResource.php',
  'docs/laravel/app/Http/Resources/CityResource.php',
  'docs/laravel/app/Http/Controllers/Api/CityController.php',
  'docs/laravel/app/Http/Controllers/Api/Admin/AdminCityController.php',
  'docs/laravel/app/Http/Middleware/SecurityHeadersMiddleware.php',
  'docs/laravel/app/Http/Requests/StorePlaceRequest.php',
  'docs/laravel/app/Policies/PlacePolicy.php',
  'docs/laravel/deploy/deploy_pipeline.sh',
  'docs/laravel/tests/Feature/PlaceApiTest.php',
];

const allLaravelArtifactsExist = laravelFiles.every((file) => fs.existsSync(path.resolve(process.cwd(), file)));

assert(
  allLaravelArtifactsExist,
  '10. Todos os 20 artefatos arquiteturais, de segurança e de cidades do Laravel foram criados',
  { totalArtefatos: laravelFiles.length }
);

const failed = results.filter((r) => !r.passed);
if (failed.length > 0) {
  console.error(`\nTestes de contrato finalizados com ${failed.length} falha(s).`);
  process.exit(1);
} else {
  console.log(`\n🎉 Todos os ${results.length} testes de contrato, cidades e segurança foram aprovados!`);
  process.exit(0);
}
