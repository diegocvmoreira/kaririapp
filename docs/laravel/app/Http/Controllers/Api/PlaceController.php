<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PlaceResource;
use App\Models\Place;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class PlaceController extends Controller
{
    /**
     * Lista lugares publicados com filtros e ordenação por proximidade real (Haversine).
     *
     * Suporta os parâmetros:
     * - lat: Latitude de referência (GPS ou centro do município)
     * - lng: Longitude de referência
     * - radius: Raio máximo em km (opcional)
     * - sort_by: 'distance' | 'rating' | 'reviews' | 'featured'
     * - city: Slug do município
     * - category: Slug da categoria
     * - open_now: 1 para abertos agora
     * - min_rating: Nota mínima (ex: 4.0)
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Place::query()->where('status', 'published');

        if ($request->filled('city')) {
            $query->where('city_slug', $request->query('city'));
        }

        if ($request->filled('category')) {
            $query->where('category_slug', $request->query('category'));
        }

        if ($request->filled('min_rating')) {
            $query->where('rating', '>=', (float) $request->query('min_rating'));
        }

        if ($request->boolean('open_now')) {
            $query->where('is_open_now', true);
        }

        $lat = $request->query('lat');
        $lng = $request->query('lng');
        $hasCoords = is_numeric($lat) && is_numeric($lng) && $lat >= -90 && $lat <= 90 && $lng >= -180 && $lng <= 180;

        if ($hasCoords) {
            $latVal = (float) $lat;
            $lngVal = (float) $lng;

            // Fórmula de Haversine esférica para distância em quilômetros
            $haversineSql = "(6371 * acos(
                cos(radians(?)) *
                cos(radians(latitude)) *
                cos(radians(longitude) - radians(?)) +
                sin(radians(?)) *
                sin(radians(latitude))
            ))";

            $query->select('places.*')
                ->selectRaw("CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN {$haversineSql} ELSE NULL END AS distance_km", [
                    $latVal, $lngVal, $latVal
                ]);

            if ($request->filled('radius')) {
                $radius = (float) $request->query('radius');
                $query->havingRaw('distance_km <= ? OR distance_km IS NULL', [$radius]);
            }
        }

        $sortBy = $request->query('sort_by', 'featured');

        if ($sortBy === 'distance' && $hasCoords) {
            // Lugares com distância válida vêm primeiro ordenados crescentemente.
            // Registros sem coordenadas (distance_km IS NULL) vão para o final sem inventar distâncias.
            $query->orderByRaw('CASE WHEN distance_km IS NULL THEN 1 ELSE 0 END ASC')
                  ->orderBy('distance_km', 'ASC');
        } elseif ($sortBy === 'rating') {
            $query->orderBy('rating', 'DESC');
        } elseif ($sortBy === 'reviews') {
            $query->orderBy('reviews_count', 'DESC');
        } else {
            $query->orderBy('is_featured', 'DESC')
                  ->orderBy('rating', 'DESC');
        }

        $perPage = min((int) $request->query('per_page', 20), 50);
        $places = $query->paginate($perPage);

        return PlaceResource::collection($places);
    }

    /**
     * Retorna lugares próximos a um ponto geográfico ou município.
     */
    public function nearby(Request $request): AnonymousResourceCollection
    {
        $request->merge(['sort_by' => 'distance', 'per_page' => $request->query('limit', 6)]);
        return $this->index($request);
    }

    /**
     * Exibe os detalhes de um local por slug (leitura pública).
     */
    public function show(string $slug): JsonResponse
    {
        $place = Place::query()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->with(['reviews' => fn ($q) => $q->where('status', 'published')->latest()])
            ->firstOrFail();

        return response()->json([
            'data' => new PlaceResource($place),
        ]);
    }
}
