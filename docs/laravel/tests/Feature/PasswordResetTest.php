<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_returns_generic_message_for_existing_user(): void
    {
        $user = User::factory()->create([
            'email' => 'maria@cariri.app.br',
        ]);

        $response = $this->postJson('/api/forgot-password', [
            'email' => 'maria@cariri.app.br',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Se o e-mail informado estiver cadastrado, você receberá um link com instruções para redefinir sua senha.',
            ]);
    }

    public function test_forgot_password_returns_same_generic_message_for_non_existent_user_preventing_enumeration(): void
    {
        $response = $this->postJson('/api/forgot-password', [
            'email' => 'inexistente@cariri.app.br',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Se o e-mail informado estiver cadastrado, você receberá um link com instruções para redefinir sua senha.',
            ]);
    }

    public function test_reset_password_with_valid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'pedro@cariri.app.br',
            'password' => Hash::make('antigaSenha123'),
        ]);

        $token = Password::createToken($user);

        $response = $this->postJson('/api/reset-password', [
            'email' => 'pedro@cariri.app.br',
            'token' => $token,
            'password' => 'novaSenhaForte456!',
            'password_confirmation' => 'novaSenhaForte456!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.',
            ]);

        $this->assertTrue(Hash::check('novaSenhaForte456!', $user->fresh()->password));
    }

    public function test_reset_password_with_invalid_or_expired_token(): void
    {
        $user = User::factory()->create([
            'email' => 'pedro@cariri.app.br',
        ]);

        $response = $this->postJson('/api/reset-password', [
            'email' => 'pedro@cariri.app.br',
            'token' => 'token_totalmente_invalido_ou_expirado',
            'password' => 'novaSenhaForte456!',
            'password_confirmation' => 'novaSenhaForte456!',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'status' => 'token_invalid_or_expired',
            ]);
    }

    public function test_forgot_password_is_rate_limited(): void
    {
        for ($i = 0; $i < 6; $i++) {
            $response = $this->postJson('/api/forgot-password', [
                'email' => 'throttle@cariri.app.br',
            ]);
        }

        // 7ª tentativa deve ser bloqueada com 429
        $response = $this->postJson('/api/forgot-password', [
            'email' => 'throttle@cariri.app.br',
        ]);

        $response->assertStatus(429);
    }

    public function test_forgot_password_returns_429_when_broker_throttles(): void
    {
        Password::shouldReceive('sendResetLink')
            ->once()
            ->andReturn(Password::RESET_THROTTLED);

        $response = $this->postJson('/api/forgot-password', [
            'email' => 'maria@cariri.app.br',
        ]);

        $response->assertStatus(429)
            ->assertJson([
                'message' => 'Muitas tentativas de recuperação para este e-mail. Por favor, aguarde alguns instantes antes de tentar novamente.',
            ]);
    }

    public function test_forgot_password_returns_500_on_mail_transport_failure(): void
    {
        Password::shouldReceive('sendResetLink')
            ->once()
            ->andThrow(new \RuntimeException('Connection to SMTP server failed'));

        $response = $this->postJson('/api/forgot-password', [
            'email' => 'maria@cariri.app.br',
        ]);

        $response->assertStatus(500)
            ->assertJson([
                'message' => 'Falha temporária no serviço de e-mail. Por favor, tente novamente mais tarde.',
            ]);
    }
}
