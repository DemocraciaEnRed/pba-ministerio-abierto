import type { PrismaClient } from '../generated/client'
import { PlatformRole, UserStatus } from '../generated/client'
import { hashSeedPassword } from './password'

// Contraseña común para los usuarios de desarrollo. NO usar en producción.
const DEV_PASSWORD = 'Cambiar1234'

export async function seedBaseUsers(prisma: PrismaClient) {
  const now = new Date()
  const passwordHash = await hashSeedPassword(DEV_PASSWORD)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@consultas.local' },
    update: {
      firstName: 'Admin',
      lastName: 'Plataforma',
      displayName: 'Admin Plataforma',
      status: UserStatus.active,
      emailVerifiedAt: now,
      passwordHash
    },
    create: {
      email: 'admin@consultas.local',
      firstName: 'Admin',
      lastName: 'Plataforma',
      displayName: 'Admin Plataforma',
      status: UserStatus.active,
      emailVerifiedAt: now,
      passwordHash
    }
  })

  await prisma.platformRoleAssignment.upsert({
    where: {
      userId_role: {
        userId: admin.id,
        role: PlatformRole.platform_admin
      }
    },
    update: {},
    create: {
      userId: admin.id,
      role: PlatformRole.platform_admin
    }
  })

  // Colaboradores: el equipo institucional y dos personas colaboradoras
  // dedicadas. Todas reciben el rol de plataforma "collaborator" para poder
  // gestionar consultas (las membresías por consulta las asigna el perfil demo).
  const collaborators = [
    {
      email: 'equipo@consultas.local',
      firstName: 'Equipo',
      lastName: 'Institucional',
      displayName: 'Equipo Institucional'
    },
    {
      email: 'colaborador1@consultas.local',
      firstName: 'Camila',
      lastName: 'Rodríguez',
      displayName: 'Camila Rodríguez'
    },
    {
      email: 'colaborador2@consultas.local',
      firstName: 'Martín',
      lastName: 'Gómez',
      displayName: 'Martín Gómez'
    }
  ]

  for (const collaborator of collaborators) {
    const user = await prisma.user.upsert({
      where: { email: collaborator.email },
      update: {
        firstName: collaborator.firstName,
        lastName: collaborator.lastName,
        displayName: collaborator.displayName,
        status: UserStatus.active,
        emailVerifiedAt: now,
        passwordHash
      },
      create: {
        email: collaborator.email,
        firstName: collaborator.firstName,
        lastName: collaborator.lastName,
        displayName: collaborator.displayName,
        status: UserStatus.active,
        emailVerifiedAt: now,
        passwordHash
      }
    })

    await prisma.platformRoleAssignment.upsert({
      where: {
        userId_role: {
          userId: user.id,
          role: PlatformRole.collaborator
        }
      },
      update: { assignedByUserId: admin.id },
      create: {
        userId: user.id,
        role: PlatformRole.collaborator,
        assignedByUserId: admin.id
      }
    })
  }

  await prisma.user.upsert({
    where: { email: 'ciudadania@consultas.local' },
    update: {
      firstName: 'Usuario',
      lastName: 'Ciudadano',
      displayName: 'Usuario Ciudadano',
      status: UserStatus.active,
      emailVerifiedAt: now,
      passwordHash
    },
    create: {
      email: 'ciudadania@consultas.local',
      firstName: 'Usuario',
      lastName: 'Ciudadano',
      displayName: 'Usuario Ciudadano',
      status: UserStatus.active,
      emailVerifiedAt: now,
      passwordHash
    }
  })
}
