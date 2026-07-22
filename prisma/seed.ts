/// <reference types="node" />
import 'dotenv/config'
import { parseArgs } from 'node:util'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from './generated/client'
import { seedBaseUsers } from './seeds/base-users'
import { seedConsultationsDemo } from './seeds/consultations-demo'
import { seedInstitution } from './seeds/institution'

type SeedProfile = 'base' | 'institution' | 'demo'

interface SeedRunOptions {
  demoCount?: number
}

const seedProfiles: Record<
  SeedProfile,
  (prisma: PrismaClient, options: SeedRunOptions) => Promise<void>
> = {
  base: prisma => seedBaseUsers(prisma),
  institution: prisma => seedInstitution(prisma),
  demo: (prisma, options) => seedConsultationsDemo(prisma, { count: options.demoCount })
}

function buildPrismaClient() {
  const databaseUrlEnv = process.env.DATABASE_URL

  if (!databaseUrlEnv) {
    throw new Error('DATABASE_URL is required to run seeds')
  }

  const databaseUrl = new URL(databaseUrlEnv)

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

interface ParsedSeedArgs {
  profiles: SeedProfile[]
  options: SeedRunOptions
}

function parseSeedArgs(): ParsedSeedArgs {
  const { values } = parseArgs({
    options: {
      profile: {
        type: 'string',
        short: 'p'
      },
      count: {
        type: 'string',
        short: 'c'
      }
    }
  })

  const options: SeedRunOptions = {}
  const rawCount = values.count?.trim()
  if (rawCount) {
    const parsedCount = Number(rawCount)
    if (Number.isNaN(parsedCount)) {
      throw new Error(`Invalid --count value: ${rawCount}`)
    }
    options.demoCount = parsedCount
  }

  const rawProfile = values.profile?.trim()

  if (!rawProfile) {
    return { profiles: ['base', 'institution'], options }
  }

  const requested = rawProfile
    .split(',')
    .map((item: string) => item.trim())
    .filter(Boolean)

  const invalidProfiles = requested.filter((name: string) => !(name in seedProfiles))

  if (invalidProfiles.length > 0) {
    const available = Object.keys(seedProfiles).join(', ')
    throw new Error(`Unknown seed profile(s): ${invalidProfiles.join(', ')}. Available profiles: ${available}`)
  }

  return { profiles: requested as SeedProfile[], options }
}

async function main() {
  const prisma = buildPrismaClient()
  const { profiles, options } = parseSeedArgs()

  try {
    for (const profile of profiles) {
      console.log(`Running seed profile: ${profile}`)
      await seedProfiles[profile](prisma, options)
    }

    console.log(`Seed completed. Profiles: ${profiles.join(', ')}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exitCode = 1
})
