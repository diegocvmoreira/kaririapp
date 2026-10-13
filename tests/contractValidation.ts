import fs from 'fs';
import path from 'path';
import { sanitizeLogDetails } from '../src/services/api/diagnostics';

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
  'openapi.json',
];

const schemasDir = path.resolve(process.cwd(), 'docs/schemas');
const allSchemasExist = schemaFiles.every((file) => fs.existsSync(path.join(schemasDir, file)));

assert(
  allSchemasExist,
  '1. Todos os 5 JSON Schemas canônicos e OpenAPI 3.1 foram gerados em docs/schemas',
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

assert(
  !hasPasswordInSchema,
  '4. User Schema público NÃO expõe campo de password ou hash',
  { properties: Object.keys(userSchemaRaw.properties) }
);

// 5. Validação do Sanitizador de PII e Tokens
const testRawLog = 'Falha ao autenticar com Bearer 123456abcdefg7890 para o usuario diego@exemplo.com.br e "password":"minhasenhasecreta"';
const sanitized = sanitizeLogDetails(testRawLog);

assert(
  !sanitized.includes('123456abcdefg7890') &&
    !sanitized.includes('minhasenhasecreta') &&
    sanitized.includes('Bearer [REDACTED_TOKEN]') &&
    sanitized.includes('[REDACTED]'),
  '5. Sanitizador de logs elimina tokens Bearer, senhas e ofusca emails',
  { original: testRawLog, sanitized }
);

// 6. Validação dos arquivos de contenção e segurança do Laravel
const laravelFiles = [
  'docs/laravel/fase0_contencao_imediata.md',
  'docs/laravel/config/cors.php',
  'docs/laravel/app/Enums/EntityStatus.php',
  'docs/laravel/app/Enums/ClaimStatus.php',
  'docs/laravel/app/Enums/UserRole.php',
  'docs/laravel/migrations/2026_10_13_000001_create_kariri_master_tables.php',
  'docs/laravel/app/Http/Resources/PlaceResource.php',
  'docs/laravel/app/Http/Resources/EventResource.php',
  'docs/laravel/app/Http/Resources/FavoriteResource.php',
  'docs/laravel/app/Http/Resources/BusinessClaimResource.php',
  'docs/laravel/app/Http/Resources/UserResource.php',
  'docs/laravel/app/Http/Middleware/SecurityHeadersMiddleware.php',
  'docs/laravel/app/Http/Requests/StorePlaceRequest.php',
  'docs/laravel/app/Policies/PlacePolicy.php',
  'docs/laravel/deploy/deploy_pipeline.sh',
  'docs/laravel/tests/Feature/PlaceApiTest.php',
];

const allLaravelArtifactsExist = laravelFiles.every((file) => fs.existsSync(path.resolve(process.cwd(), file)));

assert(
  allLaravelArtifactsExist,
  '6. Todos os 16 artefatos arquiteturais e de segurança do Laravel foram criados',
  { totalArtefatos: laravelFiles.length }
);

const failed = results.filter((r) => !r.passed);
if (failed.length > 0) {
  console.error(`\nTestes de contrato finalizados com ${failed.length} falha(s).`);
  process.exit(1);
} else {
  console.log(`\n🎉 Todos os ${results.length} testes de contrato e segurança foram aprovados!`);
  process.exit(0);
}
