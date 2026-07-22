/**
 * Prepara la base de datos de test (`consultas_ciudadanas_test`) de forma
 * reproducible:
 *   1. Crea la base si no existe y otorga privilegios al usuario de la app.
 *   2. Aplica todas las migraciones (`prisma migrate deploy`).
 *   3. Corre el seed base + institución.
 *
 * Lee la configuración desde `.env.test`. Ejecutar con: `pnpm test:db:setup`.
 */
import { execSync } from 'node:child_process'
import { config as loadEnv } from 'dotenv'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../prisma/generated/client'

loadEnv({ path: '.env.test', override: true })

const databaseUrl = process.env.DATABASE_URL
const migrationUrl = process.env.DATABASE_MIGRATION_URL ?? databaseUrl

if (!databaseUrl || !migrationUrl) {
  throw new Error('Faltan DATABASE_URL / DATABASE_MIGRATION_URL en .env.test')
}

const dbUser = process.env.DB_USER ?? new URL(databaseUrl).username
const dbName = new URL(databaseUrl).pathname.replace(/^\//, '')

async function ensureDatabase() {
  // Nos conectamos con las credenciales de migración (root) a su base actual
  // y desde ahí creamos la base de test y otorgamos privilegios.
  const rootUrl = new URL(migrationUrl!)
  const adapter = new PrismaMariaDb({
    host: rootUrl.hostname,
    port: Number(rootUrl.port || 3306),
    user: decodeURIComponent(rootUrl.username),
    password: decodeURIComponent(rootUrl.password),
    // Conectamos sin base específica para poder crearla.
    connectionLimit: 2
  })
  const prisma = new PrismaClient({ adapter })

  await prisma.$executeRawUnsafe(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  )
  await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'%'`).catch(() => {})
  await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'localhost'`).catch(() => {})
  await prisma.$executeRawUnsafe('FLUSH PRIVILEGES').catch(() => {})
  await prisma.$disconnect()
  console.log(`Base de test lista: ${dbName} (privilegios para ${dbUser})`)
}

function run(command: string, env: NodeJS.ProcessEnv) {
  execSync(command, { stdio: 'inherit', env })
}

async function main() {
  await ensureDatabase()

  // Migraciones: se aplican con la URL de migración apuntando a la base de test.
  run('prisma migrate deploy', { ...process.env, DATABASE_URL: migrationUrl })

  // Seed: usa la URL de la app.
  run('tsx prisma/seed.ts', { ...process.env, DATABASE_URL: databaseUrl })

  console.log('Base de test preparada correctamente.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
