import type { UserStatus, PlatformRole, UserSocialPlatform, AssetType } from '../../../prisma/generated/enums'
import type { H3Event } from 'h3'

export interface ResolvedSocialLink {
  platform: UserSocialPlatform
  handle: string
}

/** Datos mínimos del asset de avatar necesarios para resolver su URL y borrarlo. */
export interface ResolvedAvatarAsset {
  id: number
  assetType: AssetType
  storagePath: string | null
  externalUrl: string | null
}

export interface ResolvedUser {
  id: number
  email: string
  emailVerifiedAt: Date | null
  firstName: string | null
  lastName: string | null
  displayName: string | null
  organization: string | null
  profession: string | null
  aboutMe: string | null
  provincia: string | null
  municipio: string | null
  phone: string | null
  status: UserStatus
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  platformRoles: PlatformRole[]
  socialLinks: ResolvedSocialLink[]
  avatarAsset: ResolvedAvatarAsset | null
}

/** Include de Prisma para traer un usuario con sus roles, redes y avatar. */
export const userWithRolesInclude = {
  platformRoleAssignments: true,
  socialLinks: { select: { platform: true, handle: true } },
  avatarAsset: { select: { id: true, assetType: true, storagePath: true, externalUrl: true } }
} as const

type DbUserWithRoles = {
  id: number
  email: string
  emailVerifiedAt: Date | null
  firstName: string | null
  lastName: string | null
  displayName: string | null
  organization: string | null
  profession: string | null
  aboutMe: string | null
  provincia: string | null
  municipio: string | null
  phone: string | null
  status: UserStatus
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  platformRoleAssignments: { role: PlatformRole }[]
  socialLinks: { platform: UserSocialPlatform, handle: string }[]
  avatarAsset: { id: number, assetType: AssetType, storagePath: string | null, externalUrl: string | null } | null
}

/** Mapea un usuario crudo de Prisma (con roles incluidos) al modelo de dominio. */
export function toResolvedUser(dbUser: DbUserWithRoles): ResolvedUser {
  return {
    id: dbUser.id,
    email: dbUser.email,
    emailVerifiedAt: dbUser.emailVerifiedAt,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    displayName: dbUser.displayName,
    organization: dbUser.organization,
    profession: dbUser.profession,
    aboutMe: dbUser.aboutMe,
    provincia: dbUser.provincia,
    municipio: dbUser.municipio,
    phone: dbUser.phone,
    status: dbUser.status,
    lastLoginAt: dbUser.lastLoginAt,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
    platformRoles: dbUser.platformRoleAssignments.map(a => a.role),
    socialLinks: dbUser.socialLinks.map(l => ({ platform: l.platform, handle: l.handle })),
    avatarAsset: dbUser.avatarAsset
      ? {
          id: dbUser.avatarAsset.id,
          assetType: dbUser.avatarAsset.assetType,
          storagePath: dbUser.avatarAsset.storagePath,
          externalUrl: dbUser.avatarAsset.externalUrl
        }
      : null
  }
}

export interface AuthContext {
  user: ResolvedUser | null
  isPlatformAdmin: boolean
  isConsultationAdmin: (consultationId: number) => Promise<boolean>
}

const anonymousContext: AuthContext = {
  user: null,
  isPlatformAdmin: false,
  isConsultationAdmin: async () => false
}

export async function getAuthContext(event: H3Event): Promise<AuthContext> {
  const session = await getUserSession(event)

  if (!session.user?.id) {
    return anonymousContext
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: userWithRolesInclude
  })

  if (!dbUser) {
    await clearUserSession(event)
    return anonymousContext
  }

  const user = toResolvedUser(dbUser)
  const isPlatformAdmin = user.platformRoles.includes('platform_admin')

  // Memoiza la resolución de consultation_admin dentro del mismo request.
  const membershipCache = new Map<number, boolean>()

  return {
    user,
    isPlatformAdmin,
    isConsultationAdmin: async (consultationId: number) => {
      const cached = membershipCache.get(consultationId)
      if (cached !== undefined) return cached

      const membership = await prisma.consultationMembership.findFirst({
        where: { consultationId, userId: user.id }
      })
      const result = membership !== null
      membershipCache.set(consultationId, result)
      return result
    }
  }
}
