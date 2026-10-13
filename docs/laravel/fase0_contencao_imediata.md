# Fase 0 — Contenção Imediata (Procedimento Operacional)

Este documento define o roteiro imediato de segurança para o ambiente de produção do Laravel (`https://kariri.app.br/kariri-api`).

---

## 1. Rotação de Credenciais e Tokens

### A. Rotação de Senha do Banco de Dados
1. No painel do servidor PostgreSQL / MySQL ou Cloud SQL:
   - Altere a senha do usuário `kariri_user`:
     ```sql
     ALTER USER kariri_user WITH PASSWORD 'NovaSenhaUltraSegura2026!#';
     ```
2. Atualize a variável no ambiente de runtime seguro (Secret Manager ou variáveis de container do host):
   ```env
   DB_PASSWORD=NovaSenhaUltraSegura2026!#
   ```

### B. Rotação da Chave da Aplicação (`APP_KEY`)
1. A troca da `APP_KEY` invalida sessões antigas e cookies encriptados.
2. Para re-encriptar colunas sensíveis existentes no banco (se houver campos criptografados via Cast `encrypted`):
   ```bash
   php artisan key:generate --show
   # Atualize a variável APP_KEY no ambiente de produção
   ```

### C. Revogação Imediata de Todos os Tokens Sanctum
1. Como tokens podem ter sido expostos em logs antigos ou tráfego sem TLS restrito, invalide todos os tokens ativos:
   ```bash
   php artisan tinker --execute="DB::table('personal_access_tokens')->delete();"
   ```
2. Todos os usuários logados precisarão reautenticar com suas credenciais.

---

## 2. Desabilitar Debug e Retirar Logs / .env / SQLite do Deploy

1. Garanta no `.env.production`:
   ```env
   APP_ENV=production
   APP_DEBUG=false
   DEBUGBAR_ENABLED=false
   TELESCOPE_ENABLED=false
   LOG_CHANNEL=stack
   LOG_LEVEL=warning
   ```
2. **Exclusão de Arquivos Críticos no Pipeline / Git**:
   - Nunca incluir `.env`, `*.log`, `database.sqlite` ou arquivos de banco no repositório ou artefato ZIP.
   - Adicionados expressamente no `.gitignore`.
3. **Limpar logs antigos do servidor**:
   ```bash
   rm -f storage/logs/*.log
   touch storage/logs/laravel.log
   chmod 664 storage/logs/laravel.log
   ```

---

## 3. Restringir CORS

Substitua o arquivo `config/cors.php` pelo arquivo auditado em `docs/laravel/config/cors.php`:
- `allowed_origins` restrito estritamente a `https://kariri.app.br` e domínios de desenvolvimento autorizados.
- Bloqueio de wildcard `*` para métodos que aceitam credenciais.

---

## 4. Colocar API em Manutenção

Durante as migrações e rotações, evite leituras parciais ou acessos concorrentes:
```bash
# Ativa manutenção com chave de bypass para o time de engenharia
php artisan down --secret="kariri-bypass-mvp-2026" --render="errors::503"

# Executa migrações e limpezas
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Smoke tests de verificação
php artisan test --filter=SmokeTest

# Restaura o serviço online
php artisan up
```
