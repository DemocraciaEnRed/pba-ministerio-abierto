export default defineEventHandler(async (event) => {
  let ctx

  try {
    ctx = await getAuthContext(event)
  } catch (error) {
    console.error('No se pudo resolver la sesión autenticada.', error)

    return { authenticated: false, user: null }
  }

  if (!ctx.user) {
    return { authenticated: false, user: null }
  }

  const avatarUrl = await resolveUserAvatarUrl(ctx.user)

  return {
    authenticated: true,
    user: serializeUser(ctx.user, 'self', avatarUrl)
  }
})
