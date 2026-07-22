declare module '#auth-utils' {
  interface UserSocialLink {
    platform: string
    handle: string
    url: string
    label: string
    icon: string
  }

  interface User {
    id: number
    email?: string
    emailVerifiedAt?: string | null
    firstName?: string | null
    lastName?: string | null
    displayName?: string | null
    organization?: string | null
    profession?: string | null
    aboutMe?: string | null
    avatarUrl?: string | null
    status?: string
    lastLoginAt?: string | null
    createdAt?: string
    updatedAt?: string
    socialLinks?: UserSocialLink[]
    roles?: {
      isPlatformAdmin: boolean
    }
    capabilities?: {
      canEditDisplayName: boolean
    }
  }
}

export {}
