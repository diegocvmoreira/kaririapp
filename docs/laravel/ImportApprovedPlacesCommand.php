<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use App\Models\Place;
use App\Models\City;
use App\Models\Category;

/**
 * Comando Artisan para importação e publicação inicial dos 33 locais do MVP Kariri.app.
 * Execução: php artisan kariri:import-approved-places [caminho_do_arquivo.json]
 */
class ImportApprovedPlacesCommand extends Command
{
    protected $signature = 'kariri:import-approved-places {file=kariri_places_mvp_aprovados.json}';
    protected $description = 'Importa os 33 locais auditados do MVP e publica com status=published e verified=true';

    public function handle(): int
    {
        $filePath = base_path($this->argument('file'));

        if (!File::exists($filePath)) {
            $this->error("Arquivo não encontrado: {$filePath}");
            return 1;
        }

        $json = File::get($filePath);
        $data = json_decode($json, true);

        if (!$data || !isset($data['places']) || !is_array($data['places'])) {
            $this->error("JSON inválido ou chave 'places' ausente.");
            return 1;
        }

        $places = $data['places'];
        $this->info("Iniciando importação de " . count($places) . " locais autorizados...");

        $created = 0;
        $updated = 0;
        $withCoords = 0;
        $withoutCoords = 0;

        DB::beginTransaction();

        try {
            foreach ($places as $index => $item) {
                $slug = trim($item['slug'] ?? '');
                if (!$slug) {
                    $this->warn("Linha {$index}: Slug ausente, pulando.");
                    continue;
                }

                // 1. Resolução de Cidade
                $city = City::where('slug', $item['city_slug'])->first();
                $cityId = $city ? $city->id : ($item['city_name'] === 'Crato' ? 1 : ($item['city_name'] === 'Juazeiro do Norte' ? 2 : 3));

                // 2. Resolução de Categoria
                $category = Category::where('slug', $item['category_slug'])->first();
                $categoryId = $category ? $category->id : 1;

                // 3. Validação Estrita de Coordenadas
                $lat = $item['latitude'];
                $lng = $item['longitude'];
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

                // 4. Update or Create usando SLUG como chave exclusiva
                $place = Place::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => $item['name'],
                        'category_id' => $categoryId,
                        'category_slug' => $item['category_slug'],
                        'city_id' => $cityId,
                        'city_slug' => $item['city_slug'],
                        'city_name' => $item['city_name'],
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
                        'cover_image' => $item['cover_image'] ?? '/placeholders/' . $item['category_slug'] . '.svg',
                        'images' => [], // Regra 11: lista vazia
                        'tags' => $item['tags'] ?? [],
                        'status' => 'published', // Regra 4
                        'verified' => true, // Regra 5
                        'needs_review' => false, // Regra 6: publicação autorizada
                    ]
                );

                if ($place->wasRecentlyCreated) {
                    $created++;
                } else {
                    $updated++;
                }
            }

            DB::commit();

            $this->info("========================================");
            $this->info("SUCESSO: Importação Concluída!");
            $this->info("Total processado: " . count($places));
            $this->info("Criados: {$created} | Atualizados: {$updated}");
            $this->info("Com coordenadas reais no mapa: {$withCoords}");
            $this->info("Sem coordenadas (somente texto): {$withoutCoords}");
            $this->info("Status: published | Verified: true | Needs Review: false");
            $this->info("========================================");

            return 0;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Erro durante a importação: " . $e->getMessage());
            return 1;
        }
    }
}
