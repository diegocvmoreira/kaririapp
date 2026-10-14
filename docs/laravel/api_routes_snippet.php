<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\PasswordResetController;

/**
 * Snippets de rotas para routes/api.php do backend Laravel (kariri-api):
 */

// 1. Recuperação de Senha com Rate Limiting estrito (6 req/min por IP)
Route::middleware(['throttle:6,1'])->group(function () {
    Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLinkEmail']);
    Route::post('/reset-password', [PasswordResetController::class, 'reset']);
});

// 2. Rotas administrativas protegidas (Sanctum)
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::post('/places/import', [App\Http\Controllers\Api\Admin\AdminPlaceImportController::class, 'import']);
});

// 3. Avaliações (Reviews): Leitura pública + Publicação autenticada com Rate Limiting
Route::get('/places/{placeId}/reviews', [App\Http\Controllers\Api\ReviewController::class, 'index']);
Route::middleware(['auth:sanctum', 'throttle:10,1'])->group(function () {
    Route::post('/reviews', [App\Http\Controllers\Api\ReviewController::class, 'store']);
});
