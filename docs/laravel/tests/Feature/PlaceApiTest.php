<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Place;
use App\Models\City;
use App\Models\Category;
use App\Models\Review;
use App\Enums\UserRole;

class PlaceApiTest extends TestCase
{
    use RefreshDatabase;

    protected City $cityCrato;
    protected City $cityJuazeiro;
    protected Category $categoryGastronomia;
    protected Category $categoryTurismo;

    protected function setUp(): void
    {
        parent::setUp();

        // Cidades de teste na Região Metropolitana do Cariri
        $this->cityCrato = City::create([
            'name' => 'Crato',
            'slug' => 'crato',
            'state' => 'CE',
            'latitude' => -7.2341,
            'longitude' => -39.4124,
            'is_active' => true,
        ]);

        $this->cityJuazeiro = City::create([
            'name' => 'Juazeiro do Norte',
            'slug' => 'juazeiro-do-norte',
            'state' => 'CE',
            'latitude' => -7.2065,
            'longitude' => -39.3148,
            'is_active' => true,
        ]);

        // Categorias de teste
        $this->categoryGastronomia = Category::create([
            'name' => 'Gastronomia',
            'slug' => 'gastronomia',
            'icon' => 'utensils',
            'status' => 'published',
        ]);

        $this->categoryTurismo = Category::create([
            'name' => 'Turismo',
            'slug' => 'turismo',
            'icon' => 'camera',
            'status' => 'published',
        ]);
    }

