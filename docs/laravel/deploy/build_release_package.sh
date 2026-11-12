#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# SCRIPT DE EMPACOTAMENTO SEGURO POR ALLOWLIST — KARIRI.APP LARAVEL BACKEND
# Conforme apontamento da Auditoria Técnica P0-01 e P0-02
# ==============================================================================
# Este script gera um pacote ZIP de release limpo para upload na Hostinger,
# excluindo estritamente credenciais (.env), logs, bancos SQLite locais,
# backups PHP, dumps SQL e caches operacionais.
# ==============================================================================

PROJECT_DIR="${1:-.}"
OUTPUT_DIR="${2:-./dist-release}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RELEASE_ZIP="${OUTPUT_DIR}/kariri-api-release-${TIMESTAMP}.zip"

mkdir -p "${OUTPUT_DIR}"

echo "==> Iniciando empacotamento seguro por allowlist..."

# Cria pasta temporária de montagem
TMP_DIR=$(mktemp -d)
trap 'rm -rf "${TMP_DIR}"' EXIT

RELEASE_SRC="${TMP_DIR}/kariri-api-core"
mkdir -p "${RELEASE_SRC}"

# Copia somente os diretórios e arquivos de código autorizados (Allowlist)
echo "==> Copiando diretórios da aplicação autorizados..."
cp -R "${PROJECT_DIR}/app" "${RELEASE_SRC}/"
cp -R "${PROJECT_DIR}/bootstrap" "${RELEASE_SRC}/"
cp -R "${PROJECT_DIR}/config" "${RELEASE_SRC}/"
cp -R "${PROJECT_DIR}/database" "${RELEASE_SRC}/"
cp -R "${PROJECT_DIR}/public" "${RELEASE_SRC}/"
cp -R "${PROJECT_DIR}/resources" "${RELEASE_SRC}/"
cp -R "${PROJECT_DIR}/routes" "${RELEASE_SRC}/"

# Copia arquivos de configuração de dependências
cp "${PROJECT_DIR}/artisan" "${RELEASE_SRC}/"
cp "${PROJECT_DIR}/composer.json" "${RELEASE_SRC}/"
if [ -f "${PROJECT_DIR}/composer.lock" ]; then
  cp "${PROJECT_DIR}/composer.lock" "${RELEASE_SRC}/"
fi

# Cria estrutura vazia necessária para storage com .gitignore
echo "==> Criando estrutura limpa de storage e bootstrap/cache..."
mkdir -p "${RELEASE_SRC}/storage/app/public"
mkdir -p "${RELEASE_SRC}/storage/framework/cache/data"
mkdir -p "${RELEASE_SRC}/storage/framework/sessions"
mkdir -p "${RELEASE_SRC}/storage/framework/views"
mkdir -p "${RELEASE_SRC}/storage/logs"
mkdir -p "${RELEASE_SRC}/bootstrap/cache"

touch "${RELEASE_SRC}/storage/logs/.gitignore"
touch "${RELEASE_SRC}/storage/framework/cache/.gitignore"
touch "${RELEASE_SRC}/storage/framework/sessions/.gitignore"
touch "${RELEASE_SRC}/storage/framework/views/.gitignore"

# PURGA ESTREITA: Remove qualquer artefato sensível residual que possa ter entrado
echo "==> Purgando arquivos sensíveis, bancos locais, backups e dumps..."
find "${RELEASE_SRC}" -type f -name ".env*" -delete
find "${RELEASE_SRC}" -type f -name "*.sqlite*" -delete
find "${RELEASE_SRC}" -type f -name "*.log" -delete
find "${RELEASE_SRC}" -type f -name "*.backup*" -delete
find "${RELEASE_SRC}" -type f -name "*.bak" -delete
find "${RELEASE_SRC}" -type f -name "*.sql" -delete
find "${RELEASE_SRC}" -type f -name "*.zip" -delete
find "${RELEASE_SRC}" -type d -name "vendor" -exec rm -rf {} + 2>/dev/null || true
find "${RELEASE_SRC}" -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true

# Compacta o pacote final
echo "==> Gerando arquivo ZIP final: ${RELEASE_ZIP}..."
(cd "${TMP_DIR}" && zip -r -q "${RELEASE_ZIP}" "kariri-api-core")

echo "=========================================================="
echo "PACOTE DE RELEASE PRODUZIDO COM SUCESSO!"
echo "Destino: ${RELEASE_ZIP}"
echo "Tamanho: $(du -h "${RELEASE_ZIP}" | cut -f1)"
echo "Conteúdo seguro: sem .env, sem logs, sem SQLite, sem dumps."
echo "=========================================================="
