/**
 * Módulo de Diagnóstico Técnico da API Kariri
 * Diferencia CORS, Cloudflare, Rota, Autenticação e Formato JSON
 */

export type ApiDiagnosticCategory =
  | 'CORS'
  | 'CLOUDFLARE'
  | 'ROTA'
  | 'AUTENTICACAO'
  | 'FORMATO_JSON'
  | 'REDE'
  | 'SERVIDOR';

export interface ApiDiagnosticReport {
  category: ApiDiagnosticCategory;
  title: string;
  userMessage: string;
  technicalDetails: string;
  suggestedAction: string;
  status: number;
  endpoint?: string;
  timestamp: string;
}

export interface EndpointDiagnosticResult {
  methodName: string;
  endpoint: string;
  status: 'ok' | 'error';
  httpStatus?: number;
  category?: ApiDiagnosticCategory;
  message: string;
  technicalDetails?: string;
  suggestedAction?: string;
  durationMs: number;
  itemCount?: number;
}

export function diagnoseApiIssue(
  status: number,
  errorMessage: string = '',
  rawBody?: unknown,
  endpoint?: string
): ApiDiagnosticReport {
  const msgLower = (errorMessage || '').toLowerCase();
  const rawStr = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody || '');
  const timestamp = new Date().toISOString();
  const endpointInfo = endpoint ? ` [Endpoint: ${endpoint}]` : '';

  // 1. Diagnóstico de Rede Offline (Dispositivo sem internet)
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  if (status === 0 && (isOffline || (rawBody as { offline?: boolean })?.offline)) {
    return {
      category: 'REDE',
      title: 'Sem Conexão com a Internet',
      userMessage: 'Sem conexão com a internet. Verifique sua rede e tente novamente.',
      technicalDetails: `O navegador está desconectado da rede (navigator.onLine = false). Requisição não enviada.${endpointInfo}`,
      suggestedAction: 'Verifique a conexão Wi-Fi ou dados móveis do dispositivo.',
      status: 0,
      endpoint,
      timestamp,
    };
  }

  // 2. Diagnóstico de CORS (Dispositivo online, mas requisição bloqueada por política de mesma origem)
  if (
    status === 0 &&
    (msgLower.includes('failed to fetch') ||
      msgLower.includes('networkerror') ||
      msgLower.includes('cross-origin') ||
      msgLower.includes('cors') ||
      msgLower.includes('load failed') ||
      msgLower.includes('typeerror'))
  ) {
    return {
      category: 'CORS',
      title: 'Bloqueio de Origem Cruzada (CORS)',
      userMessage: 'Não foi possível conectar com o servidor da API.',
      technicalDetails: `A requisição${endpointInfo} foi interceptada pelo navegador antes de obter resposta HTTP. Isso ocorre quando o cabeçalho "Access-Control-Allow-Origin" está ausente no backend Laravel ou quando o preflight OPTIONS é rejeitado pelo servidor Hostinger.`,
      suggestedAction:
        'Verificar "config/cors.php" no Laravel, garantir que \'paths\' => [\'api/*\', \'sanctum/csrf-cookie\'] esteja configurado e que a origem do frontend e headers (Authorization, Content-Type, Accept) estejam autorizados.',
      status: 0,
      endpoint,
      timestamp,
    };
  }

  // 3. Diagnóstico de Cloudflare (WAF, desafio captcha ou falha de proxy 520-525)
  if (
    status === 520 ||
    status === 521 ||
    status === 522 ||
    status === 523 ||
    status === 524 ||
    status === 525 ||
    status === 526 ||
    rawStr.includes('cloudflare') ||
    rawStr.includes('cf-ray') ||
    rawStr.includes('cf-chl') ||
    rawStr.includes('challenge-platform') ||
    (status === 403 && rawStr.includes('challenge'))
  ) {
    return {
      category: 'CLOUDFLARE',
      title: 'Interferência do Proxy Cloudflare',
      userMessage: 'O serviço de proteção do servidor está temporariamente indisponível.',
      technicalDetails: `Status HTTP ${status} originado pela camada de proxy do Cloudflare${endpointInfo}. O servidor Hostinger (origem) pode estar inacessível ou o WAF bloqueou a requisição da API.`,
      suggestedAction:
        'Verificar se o servidor web na Hostinger está ativo e adicionar regra de bypass no WAF/Firewall do Cloudflare para o caminho da API Laravel (/kariri-api/public/index.php/api/*).',
      status,
      endpoint,
      timestamp,
    };
  }

  // 4. Diagnóstico de Rota (404 - Rota inexistente no Laravel ou modelo não encontrado)
  if (
    status === 404 ||
    msgLower.includes('could not be found') ||
    msgLower.includes('route not found') ||
    msgLower.includes('notfoundhttpexception') ||
    msgLower.includes('modelnotfoundexception')
  ) {
    return {
      category: 'ROTA',
      title: 'Rota ou Recurso Não Encontrado (404)',
      userMessage: 'O local ou funcionalidade solicitada ainda não está disponível na API.',
      technicalDetails: `A URL solicitada${endpointInfo} não coincide com nenhuma rota registrada em "routes/api.php" do Laravel, ou o registro específico solicitado (slug/id) não existe no banco MySQL.`,
      suggestedAction:
        'Verificar as rotas registradas via "php artisan route:list" no Laravel. Garantir que as rotas de locais (ex: GET /places, GET /places/{slug}) estejam declaradas.',
      status: 404,
      endpoint,
      timestamp,
    };
  }

  // 5. Diagnóstico de Autenticação / Autorização (401 / 403)
  if (status === 401 || status === 403) {
    const is401 = status === 401;
    return {
      category: 'AUTENTICACAO',
      title: is401 ? 'Não Autenticado (401)' : 'Acesso Não Permitido (403)',
      userMessage: is401
        ? 'É necessário entrar na sua conta para acessar esta informação.'
        : 'Você não tem permissão para realizar esta operação.',
      technicalDetails: is401
        ? `Status HTTP 401${endpointInfo}. Token Bearer ausente, inválido ou expirado no middleware Sanctum do Laravel.`
        : `Status HTTP 403${endpointInfo}. Acesso proibido por Policy/Gate do Laravel ou bloqueio de permissão de usuário.`,
      suggestedAction: is401
        ? 'Verificar se o header "Authorization: Bearer <token>" está sendo enviado e se o Sanctum valida o token corretamente.'
        : 'Verificar as Policies e permissões de perfil de usuário configuradas no backend Laravel.',
      status,
      endpoint,
      timestamp,
    };
  }

  // 6. Diagnóstico de Formato JSON e Validação (422 ou Resposta HTML)
  if (
    status === 422 ||
    msgLower.includes('unexpected token') ||
    rawStr.startsWith('<!doctype') ||
    rawStr.startsWith('<html') ||
    rawStr.startsWith('<?php')
  ) {
    const is422 = status === 422;
    return {
      category: 'FORMATO_JSON',
      title: is422 ? 'Falha de Validação (422)' : 'Resposta Não-JSON Recebida',
      userMessage: is422
        ? 'Os dados enviados são inválidos. Verifique as informações.'
        : 'O servidor retornou uma resposta em formato inesperado.',
      technicalDetails: is422
        ? `O Laravel rejeitou os dados no FormRequest/Validator${endpointInfo}: ${errorMessage}`
        : `A API retornou HTML em vez de JSON válido (provável erro fatal de PHP ou página 500 do Apache/LiteSpeed)${endpointInfo}.`,
      suggestedAction: is422
        ? 'Conferir as regras de validação dos campos no Controller/Request do Laravel.'
        : 'Verificar o arquivo "storage/logs/laravel.log" na Hostinger para capturar o erro fatal de PHP.',
      status,
      endpoint,
      timestamp,
    };
  }

  // 7. Servidor Genérico (500 / 502 / 503)
  return {
    category: 'SERVIDOR',
    title: `Erro Interno do Servidor (${status})`,
    userMessage: 'Ocorreu uma instabilidade no servidor da API. Tente novamente em instantes.',
    technicalDetails: `Status HTTP ${status}${endpointInfo}: ${errorMessage}`,
    suggestedAction: 'Consultar os logs do Laravel em "storage/logs/laravel.log" na Hostinger.',
    status,
    endpoint,
    timestamp,
  };
}

