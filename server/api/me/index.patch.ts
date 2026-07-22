import { UpdateProfileSchema } from '#shared/schemas/auth'
import { userWithRolesInclude, toResolvedUser } from '~~/server/utils/auth/context'
import { canEditDisplayName } from '~~/server/utils/auth/profile'

export default defineEventHandler(async (event) => {
  const ctx = await getAuthContext(event)
  await assertCan(ctx, 'update', { type: 'self' })

  const body = await parseBody(event, UpdateProfileSchema)
  const userId = ctx.user!.id

  const data: {
    firstName?: string
    lastName?: string
    displayName?: string | null
    organization?: string | null
    profession?: string | null
    aboutMe?: string | null
  } = {}

  if (body.firstName !== undefined) data.firstName = body.firstName
  if (body.lastName !== undefined) data.lastName = body.lastName
  if (body.organization !== undefined) data.organization = body.organization
  if (body.profession !== undefined) data.profession = body.profession
  if (body.aboutMe !== undefined) data.aboutMe = body.aboutMe

  // El "nombre para mostrar" solo lo editan roles habilitados; para el resto se
  // deriva de nombre + apellido (tomando los valores nuevos o los ya guardados).
  if (canEditDisplayName(ctx.user!)) {
    if (body.displayName !== undefined) data.displayName = body.displayName
  } else {
    const firstName = body.firstName ?? ctx.user!.firstName ?? ''
    const lastName = body.lastName ?? ctx.user!.lastName ?? ''
    const derived = `${firstName} ${lastName}`.trim()
    data.displayName = derived.length ? derived : null
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (body.socialLinks !== undefined) {
      await tx.userSocialLink.deleteMany({ where: { userId } })
      if (body.socialLinks.length) {
        await tx.userSocialLink.createMany({
          data: body.socialLinks.map(link => ({
            userId,
            platform: link.platform,
            handle: link.handle
          }))
        })
      }
    }

    return tx.user.update({
      where: { id: userId },
      data,
      include: userWithRolesInclude
    })
  })

  const resolved = toResolvedUser(updated)
  const avatarUrl = await resolveUserAvatarUrl(resolved)
  return serializeUser(resolved, 'self', avatarUrl)
})
