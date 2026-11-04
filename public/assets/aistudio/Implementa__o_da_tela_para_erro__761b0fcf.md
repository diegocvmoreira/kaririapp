# Implementação da tela para erro `403 — e-mail não confirmado`

## Objetivo

Tratar especificamente o retorno `403` da API quando o usuário tenta entrar sem confirmar o e-mail, permitindo o reenvio do link de confirmação.

O backend já deve retornar:

```json
{
  "message": "Confirme seu e-mail antes de entrar. Solicite um novo link de verificação se necessário.",
  "requires_verification": true
}
```

com HTTP `403`.

A implementação não deve criar sessão, salvar token ou marcar o usuário como autenticado.

---

## 1. Tratamento no cliente de autenticação

Arquivo:

```text
src/services/api/auth.ts
```

No método `login()`, tratar o `403` antes do tratamento de `422`:

```ts
} catch (err: unknown) {
  if (err instanceof ApiError && err.status === 403) {
    const data = err.data as {
      requires_verification?: boolean;
      message?: string;
    };

    if (data?.requires_verification === true) {
      throw new ApiError(
        403,
        'Seu e-mail ainda não foi confirmado.',
        {
          ...data,
          requires_verification: true,
        },
        '/login'
      );
    }
  }

  if (err instanceof ApiError && err.status === 422) {
    throw new ApiError(
      401,
      'Credenciais inválidas. Verifique os dados informados.',
      {},
      '/login'
    );
  }

  throw err;
}
```

O `403` não deve ser convertido para `401`.

O token só pode ser salvo após uma resposta de login com sucesso:

```ts
localStorage.setItem('kariri_auth_token', data.token);
localStorage.setItem('kariri_user_profile', JSON.stringify(data.user));
```

Nunca salvar esses dados quando `requires_verification === true`.

---

## 2. Estados na tela de login

Arquivo:

```text
src/pages/LoginPage.tsx
```

Adicionar os estados:

```tsx
const [unverifiedEmail, setUnverifiedEmail] = useState('');
const [showVerificationPanel, setShowVerificationPanel] = useState(false);
const [resendMessage, setResendMessage] = useState('');
const [resendError, setResendError] = useState('');
const [isResending, setIsResending] = useState(false);
const [turnstileToken, setTurnstileToken] = useState('');
```

Importar:

```tsx
import { Mail } from 'lucide-react';
import { TurnstileWidget } from '../components/auth/TurnstileWidget';
```

---

## 3. Tratamento do erro no login

No `catch` do formulário de login:

```tsx
} catch (err: any) {
  if (err?.status === 403 && err?.data?.requires_verification) {
    setUnverifiedEmail(email.trim().toLowerCase());
    setShowVerificationPanel(true);
    setErrorMsg('');
    return;
  }

  setErrorMsg(
    err?.message ||
      'Não foi possível entrar. Verifique seus dados e tente novamente.'
  );
}
```

O estado `email` deve ser o mesmo utilizado pelo formulário de login.

Ao receber o `403`:

- não salvar token;
- não salvar o perfil no `localStorage`;
- não alterar o contexto de autenticação;
- não redirecionar para `/perfil`;
- não liberar favoritos, avaliações ou contribuições.

---

## 4. Função de reenvio

Ainda em:

```text
src/pages/LoginPage.tsx
```

Adicionar:

```tsx
const handleResendVerification = async () => {
  if (!unverifiedEmail) return;

  setIsResending(true);
  setResendMessage('');
  setResendError('');

  try {
    const response = await authApi.resendVerification(
      unverifiedEmail,
      turnstileToken
    );

    setResendMessage(
      response.message ||
        'Se a conta puder receber confirmação, um novo link será enviado.'
    );
  } catch (err: any) {
    if (err?.status === 429) {
      setResendError(
        'Muitas solicitações. Aguarde alguns minutos antes de tentar novamente.'
      );
    } else {
      setResendError(
        err?.message ||
          'Não foi possível reenviar o link. Tente novamente mais tarde.'
      );
    }
  } finally {
    setIsResending(false);
  }
};
```

---

## 5. Painel visual de confirmação

Inserir na tela de login, próximo à mensagem de erro:

