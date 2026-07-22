#!/usr/bin/env bash
#
# deploy-db.sh — Aplica migraciones Prisma (y opcionalmente el seed) contra una
# base MySQL/MariaDB remota accesible por SSH, abriendo un túnel temporal.
#
# Pensado para el flujo "simple": la imagen de producción NO trae el CLI de
# Prisma ni la carpeta prisma/migrations, así que las migraciones se aplican
# desde tu máquina, desde este repo, contra la DB del droplet.
#
# Qué hace:
#   1. Abre un túnel SSH  local:PORT -> (droplet) 127.0.0.1:3306
#   2. Corre `prisma migrate deploy` con la DATABASE_URL apuntando al túnel.
#   3. Opcional: corre el seed (--seed) y/o muestra el estado (--status).
#   4. Cierra el túnel al terminar (siempre, incluso ante errores).
#
# Requisitos previos (una sola vez, con un usuario con privilegios):
#   La base y el usuario de la app deben existir. Desde `ssh do-mysql`:
#     CREATE DATABASE consultas_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
#     CREATE USER 'app'@'%' IDENTIFIED BY '...';
#     GRANT ALL PRIVILEGES ON consultas_prod.* TO 'app'@'%';
#     FLUSH PRIVILEGES;
#
# Configuración: lee variables desde un archivo de entorno (por defecto
# `.env.deploy`, gitignoreado). Ver `.env.deploy.example`.
#
#   DATABASE_URL   URL de la app apuntando al túnel LOCAL, ej:
#                  mysql://app:PASS@127.0.0.1:3307/consultas_prod
#                  (el puerto define el puerto local del túnel)
#   SSH_HOST       Alias/host SSH del droplet de MySQL, ej: do-mysql
#   REMOTE_DB      (opcional) destino de la DB visto desde el droplet.
#                  Por defecto 127.0.0.1:3306
#   SEED_PROFILES  (opcional) perfiles de seed para --seed. Por defecto: base
#
# Uso:
#   pnpm run db:deploy:remote                 # solo migraciones
#   pnpm run db:deploy:remote -- --status     # migraciones + estado
#   pnpm run db:deploy:remote -- --seed       # migraciones + seed (perfil base)
#   pnpm run db:deploy:remote -- --seed institution
#   pnpm run db:deploy:remote -- --env .env.staging
#   pnpm run db:deploy:remote -- --dry-run    # solo abre el túnel y valida
#
set -euo pipefail

# --- Ubicarse en la raíz del repo -------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

# --- Parseo de argumentos ----------------------------------------------------
ENV_FILE=".env.deploy"
DO_SEED=false
DO_STATUS=false
DRY_RUN=false
SEED_ARG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENV_FILE="${2:?--env requiere una ruta}"; shift 2 ;;
    --seed)
      DO_SEED=true
      # Perfil opcional posicional que no empiece con "--".
      if [[ "${2:-}" != "" && "${2:-}" != --* ]]; then SEED_ARG="$2"; shift; fi
      shift ;;
    --status)
      DO_STATUS=true; shift ;;
    --dry-run)
      DRY_RUN=true; shift ;;
    -h|--help)
      grep -E '^#( |$)' "$0" | sed -E 's/^# ?//'; exit 0 ;;
    *)
      echo "Argumento desconocido: $1" >&2; exit 2 ;;
  esac
done

# --- Cargar archivo de entorno ----------------------------------------------
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: no existe el archivo de entorno '${ENV_FILE}'." >&2
  echo "       Copiá .env.deploy.example y completá los valores." >&2
  exit 1
fi
set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

: "${DATABASE_URL:?Falta DATABASE_URL en ${ENV_FILE}}"
: "${SSH_HOST:?Falta SSH_HOST en ${ENV_FILE}}"
REMOTE_DB="${REMOTE_DB:-127.0.0.1:3306}"
SEED_PROFILES="${SEED_ARG:-${SEED_PROFILES:-base}}"

