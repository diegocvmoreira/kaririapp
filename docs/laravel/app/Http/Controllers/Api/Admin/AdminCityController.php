<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CityResource;
use App\Models\City;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminCityController extends Controller
{
    /**
     * Cadastra nova cidade administrativamente.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['nullable', 'string', 'max:100', 'unique:cities,slug'],
            'state' => ['required', 'string', 'size:2'],
            'country' => ['nullable', 'string', 'max:50'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'image' => ['nullable', 'url'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
            'is_active' => ['nullable', 'boolean'],
            'is_cariri_region' => ['nullable', 'boolean'],
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $city = City::create($validated);

        return (new CityResource($city))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Atualiza cidade existente.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $city = City::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'slug' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('cities', 'slug')->ignore($city->id)],
            'state' => ['sometimes', 'required', 'string', 'size:2'],
            'country' => ['nullable', 'string', 'max:50'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'image' => ['nullable', 'url'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
            'is_active' => ['nullable', 'boolean'],
            'is_cariri_region' => ['nullable', 'boolean'],
        ]);

        $city->update($validated);

        return (new CityResource($city))->response();
    }

    /**
     * Remove cidade do sistema se não houver locais associados.
     */
    public function destroy(int $id): JsonResponse
    {
        $city = City::withCount('places')->findOrFail($id);

        if ($city->places_count > 0) {
            return response()->json([
                'message' => 'Não é possível excluir esta cidade pois ela possui ' . $city->places_count . ' locais vinculados. Desative-a em vez de excluir.',
            ], 422);
        }

        $city->delete();

        return response()->json([
            'message' => 'Cidade excluída com sucesso.',
        ]);
    }
}
