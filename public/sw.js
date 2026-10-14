// Kariri.app Production Service Worker
// Estratégias estruturadas por tipo de recurso com isolamento anti-HTML em assets

const SW_VERSION = '2026.1.2';
const CACHE_SHELL = `kariri-shell-${SW_VERSION}`;
const CACHE_ASSETS = `kariri-assets-${SW_VERSION}`;
const CACHE_API = `kariri-api-${SW_VERSION}`;

const CURRENT_CACHES = [CACHE_SHELL, CACHE_ASSETS, CACHE_API];

const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// URLs ou caminhos de API que NUNCA devem ser cacheados (dados privados/autenticados)
const BYPASS_API_PATTERNS = [
  /\/auth/i,
  /\/me(\/|\?|$)/i,
  /\/user/i,
  /\/profile/i,
  /\/login/i,
  /\/register/i,
  /\/forgot-password/i,
  /\/reset-password/i,
  /\/reviews/i,
  /\/favorites/i,
  /\/claims/i,
  /\/admin/i
];

// Instalação: pré-cacheia o App Shell básico
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => {
      return cache.addAll(SHELL_FILES);
    })
  );
  // Não força skipWaiting automaticamente para permitir controle do usuário
});

// Ativação: limpa versões de cache antigas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!CURRENT_CACHES.includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listener para skipWaiting acionado conscientemente pelo usuário no banner "Atualizar"
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Apenas métodos GET são elegíveis para cache
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 1. NAVEGAÇÃO SPA (request.mode === 'navigate') -> Network-First com Fallback ao Shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_SHELL).then((cache) => {
              cache.put('/', responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Fallback seguro: retorna exclusivamente o shell da SPA
          const cachedShell = await caches.match('/');
          if (cachedShell) return cachedShell;
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;
          return new Response('Offline - Kariri.app', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }

  // 2. REQUISIÇÕES DE API DO BACKEND
  // NUNCA cachear se houver Authorization header ou padrão sensível
  const hasAuthHeader = request.headers.has('Authorization');
  const isBypassedUrl = BYPASS_API_PATTERNS.some((pattern) => pattern.test(url.pathname));

  if (url.pathname.includes('/api') || url.hostname.includes('kariri.app.br')) {
    if (hasAuthHeader || isBypassedUrl) {
      // Pass-through direto pela rede
      return;
    }

    // Rotas de leitura de catálogo público (places, events, categories, cities)
    // Estratégia: Stale-While-Revalidate com isolamento em CACHE_API
    event.respondWith(
      caches.open(CACHE_API).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              // Limita o armazenamento a respostas JSON válidas
              const contentType = networkResponse.headers.get('content-type') || '';
              if (contentType.includes('application/json')) {
                cache.put(request, networkResponse.clone());
              }
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. ASSETS ESTÁTICOS COM HASH (JS, CSS, SVGS, FONTES, IMAGENS)
  // Estratégia: Cache-First. NUNCA retornar index.html se falhar!
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.woff2') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('unpkg.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_ASSETS).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          return cached;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // Em falha de asset estático, devolve 404/503 em vez de index.html
          return new Response('Asset indisponível offline', {
            status: 404,
            statusText: 'Not Found',
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      })
    );
    return;
  }
});
