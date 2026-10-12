<?php

/**
 * Snippet para adicionar em routes/api.php do backend Laravel (kariri-api):
 *
 * Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
 *     Route::post('/places/import', [App\Http\Controllers\Api\Admin\AdminPlaceImportController::class, 'import']);
 * });
 *
 * Ou rota pública para carga inicial em ambiente de deploy MVP:
 * Route::post('/admin/places/import', [App\Http\Controllers\Api\Admin\AdminPlaceImportController::class, 'import']);
 */