/**
 * Executa diagnóstico completo das 5 operações de locais (placesApi):
 * 1. placesApi.getAll
 * 2. placesApi.getFeatured
 * 3. placesApi.getNearby
 * 4. placesApi.getBySlug
 * 5. placesApi.getSimilar
 *
 * Captura o status exato, tempo de resposta, contagem de itens ou relatório
 * de diagnóstico técnico (CORS, CLOUDFLARE, ROTA, AUTENTICACAO, FORMATO_JSON, REDE, SERVIDOR).
 */
export async function runPlacesDiagnostics(): Promise<EndpointDiagnosticResult[]> {
  const { placesApi } = await import('./places');
  const results: EndpointDiagnosticResult[] = [];

  // 1. placesApi.getAll
  {
    const start = performance.now();
    try {
      const places = await placesApi.getAll();
      results.push({
        methodName: 'placesApi.getAll',
        endpoint: '/places',
        status: 'ok',
        httpStatus: 200,
        message: `Sucesso: ${places.length} locais carregados`,
        itemCount: places.length,
        durationMs: Math.round(performance.now() - start),
      });
    } catch (err: unknown) {
      const report = (err as { diagnostic?: ApiDiagnosticReport })?.diagnostic ||
        diagnoseApiIssue(0, err instanceof Error ? err.message : String(err), err, '/places');
      results.push({
        methodName: 'placesApi.getAll',
        endpoint: '/places',
        status: 'error',
        httpStatus: report.status,
        category: report.category,
        message: report.userMessage,
        technicalDetails: report.technicalDetails,
        suggestedAction: report.suggestedAction,
        durationMs: Math.round(performance.now() - start),
      });
    }
  }

  // 2. placesApi.getFeatured
  {
    const start = performance.now();
    try {
      const featured = await placesApi.getFeatured();
      results.push({
        methodName: 'placesApi.getFeatured',
        endpoint: '/places (featured)',
        status: 'ok',
        httpStatus: 200,
        message: `Sucesso: ${featured.length} locais destacados carregados`,
        itemCount: featured.length,
        durationMs: Math.round(performance.now() - start),
      });
    } catch (err: unknown) {
      const report = (err as { diagnostic?: ApiDiagnosticReport })?.diagnostic ||
        diagnoseApiIssue(0, err instanceof Error ? err.message : String(err), err, '/places');
      results.push({
        methodName: 'placesApi.getFeatured',
        endpoint: '/places (featured)',
        status: 'error',
        httpStatus: report.status,
        category: report.category,
        message: report.userMessage,
        technicalDetails: report.technicalDetails,
        suggestedAction: report.suggestedAction,
        durationMs: Math.round(performance.now() - start),
      });
    }
  }

  // 3. placesApi.getNearby
  {
    const start = performance.now();
    try {
      const nearby = await placesApi.getNearby('crato');
      results.push({
        methodName: 'placesApi.getNearby',
        endpoint: '/places?city=crato',
        status: 'ok',
        httpStatus: 200,
        message: `Sucesso: ${nearby.length} locais próximos carregados`,
        itemCount: nearby.length,
        durationMs: Math.round(performance.now() - start),
      });
    } catch (err: unknown) {
      const report = (err as { diagnostic?: ApiDiagnosticReport })?.diagnostic ||
        diagnoseApiIssue(0, err instanceof Error ? err.message : String(err), err, '/places?city=crato');
      results.push({
        methodName: 'placesApi.getNearby',
        endpoint: '/places?city=crato',
        status: 'error',
        httpStatus: report.status,
        category: report.category,
        message: report.userMessage,
        technicalDetails: report.technicalDetails,
        suggestedAction: report.suggestedAction,
        durationMs: Math.round(performance.now() - start),
      });
    }
  }

  // 4. placesApi.getBySlug
  {
    const testSlug = 'sirigado-do-pedro';
    const start = performance.now();
    try {
      const place = await placesApi.getBySlug(testSlug);
      results.push({
        methodName: 'placesApi.getBySlug',
        endpoint: `/places/${testSlug}`,
        status: place ? 'ok' : 'error',
        httpStatus: place ? 200 : 404,
        category: place ? undefined : 'ROTA',
        message: place
          ? `Sucesso: local "${place.name}" carregado`
          : `Aviso: slug "${testSlug}" retornou null ou não encontrado`,
        technicalDetails: place
          ? undefined
          : `O endpoint /places/${testSlug} respondeu, mas nenhum registro com este slug foi localizado.`,
        suggestedAction: place
          ? undefined
          : 'Verificar se o slug informado existe na tabela places do MySQL.',
        itemCount: place ? 1 : 0,
        durationMs: Math.round(performance.now() - start),
      });
    } catch (err: unknown) {
      const report = (err as { diagnostic?: ApiDiagnosticReport })?.diagnostic ||
        diagnoseApiIssue(404, err instanceof Error ? err.message : String(err), err, `/places/${testSlug}`);
      results.push({
        methodName: 'placesApi.getBySlug',
        endpoint: `/places/${testSlug}`,
        status: 'error',
        httpStatus: report.status,
        category: report.category,
        message: report.userMessage,
        technicalDetails: report.technicalDetails,
        suggestedAction: report.suggestedAction,
        durationMs: Math.round(performance.now() - start),
      });
    }
  }

  // 5. placesApi.getSimilar
  {
    const start = performance.now();
    try {
      const similar = await placesApi.getSimilar(1, 'gastronomia');
      results.push({
        methodName: 'placesApi.getSimilar',
        endpoint: '/places?category=gastronomia',
        status: 'ok',
        httpStatus: 200,
        message: `Sucesso: ${similar.length} locais similares encontrados`,
        itemCount: similar.length,
        durationMs: Math.round(performance.now() - start),
      });
    } catch (err: unknown) {
      const report = (err as { diagnostic?: ApiDiagnosticReport })?.diagnostic ||
        diagnoseApiIssue(0, err instanceof Error ? err.message : String(err), err, '/places?category=gastronomia');
      results.push({
        methodName: 'placesApi.getSimilar',
        endpoint: '/places?category=gastronomia',
        status: 'error',
        httpStatus: report.status,
        category: report.category,
        message: report.userMessage,
        technicalDetails: report.technicalDetails,
        suggestedAction: report.suggestedAction,
        durationMs: Math.round(performance.now() - start),
      });
    }
  }

  return results;
}
