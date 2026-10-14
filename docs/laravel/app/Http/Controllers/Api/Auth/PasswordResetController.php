<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\PasswordReset;

class PasswordResetController extends Controller
{
    /**
     * Envia link com token de redefinição de senha para o e-mail informado.
     * Verifica e registra o status de envio no servidor e trata erros de transporte,
     * enquanto mantém resposta neutra para o usuário (evitando enumeração de contas).
     */
    public function sendResetLinkEmail(ForgotPasswordRequest $request): JsonResponse
    {
        $email = strtolower(trim((string) $request->input('email')));
        $emailHash = hash('sha256', $email);

        try {
            $status = Password::sendResetLink(
                $request->only('email')
            );

            // 1. Link gerado e enviado com sucesso pelo broker
            if ($status === Password::RESET_LINK_SENT) {
                Log::info('Password reset link successfully generated and dispatched', [
                    'email_hash' => $emailHash,
                ]);

                return response()->json([
                    'message' => 'Se o e-mail informado estiver cadastrado, você receberá um link com instruções para redefinir sua senha.',
                ], 200);
            }

            // 2. Limite de requisições acionado pelo broker de senhas do Laravel
            if ($status === Password::RESET_THROTTLED) {
                Log::warning('Password reset request throttled by broker', [
                    'email_hash' => $emailHash,
                ]);

                return response()->json([
                    'message' => 'Muitas tentativas de recuperação para este e-mail. Por favor, aguarde alguns instantes antes de tentar novamente.',
                ], 429);
            }

            // 3. Usuário inexistente (Password::INVALID_USER)
            // Registra internamente no log para auditoria operacional, mas retorna
            // a exata mesma resposta HTTP 200 para proteger a privacidade e evitar enumeração
            Log::info('Password reset requested for non-existent email (neutral response returned)', [
                'email_hash' => $emailHash,
            ]);

            return response()->json([
                'message' => 'Se o e-mail informado estiver cadastrado, você receberá um link com instruções para redefinir sua senha.',
            ], 200);

        } catch (\Throwable $e) {
            // Falha real na infraestrutura de e-mail (SMTP, transporte, fila, etc.)
            Log::error('Critical failure while sending password reset email: ' . $e->getMessage(), [
                'email_hash' => $emailHash,
                'exception' => $e,
            ]);

            return response()->json([
                'message' => 'Falha temporária no serviço de e-mail. Por favor, tente novamente mais tarde.',
            ], 500);
        }
    }

    /**
     * Redefine a senha do usuário utilizando o token validado pelo broker do Laravel.
     */
    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.',
            ], 200);
        }

        // Falha: token inválido, expirado ou usuário não localizado
        return response()->json([
            'message' => 'O token de recuperação é inválido ou expirou. Por favor, solicite um novo link.',
            'status' => 'token_invalid_or_expired'
        ], 400);
    }
}