```tsx
{showVerificationPanel && (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-4">
    <div className="flex items-start gap-3">
      <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

      <div className="space-y-1">
        <h2 className="text-sm font-bold text-amber-950">
          E-mail ainda não confirmado
        </h2>

        <p className="text-xs leading-relaxed text-amber-900">
          Confirme o endereço associado à sua conta antes de entrar.
          Verifique também a caixa de spam.
        </p>

        <p className="break-all text-xs font-semibold text-amber-950">
          {unverifiedEmail}
        </p>
      </div>
    </div>

    <TurnstileWidget onToken={setTurnstileToken} />

    {resendMessage && (
      <p className="text-xs font-medium text-emerald-700">
        {resendMessage}
      </p>
    )}

    {resendError && (
      <p className="text-xs font-medium text-red-700">
        {resendError}
      </p>
    )}

    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={handleResendVerification}
        disabled={isResending}
        className="flex-1 rounded-xl bg-[#DE1F2A] px-4 py-3 text-xs font-bold text-white disabled:opacity-50"
      >
        {isResending ? 'Reenviando...' : 'Reenviar link de confirmação'}
      </button>

      <button
        type="button"
        onClick={() => {
          setShowVerificationPanel(false);
          setResendMessage('');
          setResendError('');
        }}
        className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-xs font-bold text-gray-800"
      >
        Usar outro e-mail
      </button>
    </div>

    <Link
      to="/verificar-email"
      className="block text-center text-xs font-bold text-[#DE1F2A] hover:underline"
    >
      Já confirmei meu e-mail
    </Link>
  </div>
)}
```

---

## 6. Endpoint utilizado

A rota Laravel já existente é:

```php
Route::post('/email/verification-notification', [AuthController::class, 'resendVerification'])
    ->middleware([VerifyTurnstile::class, 'throttle:3,60']);
```

O cliente deve chamar:

```ts
await authApi.resendVerification(email, turnstileToken);
```

A resposta de sucesso deve ser genérica:

```json
{
  "message": "Se a conta puder receber confirmação, um novo link será enviado."
}
```

Essa mensagem evita revelar se um endereço está cadastrado.

---

## 7. Comportamentos esperados

### Login com e-mail confirmado

Resposta:

```text
200
```

A aplicação deve:

- salvar o token;
- salvar o perfil;
- atualizar o contexto de autenticação;
- permitir acesso normal.

### Login com e-mail não confirmado

Resposta:

```text
403
```

A aplicação deve:

- manter o e-mail preenchido;
- não autenticar o usuário;
- exibir o painel de confirmação;
- permitir o reenvio do link.

### Login com senha incorreta

Resposta esperada:

```text
401 ou 422
```

A aplicação deve exibir mensagem genérica e não informar se o e-mail existe.

### Reenvio bem-sucedido

Resposta:

```text
200
```

Exibir:

```text
Se a conta puder receber confirmação, um novo link será enviado.
```

### Limite de reenvio excedido

Resposta:

```text
429
```

Exibir:

```text
Muitas solicitações. Aguarde alguns minutos antes de tentar novamente.
```

---

## 8. Turnstile em prototipação e produção

No ambiente de prototipação, o Turnstile pode permanecer desativado conforme a configuração atual.

Em produção, manter o Turnstile habilitado no reenvio:

```php
VerifyTurnstile::class
```

Não remover o middleware da rota de produção.

Não colocar a chave secreta no frontend.

---

## 9. Fluxo final

```text
Usuário informa e-mail e senha
        ↓
API responde 403 requires_verification=true
        ↓
Frontend mantém o e-mail preenchido
        ↓
Exibe “E-mail ainda não confirmado”
        ↓
Usuário clica em “Reenviar link de confirmação”
        ↓
API envia novo link
        ↓
Usuário abre o link recebido
        ↓
Frontend abre /verificar-email?verified=1
        ↓
Usuário retorna ao login
        ↓
Login recebe 200
```

## 10. Critérios de aceite

- `403` com `requires_verification=true` exibe o painel correto.
- `403` não é tratado como senha incorreta.
- Nenhum token é salvo antes da confirmação.
- A opção de reenvio usa o e-mail informado.
- O botão fica desabilitado durante o envio.
- O erro `429` é tratado separadamente.
- A mensagem de sucesso não revela se o e-mail existe.
- O usuário pode trocar o e-mail e tentar novamente.
- O fluxo não libera ações autenticadas antes da confirmação.
