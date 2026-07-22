import type { ResolvedSocialLink, ResolvedUser } from '../auth/context'
import { canEditDisplayName } from '../auth/profile'
import { buildSocialUrl, getSocialPlatform, type SocialPlatform } from '#shared/social/platforms'

export type UserView = 'public' | 'self' | 'admin'

export interface SocialLinkDTO {
  platform: string
  handle: string
  url: string
  label: string
  icon: string
}

export interface PublicUserDTO {
  id: number
  displayName: string | null
  organization: string | null
  profession: string | null
  aboutMe: string | null
  provincia: string | null
  municipio: string | null
  avatarUrl: string | null
  socialLinks: SocialLinkDTO[]
}

export interface SelfUserDTO {
  id: number
  email: string
  emailVerifiedAt: string | null
  firstName: string | null
  lastName: string | null
  displayName: string | null
  organization: string | null
  profession: string | null
  aboutMe: string | null
  provincia: string | null
  municipio: string | null
  phone: string | null
  avatarUrl: string | null
  status: string
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  socialLinks: SocialLinkDTO[]
  roles: {
    isPlatformAdmin: boolean
    isCollaborator: boolean
  }
  capabilities: {
    canEditDisplayName: boolean
  }
}

/** Arma los DTO de redes sociales descartando handles que ya no validan. */
function serializeSocialLinks(links: ResolvedSocialLink[]): SocialLinkDTO[] {
  return links
    .map((link): SocialLinkDTO | null => {
      const platform = link.platform as SocialPlatform
      const cfg = getSocialPlatform(platform)
      const url = buildSocialUrl(platform, link.handle)
      if (!cfg || !url) return null
      return { platform: link.platform, handle: link.handle, url, label: cfg.label, icon: cfg.icon }
    })
    .filter((dto): dto is SocialLinkDTO => dto !== null)
}

export function serializeUser(user: ResolvedUser, view: 'public', avatarUrl?: string | null): PublicUserDTO
export function serializeUser(user: ResolvedUser, view: 'self' | 'admin', avatarUrl?: string | null): SelfUserDTO
export function serializeUser(user: ResolvedUser, view: UserView, avatarUrl: string | null = null): PublicUserDTO | SelfUserDTO {
  if (view === 'public') {
    return {
      id: user.id,
      displayName: user.displayName,
      organization: user.organization,
      profession: user.profession,
      aboutMe: user.aboutMe,
      provincia: user.provincia,
      municipio: user.municipio,
      avatarUrl,
      socialLinks: serializeSocialLinks(user.socialLinks)
    }
  }

  return {
    id: user.id,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    organization: user.organization,
    profession: user.profession,
    aboutMe: user.aboutMe,
    provincia: user.provincia,
    municipio: user.municipio,
    phone: user.phone,
    avatarUrl,
    status: user.status,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    socialLinks: serializeSocialLinks(user.socialLinks),
    roles: {
      isPlatformAdmin: user.platformRoles.includes('platform_admin'),
      // platform_admin implica elegibilidad de colaborador.
      isCollaborator: user.platformRoles.includes('platform_admin')
        || user.platformRoles.includes('collaborator')
    },
    capabilities: {
      canEditDisplayName: canEditDisplayName(user)
    }
  }
}
