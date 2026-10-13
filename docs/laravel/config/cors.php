<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration - Kariri.app
    |--------------------------------------------------------------------------
    |
    | Configuração restrita em conformidade com a Fase 0 do plano de segurança.
    | Bloqueia origens não autorizadas e desabilita wildcards arbitrários.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => [
        'https://kariri.app.br',
        'https://www.kariri.app.br',
        // Domínios de preview e staging Cloud Run / AI Studio
        'https://ais-dev-4ayuyalyppe566cqnqe7u7-631265259379.us-east1.run.app',
        'https://ais-pre-4ayuyalyppe566cqnqe7u7-631265259379.us-east1.run.app',
        // Ambiente de desenvolvimento local (somente porta Vite dev)
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ],

    'allowed_origins_patterns' => [
        // Suporte a subdomínios seguros do Cloud Run do projeto
        '#^https://ais-(dev|pre)-[a-z0-9\-]+-631265259379\.us-east1\.run\.app$#',
    ],

    'allowed_headers' => [
        'Content-Type',
        'X-Requested-With',
        'Authorization',
        'Accept',
        'Origin',
        'X-XSRF-TOKEN',
    ],

    'exposed_headers' => ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],

    'max_age' => 86400,

    'supports_credentials' => true,

];
