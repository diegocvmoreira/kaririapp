<?php

namespace Tests\Feature;

use App\Models\Place;
use App\Models\User;
use App\Models\City;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Place $place;

    protected function setUp(): void
    {
        parent::setUp();

        $city = City::factory()->create(['name' => 'Juazeiro do Norte', 'slug' => 'juazeiro-do-norte']);
        $category = Category::factory()->create(['name' => 'Restaurantes', 'slug' => 'restaurantes']);

        $this->place = Place::factory()->create([
            'name'        => 'Restaurante Sabor do Cariri',
            'slug'        => 'restaurante-sabor-do-cariri',
            'city_id'     => $city->id,
            'category_id' => $category->id,
            'status'      => 'published',
        ]);

        $this->user = User::factory()->create([
            'name'  => 'Maria Santos',
            'email' => 'maria@exemplo.com.br',
        ]);
    }

    public function test_unauthenticated_user_cannot_create_review(): void
    {
        $response = $this->postJson('/api/reviews', [
            'place_id' => $this->place->id,
            'rating'   => 5,
            'comment'  => 'Excelente comida regional e ótimo atendimento!',
        ]);

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_create_valid_review(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/reviews', [
            'place_id' => $this->place->id,
            'rating'   => 5,
            'comment'  => 'Excelente comida regional, carne de sol impecável e ótimo atendimento!',
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'place_id'  => $this->place->id,
                'user_name' => 'Maria Santos',
                'rating'    => 5,
            ]);

        $this->assertDatabaseHas('reviews', [
            'place_id' => $this->place->id,
            'user_id'  => $this->user->id,
            'rating'   => 5,
        ]);
    }

    public function test_review_requires_minimum_10_characters(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/reviews', [
            'place_id' => $this->place->id,
            'rating'   => 4,
            'comment'  => 'Bom', // apenas 3 caracteres
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['comment']);
    }

    public function test_public_user_can_read_reviews_without_authentication(): void
    {
        // Cria uma avaliação no banco
        $this->place->reviews()->create([
            'user_id' => $this->user->id,
            'rating'  => 5,
            'comment' => 'Ótimo local para visitar com a família no Cariri.',
            'status'  => 'published',
        ]);

        $response = $this->getJson("/api/places/{$this->place->id}/reviews");
        $response->assertStatus(200);
    }
}
