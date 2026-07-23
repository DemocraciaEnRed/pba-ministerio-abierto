import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../../prisma/generated/client'

const prismaClientSingleton = () => {
  const databaseUrl = new URL(process.env.DATABASE_URL!)

  // MySQL 8+ usa el plugin `caching_sha2_password`. Sobre una conexión sin TLS,
  // el driver necesita recuperar la clave pública RSA del servidor para poder
  // autenticar; hay que habilitarlo explícitamente o, preferentemente, usar SSL.
  // Se controla por query string en DATABASE_URL, ej:
  //   ...?allowPublicKeyRetrieval=true  |  ...?ssl=true
  const allowPublicKeyRetrieval
    = databaseUrl.searchParams.get('allowPublicKeyRetrieval') === 'true'
  const useSsl = databaseUrl.searchParams.get('ssl') === 'true'

  const adapter = new PrismaMariaDb({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.replace(/^\//, ''),
    connectionLimit: 5,
    allowPublicKeyRetrieval,
    ...(useSsl ? { ssl: true } : {})
  })

  return new PrismaClient({ adapter })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