# --- Extraer host/puerto local desde DATABASE_URL ---------------------------
_afterproto="${DATABASE_URL#*://}"
_hostport="${_afterproto#*@}"       # host:port/db?params
_hostport="${_hostport%%/*}"        # host:port
LOCAL_HOST="${_hostport%%:*}"
LOCAL_PORT="${_hostport##*:}"

if [[ "${LOCAL_HOST}" != "127.0.0.1" && "${LOCAL_HOST}" != "localhost" ]]; then
  echo "ERROR: DATABASE_URL debe apuntar al túnel local (127.0.0.1), no a '${LOCAL_HOST}'." >&2
  echo "       El script tuneliza ${LOCAL_PORT} -> ${SSH_HOST}:${REMOTE_DB}." >&2
  exit 1
fi
if [[ ! "${LOCAL_PORT}" =~ ^[0-9]+$ ]]; then
  echo "ERROR: no pude determinar el puerto local desde DATABASE_URL." >&2
  exit 1
fi

# --- Verificar que el puerto local esté libre --------------------------------
if (exec 3<>"/dev/tcp/127.0.0.1/${LOCAL_PORT}") 2>/dev/null; then
  exec 3>&- 3<&- 2>/dev/null || true
  echo "ERROR: el puerto local ${LOCAL_PORT} ya está en uso." >&2
  echo "       Cerrá el proceso que lo ocupa o cambiá el puerto en DATABASE_URL." >&2
  exit 1
fi

# --- Abrir túnel SSH ---------------------------------------------------------
echo ">> Abriendo túnel SSH: 127.0.0.1:${LOCAL_PORT} -> ${SSH_HOST} (${REMOTE_DB})"
ssh -N -L "${LOCAL_PORT}:${REMOTE_DB}" "${SSH_HOST}" &
TUNNEL_PID=$!

cleanup() {
  if kill -0 "${TUNNEL_PID}" 2>/dev/null; then
    kill "${TUNNEL_PID}" 2>/dev/null || true
    wait "${TUNNEL_PID}" 2>/dev/null || true
    echo ">> Túnel SSH cerrado."
  fi
}
trap cleanup EXIT INT TERM

# --- Esperar a que el túnel acepte conexiones --------------------------------
echo -n ">> Esperando el túnel"
for _ in $(seq 1 30); do
  if ! kill -0 "${TUNNEL_PID}" 2>/dev/null; then
    echo ""; echo "ERROR: el túnel SSH terminó inesperadamente." >&2; exit 1
  fi
  if (exec 3<>"/dev/tcp/127.0.0.1/${LOCAL_PORT}") 2>/dev/null; then
    exec 3>&- 3<&- 2>/dev/null || true
    echo " listo."
    break
  fi
  echo -n "."
  sleep 1
done

if ! (exec 3<>"/dev/tcp/127.0.0.1/${LOCAL_PORT}") 2>/dev/null; then
  echo ""; echo "ERROR: el túnel no respondió a tiempo en el puerto ${LOCAL_PORT}." >&2
  exit 1
fi
exec 3>&- 3<&- 2>/dev/null || true

if [[ "${DRY_RUN}" == true ]]; then
  echo ">> --dry-run: túnel OK. No se ejecutan migraciones."
  exit 0
fi

# --- Aplicar migraciones -----------------------------------------------------
echo ">> Aplicando migraciones (prisma migrate deploy)..."
DATABASE_URL="${DATABASE_URL}" pnpm exec prisma migrate deploy

# --- Seed opcional -----------------------------------------------------------
if [[ "${DO_SEED}" == true ]]; then
  echo ">> Ejecutando seed (perfil: ${SEED_PROFILES})..."
  DATABASE_URL="${DATABASE_URL}" pnpm run db:seed -- --profile "${SEED_PROFILES}"
fi

# --- Estado opcional ---------------------------------------------------------
if [[ "${DO_STATUS}" == true ]]; then
  echo ">> Estado de migraciones:"
  DATABASE_URL="${DATABASE_URL}" pnpm exec prisma migrate status
fi

echo ">> Listo."
