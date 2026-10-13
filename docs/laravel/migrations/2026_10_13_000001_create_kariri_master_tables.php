<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. CIDADES
        Schema::create('cities', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->string('state', 2)->default('CE');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('image')->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('status', 20)->default('active');
            $table->timestamps();

            $table->index('is_active');
        });

        // 2. CATEGORIAS
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->string('icon', 50)->default('tag');
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->integer('sort_order')->default(0);
            $table->string('status', 20)->default('published');
            $table->timestamps();

            $table->index(['status', 'sort_order']);
        });

        // 3. USUÁRIOS
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('avatar')->nullable();
            $table->string('role', 20)->default('visitor'); // visitor, user, business, admin
            $table->string('status', 20)->default('active'); // active, suspended, pending
            $table->string('city_preference', 50)->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->index(['role', 'status']);
        });

        // 4. LOCAIS E ESTABELECIMENTOS
        Schema::create('places', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('city_id')->constrained('cities')->restrictOnDelete();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->string('name', 255);
            $table->string('slug', 255)->unique();
            $table->text('short_description')->nullable();
            $table->longText('description')->nullable();
            $table->string('category_slug', 100)->index();
            $table->string('city_slug', 100)->index();
            $table->string('city_name', 100)->nullable();
            $table->string('neighborhood', 150)->nullable();
            $table->string('address', 255)->nullable();
            $table->string('zipcode', 20)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('coordinate_source', 50)->nullable();
            $table->string('coordinate_confidence', 20)->nullable();
            $table->boolean('needs_review')->default(false);
            $table->string('cover_image', 255)->nullable();
            $table->decimal('rating', 3, 2)->default(0.00);
            $table->unsignedInteger('reviews_count')->default(0);
            $table->tinyInteger('price_level')->default(2); // 1, 2, 3, 4
            $table->boolean('is_featured')->default(false);
            $table->boolean('verified')->default(true);
            $table->boolean('is_open_now')->default(false);
            $table->string('opening_hours', 255)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('whatsapp', 50)->nullable();
            $table->string('website', 255)->nullable();
            $table->string('instagram', 100)->nullable();
            $table->string('facebook', 100)->nullable();
            $table->string('status', 20)->default('published'); // draft, pending, published, rejected, archived
            $table->json('tags')->nullable();
            $table->timestamps();

            // Índices de performance para buscas e filtros rápidos
            $table->index(['status', 'city_id']);
            $table->index(['status', 'category_id']);
            $table->index(['status', 'is_featured']);
            $table->index(['latitude', 'longitude']);
        });

        // 5. IMAGENS DE LOCAIS (Galeria e Cover)
        Schema::create('place_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('place_id')->constrained('places')->cascadeOnDelete();
            $table->string('path', 255);
            $table->string('alt', 255)->nullable();
            $table->string('caption', 255)->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_cover')->default(false);
            $table->timestamps();

            $table->index(['place_id', 'sort_order']);
        });

        // 6. EVENTOS E AGENDA
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('place_id')->nullable()->constrained('places')->nullOnDelete();
            $table->foreignId('city_id')->constrained('cities')->restrictOnDelete();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->string('title', 255);
            $table->string('slug', 255)->unique();
            $table->text('description')->nullable();
            $table->string('cover_image', 255)->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->time('start_time')->default('19:00:00');
            $table->time('end_time')->nullable();
            $table->string('place_name', 255)->nullable();
            $table->string('city_name', 100)->nullable();
            $table->string('city_slug', 100)->nullable();
            $table->string('address', 255)->nullable();
            $table->decimal('price', 8, 2)->nullable();
            $table->boolean('is_free')->default(false);
            $table->string('ticket_url', 255)->nullable();
            $table->string('organizer', 255)->nullable();
            $table->string('category', 100)->nullable();
            $table->boolean('is_featured')->default(false);
            $table->string('status', 20)->default('published');
            $table->timestamps();

            $table->index(['status', 'start_date']);
            $table->index(['city_id', 'start_date']);
        });

        // 7. FAVORITOS
        Schema::create('favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('place_id')->nullable()->constrained('places')->cascadeOnDelete();
            $table->foreignId('event_id')->nullable()->constrained('events')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'place_id']);
            $table->unique(['user_id', 'event_id']);
        });

        // 8. REIVINDICAÇÕES DE EMPRESAS (BUSINESS CLAIMS)
        Schema::create('business_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('place_id')->constrained('places')->cascadeOnDelete();
            $table->text('message');
            $table->string('phone', 50)->nullable();
            $table->string('proof', 255)->nullable();
            $table->string('status', 20)->default('pending'); // pending, reviewed, approved, rejected
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });

        // 9. AVALIAÇÕES (REVIEWS)
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('place_id')->constrained('places')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->string('title', 150)->nullable();
            $table->text('comment');
            $table->string('status', 20)->default('published');
            $table->timestamps();

            $table->index(['place_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('business_claims');
        Schema::dropIfExists('favorites');
        Schema::dropIfExists('events');
        Schema::dropIfExists('place_images');
        Schema::dropIfExists('places');
        Schema::dropIfExists('users');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('cities');
    }
};
