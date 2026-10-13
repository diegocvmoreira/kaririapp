<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class RouteServiceProvider_RateLimiting extends ServiceProvider
{
    /**
     * Configura limitadores de taxa (Rate Limiting) para rotas críticas
     */
    public function boot(): void
    {
        // 1. Rate limiter geral da API pública
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        // 2. Rate limiter estrito para Autenticação (Login, Registro, Password Reset)
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(6)->by($request->ip())->response(function () {
                return response()->json([
                    'message' => 'Muitas tentativas de login/registro. Por favor, aguarde 1 minuto.',
                    'retry_after' => 60,
                ], 429);
            });
        });

        // 3. Rate limiter para busca e exploração (evita scraping abusivo)
        RateLimiter::for('search', function (Request $request) {
            return Limit::perMinute(40)->by($request->ip());
        });

        // 4. Rate limiter para envio de avaliações e reivindicações de empresa
        RateLimiter::for('user-actions', function (Request $request) {
            return Limit::perMinute(15)->by($request->user()?->id ?: $request->ip());
        });
    }
}
