<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\PasswordReset;

class PasswordResetController extends Controller
{
    /**
     * Envia link com token de redefinição de senha para o e-mail informado.
     * Sempre retorna resposta genérica (HTTP 200) para evitar enumeração de contas.
     */
    public function sendResetLinkEmail(ForgotPasswordRequest $request): JsonResponse
    {
        $status = Password::sendResetLink(
            $request->only('email')
        );

        // Resposta sempre neutra e padronizada (anti-enumeração)
        return response()->json([
            'message' => 'Se o e-mail informado estiver cadastrado, você receberá um link com instruções para redefinir sua senha.',
        ], 200);
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
