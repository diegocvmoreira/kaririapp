<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\Place;
use App\Models\City;
use App\Models\Category;

/**
 * Controller responsável pelo endpoint POST /api/admin/places/import
 * e POST /api/admin/places/import-approved
 */
class AdminPlaceImportController extends Controller
{
    protected array $validCategories = [
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

    /**
     * Importa locais enviados em lote via JSON
     * Rota: POST /api/admin/places/import
     */
    public function import(Request $request): JsonResponse
    {
        $payload = $request->input('places');

        if (!$payload && $request->isJson()) {
            $data = $request->json()->all();
            $payload = $data['places'] ?? $data;
        }

        if (!is_array($payload) || empty($payload)) {
            return response()->json([
                'error' => 'Payload inválido: a chave "places" deve conter um array de locais.',
            ], 422);
        }

        $created = 0;
        $updated = 0;
        $ignored = 0;
        $withCoords = 0;
        $withoutCoords = 0;
        $errors = [];
        $savedPlaces = [];

        DB::beginTransaction();

        try {
            foreach ($payload as $index => $item) {
                $name = trim($item['name'] ?? '');
                $slug = trim($item['slug'] ?? '');
                $catSlug = trim($item['category_slug'] ?? '');

                if (!$name || !$slug) {
                    $errors[] = [
                        'index' => $index,
                        'name' => $name,
                        'slug' => $slug,
                        'error' => 'Campos obrigatórios name e slug não preenchidos.',
                    ];
                    $ignored++;
                    continue;
                }

                if (!in_array($catSlug, $this->validCategories, true)) {
                    $errors[] = [
                        'index' => $index,
                        'name' => $name,
                        'slug' => $slug,
                        'error' => "Categoria inválida: {$catSlug}",
                    ];
                    $ignored++;
                    continue;
                }

                // Coordenadas válidas estritas
                $lat = $item['latitude'] ?? null;
                $lng = $item['longitude'] ?? null;
                $hasValidCoords = ($lat !== null && $lng !== null && is_numeric($lat) && is_numeric($lng));

                if ($hasValidCoords) {
                    $finalLat = (float) $lat;
                    $finalLng = (float) $lng;
                    $withCoords++;
                } else {
                    $finalLat = null;
                    $finalLng = null;
                    $withoutCoords++;
                }

                // Categoria e Cidade IDs
                $city = City::where('slug', $item['city_slug'] ?? '')->first();
                $cityId = $city ? $city->id : (($item['city_name'] ?? '') === 'Crato' ? 1 : (($item['city_name'] ?? '') === 'Juazeiro do Norte' ? 2 : 3));

                $category = Category::where('slug', $catSlug)->first();
                $categoryId = $category ? $category->id : 1;

                // Status e verificação
                // Se o responsável autorizou a publicação (como no MVP aprovado): status=published, verified=true
                $targetStatus = $item['status'] ?? 'published';
                $targetVerified = isset($item['verified']) ? (bool) $item['verified'] : true;
                $targetNeedsReview = isset($item['needs_review']) ? (bool) $item['needs_review'] : false;

                $place = Place::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => $name,
                        'category_id' => $categoryId,
                        'category_slug' => $catSlug,
                        'city_id' => $cityId,
                        'city_slug' => $item['city_slug'] ?? 'crato',
                        'city_name' => $item['city_name'] ?? 'Crato',
                        'short_description' => $item['short_description'] ?? '',
                        'description' => $item['description'] ?? '',
                        'address' => $item['address'] ?? null,
                        'neighborhood' => $item['neighborhood'] ?? null,
                        'zipcode' => $item['zipcode'] ?? null,
                        'latitude' => $finalLat,
                        'longitude' => $finalLng,
                        'coordinate_source' => $item['coordinate_source'] ?? null,
                        'coordinate_confidence' => $item['coordinate_confidence'] ?? null,
                        'phone' => $item['phone'] ?? null,
                        'whatsapp' => $item['whatsapp'] ?? null,
                        'website' => $item['website'] ?? null,
                        'instagram' => $item['instagram'] ?? null,
                        'facebook' => $item['facebook'] ?? null,
                        'opening_hours' => $item['opening_hours'] ?? '',
                        'price_level' => $item['price_level'] ?? 2,
                        'cover_image' => $item['cover_image'] ?? '/placeholders/' . $catSlug . '.svg',
                        'images' => [],
                        'tags' => $item['tags'] ?? [],
                        'status' => $targetStatus,
                        'verified' => $targetVerified,
                        'needs_review' => $targetNeedsReview,
                    ]
                );

                if ($place->wasRecentlyCreated) {
                    $created++;
                } else {
                    $updated++;
                }

                $savedPlaces[] = $place;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'total' => count($payload),
                'created' => $created,
                'updated' => $updated,
                'ignored' => $ignored,
                'with_coordinates' => $withCoords,
                'without_coordinates' => $withoutCoords,
                'errors' => $errors,
                'places' => $savedPlaces,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Erro ao processar importação: ' . $e->getMessage(),
            ], 500);
        }
    }
}
