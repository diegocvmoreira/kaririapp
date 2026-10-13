<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CityResource;
use App\Models\City;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CityController extends Controller
{
    /**
     * Lista todas as cidades ativas do catálogo do Kariri.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = City::query()
            ->withCount(['places' => fn ($q) => $q->where('status', 'published')]);

        if ($request->boolean('active_only', true)) {
            $query->where('is_active', true);
        }

        if ($request->boolean('cariri_only', false)) {
            $query->where('is_cariri_region', true);
        }

        $cities = $query->orderBy('name')->get();

        return CityResource::collection($cities);
    }

    /**
     * Busca cidades por termo (nome, estado ou país), permitindo desambiguação de homônimos.
     * Suporta qualquer cidade do Brasil ou exterior para fins de cadastro de procedência e residência.
     */
    public function search(Request $request): AnonymousResourceCollection
    {
        $term = trim((string) $request->query('q', ''));

        $query = City::query()
            ->withCount(['places' => fn ($q) => $q->where('status', 'published')]);

        if (!empty($term)) {
            $query->where(function ($q) use ($term) {
                $q->where('name', 'LIKE', "%{$term}%")
                  ->orWhere('state', 'LIKE', "%{$term}%")
                  ->orWhere('country', 'LIKE', "%{$term}%")
                  ->orWhere('slug', 'LIKE', "%{$term}%");
            });
        }

        $cities = $query->orderBy('is_cariri_region', 'desc')
            ->orderBy('name')
            ->limit(30)
            ->get();

        return CityResource::collection($cities);
    }

    /**
     * Retorna detalhes de uma cidade por ID ou slug.
     */
    public function show(string $slugOrId): CityResource
    {
        $city = City::query()
            ->withCount(['places' => fn ($q) => $q->where('status', 'published')])
            ->where(is_numeric($slugOrId) ? 'id' : 'slug', $slugOrId)
            ->firstOrFail();

        return new CityResource($city);
    }
}
