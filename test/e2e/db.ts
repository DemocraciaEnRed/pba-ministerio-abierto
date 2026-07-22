import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../../prisma/generated/client'

/**
 * Cliente Prisma dedicado a los tests e2e. Apunta a la misma base de datos de
 * test (`DATABASE_URL` de .env.test) que usa el server bajo prueba, de modo que
 * podamos sembrar datos de dominio y limpiarlos al terminar.
 */
export function createTestPrisma() {
  const databaseUrl = new URL(process.env.DATABASE_URL!)

  const adapter = new PrismaMariaDb({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.replace(/^\//, ''),
    connectionLimit: 5
  })

  return new PrismaClient({ adapter })
}

export type TestPrisma = ReturnType<typeof createTestPrisma>
