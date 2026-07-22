# Consultas Ciudadanas

Consultas Ciudadanas es un flavor de democraciaOS, impulsado por Democracia en Red.

Este repositorio está hecho con Nuxt y provee el frontend y backend de Consultas Ciudadanas, orientada a publicar procesos de consulta y participacion ciudadana con una arquitectura moderna en Nuxt.

## Stack

- Nuxt 4
- Nuxt UI
- TypeScript
- Prisma 7
- MariaDB / MySQL
- ESLint

## Desarrollo

Instalar dependencias:

```bash
pnpm install
```

Levantar entorno local:

```bash
pnpm dev
```

## Arranque rapido (primera vez)

Pasos minimos para tener la app corriendo de punta a punta con base de datos:

```bash
# 1. Dependencias
pnpm install

# 2. Variables de entorno
cp .env.example .env

# 3. Base de datos (MariaDB por Docker Compose)
docker compose up -d mariadb

# 4. Aplicar migraciones y generar el cliente Prisma
pnpm run db:deploy
pnpm run db:generate

# 5. Cargar datos de ejemplo (usuarios + institucion + taxonomias)
pnpm run db:seed

# 6. Levantar la app
pnpm dev
```

La app queda disponible en `http://localhost:3000`.

### Usuarios de desarrollo

El seed crea usuarios ya verificados con la contrasena `Cambiar1234`
(solo para desarrollo, no usar en produccion):

| Email | Rol |
| --- | --- |
| `admin@consultas.local` | platform_admin |
| `equipo@consultas.local` | collaborator (equipo institucional) |
| `colaborador1@consultas.local` | collaborator |
| `colaborador2@consultas.local` | collaborator |
| `ciudadania@consultas.local` | ciudadano |

### Emails en desarrollo

Si `NUXT_MAIL_TRANSPORT` esta vacio (modo por defecto), los emails **no se
envian**: se loguean a la consola del servidor. El enlace de verificacion o de
restablecimiento de contrasena aparece en el log, listo para copiar y pegar.

### Archivos subidos (storage local)

Con `NUXT_STORAGE_DRIVER=local`, los archivos se guardan en
`NUXT_STORAGE_LOCAL_DIR` (por defecto `./.data/uploads`) y se sirven bajo la ruta
publica `/uploads/<key>`. Con `NUXT_STORAGE_DRIVER=s3` (S3 / DigitalOcean Spaces),
se acceden por su URL publica o presignada y la ruta `/uploads` no se usa.
Si necesitas guardar todo dentro de una carpeta base del bucket, usa
`NUXT_STORAGE_S3_PREFIX` (por ejemplo `projects/consultas-ciudadanas-dev`).

### Verificacion (typecheck + lint + build)

```bash
pnpm run verify
```

## Base de datos local (Docker Compose)

El proyecto incluye un servicio base de MariaDB en [docker-compose.yml](docker-compose.yml).

1. Copiar variables de entorno si todavia no existe `.env`:

```bash
cp .env.example .env
```

2. Levantar MariaDB:

```bash
docker compose up -d mariadb
```

3. Verificar estado:

```bash
docker compose ps
```

4. Apagar el servicio sin perder datos:

```bash
docker compose down
```

Notas:
- Los datos persisten en el volumen `db_data`.
- Si queres borrar datos locales por completo, usa `docker compose down -v`.

## Prisma y migraciones

El proyecto usa Prisma 7 con MariaDB/MySQL. El schema modular vive en [prisma/schema](prisma/schema) y las migraciones versionadas en [prisma/migrations](prisma/migrations).

Variables relevantes:

```bash
DATABASE_URL=mysql://consultas_app:changeme-app-password@127.0.0.1:3306/consultas_ciudadanas
DATABASE_MIGRATION_URL=mysql://root:changeme-root-password@127.0.0.1:3306/consultas_ciudadanas
```

`DATABASE_URL` es la conexion de runtime de la aplicacion. `DATABASE_MIGRATION_URL` se usa para migraciones locales porque Prisma Migrate necesita crear una shadow database en MySQL/MariaDB.

Generar Prisma Client:

```bash
pnpm run db:generate
```

Crear una migracion local despues de modificar el schema:

```bash
pnpm run db:migrate --name nombre_de_la_migracion
```

Aplicar migraciones pendientes en un entorno ya preparado:

```bash
pnpm run db:deploy
```

Probar la conexion de base de datos:

```bash
pnpm run db:test
```

Abrir Prisma Studio:

```bash
pnpm run db:studio
```

Seed de datos base (Prisma 7, ejecucion explicita):

```bash
pnpm run db:seed
```

Por defecto corre los perfiles `base` (usuarios) e `institution` (institucion
demo, paginas, categorias y etiquetas). Tambien se pueden correr por separado:

```bash
pnpm run db:seed:base          # solo usuarios base
pnpm run db:seed:institution   # solo institucion y taxonomias
```