    /**
     * 1. Listagem pública de locais publicados
     */
    public function test_can_list_published_places(): void
    {
        Place::create([
            'name' => 'Restaurante Teste Crato',
            'slug' => 'restaurante-teste-crato',
            'city_id' => $this->cityCrato->id,
            'category_id' => $this->categoryGastronomia->id,
            'city_slug' => 'crato',
            'category_slug' => 'gastronomia',
            'status' => 'published',
            'verified' => true,
            'rating' => 4.8,
            'latitude' => -7.2300,
            'longitude' => -39.4100,
        ]);

        $response = $this->getJson('/api/places');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'slug', 'category_slug', 'city_slug', 'status', 'verified']
                ],
                'links',
                'meta',
            ]);
    }

    /**
     * 2. Locais em rascunho (draft) ou pendentes não aparecem na listagem pública nem via slug
     */
    public function test_draft_or_pending_places_not_visible_publicly(): void
    {
        Place::create([
            'name' => 'Local Privado Pendente',
            'slug' => 'local-privado-pendente',
            'city_id' => $this->cityCrato->id,
            'category_id' => $this->categoryGastronomia->id,
            'city_slug' => 'crato',
            'category_slug' => 'gastronomia',
            'status' => 'pending',
            'verified' => false,
        ]);

        // Não deve aparecer na listagem pública
        $listResponse = $this->getJson('/api/places');
        $listResponse->assertStatus(200);
        $this->assertEmpty(
            collect($listResponse->json('data'))->where('slug', 'local-privado-pendente')
        );

        // Deve retornar 404 na rota de detalhe por slug
        $showResponse = $this->getJson('/api/places/local-privado-pendente');
        $showResponse->assertStatus(404);
    }

    /**
     * 3. Filtros por município, categoria e nota mínima
     */
    public function test_can_filter_places_by_city_category_and_min_rating(): void
    {
        Place::create([
            'name' => 'Pizzaria Crato Alta Nota',
            'slug' => 'pizzaria-crato-alta-nota',
            'city_id' => $this->cityCrato->id,
            'category_id' => $this->categoryGastronomia->id,
            'city_slug' => 'crato',
            'category_slug' => 'gastronomia',
            'rating' => 4.9,
            'status' => 'published',
        ]);

        Place::create([
            'name' => 'Pizzaria Crato Baixa Nota',
            'slug' => 'pizzaria-crato-baixa-nota',
            'city_id' => $this->cityCrato->id,
            'category_id' => $this->categoryGastronomia->id,
            'city_slug' => 'crato',
            'category_slug' => 'gastronomia',
            'rating' => 3.2,
            'status' => 'published',
        ]);

        Place::create([
            'name' => 'Ponto Turístico Juazeiro',
            'slug' => 'ponto-turistico-juazeiro',
            'city_id' => $this->cityJuazeiro->id,
            'category_id' => $this->categoryTurismo->id,
            'city_slug' => 'juazeiro-do-norte',
            'category_slug' => 'turismo',
            'rating' => 4.7,
            'status' => 'published',
        ]);

        // Filtrar por município e nota mínima
        $response = $this->getJson('/api/places?city=crato&category=gastronomia&min_rating=4.0');
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('pizzaria-crato-alta-nota', $data[0]['slug']);
    }

    /**
     * 4. Detalhes de um local por slug com avaliações públicas associadas
     */
    public function test_can_show_place_detail_by_slug(): void
    {
        $place = Place::create([
            'name' => 'Parque Ecológico das Timbaúbas',
            'slug' => 'parque-ecologico-das-timbaubas',
            'city_id' => $this->cityJuazeiro->id,
            'category_id' => $this->categoryTurismo->id,
            'city_slug' => 'juazeiro-do-norte',
            'category_slug' => 'turismo',
            'status' => 'published',
            'verified' => true,
        ]);

        $user = User::create([
            'name' => 'Avaliador Teste',
            'email' => 'avaliador@cariri.app.br',
            'password' => bcrypt('SenhaForte123!'),
            'role' => UserRole::User->value ?? 'user',
        ]);

        Review::create([
            'place_id' => $place->id,
            'user_id' => $user->id,
            'rating' => 5,
            'comment' => 'Excelente espaço verde para passeios em família.',
            'status' => 'published',
        ]);

        $response = $this->getJson('/api/places/parque-ecologico-das-timbaubas');

        $response->assertStatus(200)
            ->assertJsonPath('data.slug', 'parque-ecologico-das-timbaubas')
            ->assertJsonPath('data.name', 'Parque Ecológico das Timbaúbas')
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'slug',
                    'category_slug',
                    'city_slug',
                    'latitude',
                    'longitude',
                    'rating',
                ]
            ]);
    }

    /**
     * 5. Ordenação dinâmica por proximidade real (Haversine)
     * - Quando a referência muda (Crato vs Juazeiro), a ordem deve inverter.
     * - Locais sem coordenadas devem ficar no final sem inventar distâncias.
     */
    public function test_places_sorted_by_proximity_changes_with_reference_point(): void
    {
        // 1. Local no Centro do Crato (-7.2344, -39.4089)
        $placeCrato = Place::create([
            'name' => 'Praça da Sé Crato',
            'slug' => 'praca-da-se-crato',
            'city_id' => $this->cityCrato->id,
            'category_id' => $this->categoryTurismo->id,
            'city_slug' => 'crato',
            'category_slug' => 'turismo',
            'status' => 'published',
            'latitude' => -7.2344,
            'longitude' => -39.4089,
        ]);

        // 2. Local no Horto de Juazeiro do Norte (-7.1812, -39.3308)
        $placeJuazeiro = Place::create([
            'name' => 'Horto do Padre Cícero',
            'slug' => 'horto-do-padre-cicero',
            'city_id' => $this->cityJuazeiro->id,
            'category_id' => $this->categoryTurismo->id,
            'city_slug' => 'juazeiro-do-norte',
            'category_slug' => 'turismo',
            'status' => 'published',
            'latitude' => -7.1812,
            'longitude' => -39.3308,
        ]);

        // 3. Local sem coordenadas geográficas
        $placeSemCoords = Place::create([
            'name' => 'Artesanato Local sem Coordenadas',
            'slug' => 'artesanato-local-sem-coordenadas',
            'city_id' => $this->cityCrato->id,
            'category_id' => $this->categoryTurismo->id,
            'city_slug' => 'crato',
            'category_slug' => 'turismo',
            'status' => 'published',
            'latitude' => null,
            'longitude' => null,
        ]);

        // Referência A: Ponto no Centro do Crato (-7.2344, -39.4089)
        // Praça da Sé deve ser a 1ª (~0km), Horto a 2ª (~12km), e o sem coordenadas por último
        $responseCrato = $this->getJson('/api/places?lat=-7.2344&lng=-39.4089&sort_by=distance');
        $responseCrato->assertStatus(200);
        $dataCrato = $responseCrato->json('data');

        $this->assertEquals('praca-da-se-crato', $dataCrato[0]['slug']);
        $this->assertEquals('horto-do-padre-cicero', $dataCrato[1]['slug']);
        $this->assertEquals('artesanato-local-sem-coordenadas', $dataCrato[2]['slug']);
        $this->assertNull($dataCrato[2]['distance_km'] ?? null);

        // Referência B: Ponto no Horto de Juazeiro (-7.1812, -39.3308)
        // A ordem deve inverter dinamicamente: Horto passa a ser o 1º!
        $responseJuazeiro = $this->getJson('/api/places?lat=-7.1812&lng=-39.3308&sort_by=distance');
        $responseJuazeiro->assertStatus(200);
        $dataJuazeiro = $responseJuazeiro->json('data');

        $this->assertEquals('horto-do-padre-cicero', $dataJuazeiro[0]['slug']);
        $this->assertEquals('praca-da-se-crato', $dataJuazeiro[1]['slug']);
        $this->assertEquals('artesanato-local-sem-coordenadas', $dataJuazeiro[2]['slug']);
        $this->assertNull($dataJuazeiro[2]['distance_km'] ?? null);
    }

    /**
     * 6. Endpoint /api/places/nearby com parâmetros de latitude e longitude
     */
    public function test_nearby_endpoint_returns_closest_places(): void
    {
        Place::create([
            'name' => 'Local Crato Perto',
            'slug' => 'local-crato-perto',
            'city_id' => $this->cityCrato->id,
            'category_id' => $this->categoryGastronomia->id,
            'city_slug' => 'crato',
            'category_slug' => 'gastronomia',
            'status' => 'published',
            'latitude' => -7.2340,
            'longitude' => -39.4120,
        ]);

        $response = $this->getJson('/api/places/nearby?lat=-7.2341&lng=-39.4124&limit=3');
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertNotEmpty($data);
        $this->assertEquals('local-crato-perto', $data[0]['slug']);
    }

    /**
     * 7. Importação em lote por Administrador autenticado (POST /api/admin/places/import)
     */
    public function test_admin_can_import_approved_places_batch(): void
    {
        $admin = User::create([
            'name' => 'Admin Kariri',
            'email' => 'admin@kariri.app.br',
            'password' => bcrypt('SenhaForte123!'),
            'role' => UserRole::Admin->value ?? 'admin',
            'status' => 'active',
        ]);

        $payload = [
            'places' => [
                [
                    'name' => 'Centro Cultural do Cariri',
                    'slug' => 'centro-cultural-do-cariri-servulo-esmeraldo',
                    'category_slug' => 'turismo',
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
                    'category_slug' => 'turismo',
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

    /**
     * 8. Usuário comum ou visitante não pode importar locais (403 ou 401)
     */
    public function test_non_admin_cannot_import_places(): void
    {
        $regularUser = User::create([
            'name' => 'Usuário Regular',
            'email' => 'comum@kariri.app.br',
            'password' => bcrypt('SenhaForte123!'),
            'role' => UserRole::User->value ?? 'user',
        ]);

        $payload = [
            'places' => [
                [
                    'name' => 'Tentativa Não Autorizada',
                    'slug' => 'tentativa-nao-autorizada',
                ]
            ]
        ];

        // Sem autenticação -> 401
        $guestResponse = $this->postJson('/api/admin/places/import', $payload);
        $guestResponse->assertStatus(401);

        // Usuário regular (sem permissão de admin) -> 403
        $userResponse = $this->actingAs($regularUser)->postJson('/api/admin/places/import', $payload);
        $userResponse->assertStatus(403);
    }
}
