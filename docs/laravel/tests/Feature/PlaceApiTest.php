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
}
