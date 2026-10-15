<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Place;
use App\Models\City;
use App\Models\Category;
use App\Enums\UserRole;

class PlaceApiTest extends TestCase
{
    use RefreshDatabase;

    protected City $city;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->city = City::create([
            'name' => 'Crato',
            'slug' => 'crato',
            'state' => 'CE',
            'latitude' => -7.2341,
            'longitude' => -39.4124,
            'is_active' => true,
        ]);

        $this->category = Category::create([
            'name' => 'Gastronomia',
            'slug' => 'gastronomia',
            'icon' => 'utensils',
            'status' => 'published',
        ]);
    }

    public function test_can_list_published_places(): void
    {
        Place::create([
            'name' => 'Restaurante Teste Crato',
            'slug' => 'restaurante-teste-crato',
            'city_id' => $this->city->id,
            'category_id' => $this->category->id,
            'city_slug' => 'crato',
            'category_slug' => 'gastronomia',
            'status' => 'published',
            'verified' => true,
            'latitude' => -7.2300,
            'longitude' => -39.4100,
        ]);

        $response = $this->getJson('/api/places');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'slug', 'category_slug', 'city_slug', 'status', 'verified']
                ]
            ]);
    }

    public function test_draft_or_pending_places_not_visible_publicly(): void
    {
        Place::create([
            'name' => 'Local Privado Pendente',
            'slug' => 'local-privado-pendente',
            'city_id' => $this->city->id,
            'category_id' => $this->category->id,
            'city_slug' => 'crato',
            'category_slug' => 'gastronomia',
            'status' => 'pending',
            'verified' => false,
        ]);

        $response = $this->getJson('/api/places/local-privado-pendente');
        $response->assertStatus(404);
    }

    public function test_admin_can_import_approved_places_batch(): void
    {
        $admin = User::create([
            'name' => 'Admin Kariri',
            'email' => 'admin@kariri.app.br',
            'password' => bcrypt('SenhaForte123!'),
            'role' => UserRole::Admin->value,
            'status' => 'active',
        ]);

        $payload = [
            'places' => [
                [
                    'name' => 'Centro Cultural do Cariri',
                    'slug' => 'centro-cultural-do-cariri-servulo-esmeraldo',
                    'category_slug' => 'gastronomia',
                    'city_slug' => 'crato',
                    'city_name' => 'Crato',
                    'latitude' => -7.2389,
                    'longitude' => -39.4215,
                    'status' => 'published',
                    'verified' => true,
                    'needs_review' => false,
                ],
                [
                    'name' => 'Cascata do Lameiro',
                    'slug' => 'cascata-do-lameiro',
                    'category_slug' => 'gastronomia',
                    'city_slug' => 'crato',
                    'city_name' => 'Crato',
                    'latitude' => null,
                    'longitude' => null,
                    'status' => 'published',
                    'verified' => true,
                    'needs_review' => false,
                ]
            ]
        ];

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/places/import', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'total' => 2,
                'with_coordinates' => 1,
                'without_coordinates' => 1,
            ]);

        $this->assertDatabaseHas('places', [
            'slug' => 'cascata-do-lameiro',
            'latitude' => null,
            'longitude' => null,
            'status' => 'published',
            'verified' => true,
        ]);
    }

    public function test_places_sorted_by_proximity_changes_with_reference_point(): void
    {
        // 1. Local em Crato
        $placeCrato = Place::create([
            'name' => 'Praça da Sé Crato',
            'slug' => 'praca-da-se-crato',
            'city_id' => $this->city->id,
            'category_id' => $this->category->id,
            'city_slug' => 'crato',
            'category_slug' => 'turismo',
            'status' => 'published',
            'latitude' => -7.2344,
            'longitude' => -39.4089,
        ]);

        // 2. Local em Juazeiro do Norte (~12km de Crato)
        $placeJuazeiro = Place::create([
            'name' => 'Horto do Padre Cícero',
            'slug' => 'horto-do-padre-cicero',
            'city_id' => $this->city->id,
            'category_id' => $this->category->id,
            'city_slug' => 'juazeiro-do-norte',
            'category_slug' => 'turismo',
            'status' => 'published',
            'latitude' => -7.1812,
            'longitude' => -39.3308,
        ]);

        // 3. Local sem coordenadas cadastradas
        $placeSemCoords = Place::create([
            'name' => 'Artesanato Local sem Coordenadas',
            'slug' => 'artesanato-local-sem-coordenadas',
            'city_id' => $this->city->id,
            'category_id' => $this->category->id,
            'city_slug' => 'crato',
            'category_slug' => 'compras',
            'status' => 'published',
            'latitude' => null,
            'longitude' => null,
        ]);

        // Referência A: Centro do Crato (-7.2344, -39.4089)
        // Praça da Sé deve ser a 1ª, Horto a 2ª, e o sem coordenadas por último sem distância inventada
        $responseCrato = $this->getJson('/api/places?lat=-7.2344&lng=-39.4089&sort_by=distance');
        $responseCrato->assertStatus(200);
        $dataCrato = $responseCrato->json('data');

        $this->assertEquals('praca-da-se-crato', $dataCrato[0]['slug']);
        $this->assertEquals('horto-do-padre-cicero', $dataCrato[1]['slug']);
        $this->assertNull($dataCrato[2]['distance_km'] ?? null);

        // Referência B: Centro de Juazeiro (-7.1812, -39.3308)
        // A ordem deve inverter: Horto passa a ser o 1º!
        $responseJuazeiro = $this->getJson('/api/places?lat=-7.1812&lng=-39.3308&sort_by=distance');
        $responseJuazeiro->assertStatus(200);
        $dataJuazeiro = $responseJuazeiro->json('data');

        $this->assertEquals('horto-do-padre-cicero', $dataJuazeiro[0]['slug']);
        $this->assertEquals('praca-da-se-crato', $dataJuazeiro[1]['slug']);
        $this->assertNull($dataJuazeiro[2]['distance_km'] ?? null);
    }
}
