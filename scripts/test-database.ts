import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../prisma/generated/client'

const databaseUrl = new URL(process.env.DATABASE_URL!)

const adapter = new PrismaMariaDb({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || 3306),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseUrl.pathname.replace(/^\//, ''),
  connectionLimit: 5
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const result = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`

  if (result[0]?.ok !== 1) {
    throw new Error('Unexpected database response')
  }

  console.log('Database connection is working')
}

main()
  .catch((error) => {
    console.error('Database test failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
