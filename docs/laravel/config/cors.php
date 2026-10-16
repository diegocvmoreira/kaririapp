<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration - Kariri.app
    |--------------------------------------------------------------------------
    |
    | Configurado para compatibilidade total com hospedagem Hostinger (Apache/LiteSpeed),
    | ambiente de produção (kariri.app.br), Google Cloud Run (AI Studio) e desenvolvimento local.
    |
    */

    // Cobre rotas diretas de API e caminhos com subpastas (ex: /kariri-api/public/index.php/api/*)
    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        '*',
    ],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => [
        'https://kariri.app.br',
        'https://www.kariri.app.br',
        // Ambientes de Preview e Staging do Google Cloud Run / AI Studio
        'https://ais-dev-4ayuyalyppe566cqnqe7u7-631265259379.us-east1.run.app',
        'https://ais-pre-4ayuyalyppe566cqnqe7u7-631265259379.us-east1.run.app',
        // Desenvolvimento local
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
    ],

    'allowed_origins_patterns' => [
        // Suporte a qualquer subdomínio do Cloud Run do projeto AI Studio
        '#^https://ais-[a-z0-9\-]+\.run\.app$#',
        '#^https://.*\.kariri\.app\.br$#',
    ],

    'allowed_headers' => [
        'Content-Type',
        'X-Requested-With',
        'Authorization',
        'Accept',
        'Origin',
        'X-XSRF-TOKEN',
        'X-Socket-ID',
        'Cache-Control',
        'Pragma',
    ],

    'exposed_headers' => [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-Total-Count',
    ],

    'max_age' => 86400,

    'supports_credentials' => true,

];