Para ejecutar perfiles especificos en una sola corrida:

```bash
pnpm run db:seed -- --profile base,institution
```

### Datos demo de consultas

El perfil `demo` crea un set de consultas de ejemplo imaginadas para municipios
de la Provincia de Buenos Aires, con temas de participacion (apoyo, voto y
encuesta), comentarios con respuestas, reacciones y participaciones ciudadanas.
Requiere haber corrido antes los perfiles `base` (reparte la creacion y
administracion de las consultas entre las personas colaboradoras
`equipo@consultas.local`, `colaborador1@consultas.local` y
`colaborador2@consultas.local`, con membresias de administracion por consulta)
e `institution` (usa sus categorias y etiquetas).

```bash
pnpm run db:seed:demo          # solo el dataset demo (12 consultas por defecto)
pnpm run db:seed:all           # base + institution + demo
pnpm run db:seed -- --profile demo --count 15   # cantidad puntual (maximo 15)
```

El perfil `demo` **regenera por completo** su dataset en cada corrida: borra las
consultas cuyo slug empieza con `demo-` (y en cascada sus temas, comentarios,
reacciones y participaciones) antes de recrearlas. Los vecinos demo
(`demo-vecino-N@consultas.local`) se reutilizan y comparten la contrasena
`Cambiar1234`.

Flujo recomendado para cambios de modelo:

1. Editar los archivos de dominio en [prisma/schema](prisma/schema).
2. Ejecutar `pnpm run db:migrate --name nombre_descriptivo`.
3. Revisar el SQL generado en [prisma/migrations](prisma/migrations).
4. Ejecutar `pnpm run db:generate` si hace falta regenerar tipos.
5. Correr `pnpm run db:test`, `pnpm run typecheck` y `pnpm lint` antes de cerrar el cambio.

El schema cubre usuarios, consultas, temas, participaciones por mecanismo,
comentarios, categorias, etiquetas, assets, paginas institucionales y cierres.

## Entornos y operacion

Resumen por entorno:

- Development: usa MariaDB local por Docker Compose y permite crear nuevas migraciones con prisma migrate dev.
- Staging: replica el flujo de produccion. No se crean migraciones nuevas aqui, solo se aplican migraciones versionadas.
- Production: solo aplica migraciones ya committeadas con prisma migrate deploy.

Variables por entorno:

- Development:
  - DATABASE_URL: usuario de aplicacion (consultas_app)
  - DATABASE_MIGRATION_URL: usuario con permisos para shadow database (root), solo para migrate dev
- Staging y Production:
  - DATABASE_URL: usuario operativo con permisos para aplicar migraciones reales
  - DATABASE_MIGRATION_URL: no se usa para deploy

Regla clave:

- No ejecutar prisma migrate dev en produccion.
- En produccion usar solo pnpm run db:deploy.
- En Prisma 7, seed se ejecuta solo de forma explicita con pnpm run db:seed.

## Flujo para cambios de base de datos

1. Modelar cambios en los archivos de [prisma/schema](prisma/schema).
2. Crear migracion en development:
	pnpm run db:migrate --name nombre_descriptivo
3. Revisar SQL generado en [prisma/migrations](prisma/migrations).
4. Regenerar cliente Prisma:
	pnpm run db:generate
5. Validar localmente:
	pnpm run db:test
	pnpm run typecheck
	pnpm run lint
6. Commitear cambios de schema y migraciones en el mismo PR.
7. En deploy de staging/production aplicar migraciones:
	pnpm run db:deploy

Guia detallada de operacion:

- [docs/runbook-db-production.md](docs/runbook-db-production.md)

## Calidad

Lint:

```bash
pnpm lint
```

Typecheck:

```bash
pnpm typecheck
```

## Build

Compilar para produccion:

```bash
pnpm build
```

Previsualizar build:

```bash
pnpm preview
```

## Tests

Los tests son **end-to-end del backend** con [`@nuxt/test-utils`](https://nuxt.com/docs/getting-started/testing) + Vitest: levantan un server Nuxt real y le pegan por HTTP, validando el contrato completo (validacion, autorizacion, dominio y serializacion) de cada endpoint.

Corren contra una **base de datos de test separada** (`consultas_ciudadanas_test`), para no tocar los datos de desarrollo. La configuracion se toma de `.env.test` (derivalo de tu `.env` cambiando el nombre de la base en `DATABASE_URL` y `DATABASE_MIGRATION_URL`).

Preparar la base de test (crea la base, otorga privilegios, aplica migraciones y siembra usuarios + institucion):

```bash
pnpm test:db:setup
```

Correr los tests:

```bash
pnpm test        # una corrida
pnpm test:watch  # modo watch
```

Los archivos viven en `test/e2e/`. Cada corrida hace un build del server (tarda ~1 min la primera vez). Las pruebas siembran su propio dato de dominio (consultas, temas, comentarios) con slugs unicos y lo limpian al terminar.

