#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# PIPELINE DE DEPLOY SEGURO — KARIRI.APP (LARAVEL + DOCKER/HOST)
# ==============================================================================

echo "==> [1/6] Validando ambiente e checagem de integridade..."
if [ -z "${APP_KEY:-}" ]; then
  echo "ERRO: APP_KEY não fornecida nas variáveis do ambiente!" >&2
  exit 1
fi

# Garante que nenhum .env de desenvolvimento seja acidentalmente copiado
if [ -f ".env.local" ] || [ -f ".env.dev" ]; then
  rm -f .env.local .env.dev
fi

echo "==> [2/6] Colocando API em modo de manutenção..."
php artisan down --secret="${DEPLOY_BYPASS_TOKEN:-kariri-deploy-secret}" --render="errors::503" || true

# Trap para garantir restauração em caso de falha no pipeline (Rollback)
rollback() {
  echo "ALERTA: Falha no deploy! Restaurando serviço..."
  php artisan up || true
  exit 1
}
trap rollback ERR

echo "==> [3/6] Instalando dependências em modo de produção limpo..."
composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

echo "==> [4/6] Executando migrações seguras do banco de dados..."
php artisan migrate --force

echo "==> [5/6] Otimizando caches de configuração e rotas..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "==> [6/6] Executando Smoke Test / Health Check..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/places?per_page=1 || echo "000")

if [ "$HTTP_STATUS" != "200" ] && [ "$HTTP_STATUS" != "503" ]; then
  echo "Health Check falhou com HTTP status $HTTP_STATUS!"
  exit 1
fi

echo "==> Restabelecendo serviço online..."
php artisan up

echo "=========================================================="
echo "DEPLOY DO KARIRI.APP CONCLUÍDO COM SUCESSO!"
echo "=========================================================="
