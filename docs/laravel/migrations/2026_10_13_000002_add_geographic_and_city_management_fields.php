<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Campos territoriais na tabela de Cidades
        Schema::table('cities', function (Blueprint $table) {
            if (!Schema::hasColumn('cities', 'country')) {
                $table->string('country', 50)->default('Brasil')->after('state');
            }
            if (!Schema::hasColumn('cities', 'is_cariri_region')) {
                $table->boolean('is_cariri_region')->default(false)->after('is_active');
                $table->index('is_cariri_region');
            }
        });

        // 2. Distinção explícita no perfil de Usuários:
        // - birth_city_id / birth_city_name: Cidade natal (procedência / cadastro)
        // - current_city_id / current_city_name: Cidade atual (residência)
        // - cariri_city_id: Município do catálogo do Cariri Cearense preferido para navegação
        // - marketing_consent / marketing_consent_at: Consentimento explícito separado
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'birth_city_id')) {
                $table->foreignId('birth_city_id')->nullable()->after('status')->constrained('cities')->nullOnDelete();
                $table->string('birth_city_name', 120)->nullable()->after('birth_city_id');
            }
            if (!Schema::hasColumn('users', 'current_city_id')) {
                $table->foreignId('current_city_id')->nullable()->after('birth_city_name')->constrained('cities')->nullOnDelete();
                $table->string('current_city_name', 120)->nullable()->after('current_city_id');
            }
            if (!Schema::hasColumn('users', 'cariri_city_id')) {
                $table->foreignId('cariri_city_id')->nullable()->after('current_city_name')->constrained('cities')->nullOnDelete();
            }
            if (!Schema::hasColumn('users', 'marketing_consent')) {
                $table->boolean('marketing_consent')->default(false)->after('city_preference');
                $table->timestamp('marketing_consent_at')->nullable()->after('marketing_consent');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['birth_city_id']);
            $table->dropForeign(['current_city_id']);
            $table->dropForeign(['cariri_city_id']);
            $table->dropColumn([
                'birth_city_id',
                'birth_city_name',
                'current_city_id',
                'current_city_name',
                'cariri_city_id',
                'marketing_consent',
                'marketing_consent_at',
            ]);
        });

        Schema::table('cities', function (Blueprint $table) {
            $table->dropColumn(['country', 'is_cariri_region']);
        });
    }
};
