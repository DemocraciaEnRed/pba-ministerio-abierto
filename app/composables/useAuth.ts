import type { LoginInput, RegisterInput, ResendVerificationInput, RequestPasswordResetInput, ResetPasswordInput } from '#shared/schemas/auth'
import type { FormLike } from '~/utils/formErrors'

/**
 * Composable de autenticación.
 *
 * Wrappea las mutaciones de auth (login, register, logout, resendVerification,
 * requestPasswordReset, resetPassword) con:
 * - llamada a la API via $fetch
 * - refresco de la sesión local (useUserSession)
 * - toasts de éxito/error y estado de carga compartido
 * - navegación post-acción
 *
 * Para leer el estado de sesión en componentes y páginas,
 * usar directamente `useUserSession()` de nuxt-auth-utils.
 */
export function useAuth() {
  const { fetch: refreshSession } = useUserSession()
  const router = useRouter()
  const toast = useToast()
  const loading = ref(false)

  function notifyError(error: unknown, fallback: string) {
    const e = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: e?.data?.message || e?.message || fallback,
      icon: 'lucide:alert-circle',
      color: 'error'
    })
  }

  async function login(credentials: LoginInput, form?: FormLike | null) {
    loading.value = true
    try {
      await $fetch('/api/auth/login', { method: 'POST', body: credentials })
      await refreshSession()
      toast.add({
        title: 'Inicio de sesión exitoso',
        description: '¡Bienvenido de nuevo!',
        icon: 'lucide:check-circle',
        color: 'success'
      })
      await router.push('/')
    } catch (error) {
      const e = error as { data?: { data?: { code?: string } } }
      if (e?.data?.data?.code === 'email_not_verified') {
        toast.add({
          title: 'Verificá tu correo',
          description: 'Necesitás verificar tu correo antes de iniciar sesión. Te llevamos para reenviar el enlace.',
          icon: 'lucide:mail-warning',
          color: 'warning'
        })
        await router.push(`/auth/resend-verification?email=${encodeURIComponent(credentials.email)}`)
        return
      }
      if (applyServerErrors(form, error)) return
      notifyError(error, 'Credenciales inválidas')
    } finally {
      loading.value = false
    }
  }

  async function register(data: RegisterInput, form?: FormLike | null) {
    loading.value = true
    try {
      await $fetch('/api/auth/register', { method: 'POST', body: data })
      // El registro no inicia sesión: el usuario debe verificar su correo.
      await router.push(`/auth/signup-success?email=${encodeURIComponent(data.email)}`)
    } catch (error) {
      if (applyServerErrors(form, error)) return
      notifyError(error, 'No se pudo completar el registro')
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      await refreshSession()
      await router.push('/')
    } catch (error) {
      notifyError(error, 'No se pudo cerrar la sesión')
    } finally {
      loading.value = false
    }
  }

  async function resendVerification(data: ResendVerificationInput) {
    loading.value = true
    try {
      await $fetch('/api/auth/resend-verification', { method: 'POST', body: data })
      toast.add({
        title: 'Revisá tu correo',
        description: 'Si el correo está pendiente de verificación, te enviamos un nuevo email.',
        icon: 'lucide:mail-check',
        color: 'success'
      })
      await router.push('/auth/login')
    } catch (error) {
      notifyError(error, 'No se pudo reenviar la verificación')
    } finally {
      loading.value = false
    }
  }

  async function requestPasswordReset(data: RequestPasswordResetInput) {
    loading.value = true
    try {
      await $fetch('/api/auth/request-password-reset', { method: 'POST', body: data })
      toast.add({
        title: 'Revisá tu correo',
        description: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.',
        icon: 'lucide:mail-check',
        color: 'success'
      })
      await router.push('/auth/login')
    } catch (error) {
      notifyError(error, 'No se pudo solicitar el restablecimiento')
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(data: ResetPasswordInput) {
    loading.value = true
    try {
      await $fetch('/api/auth/reset-password', { method: 'POST', body: data })
      toast.add({
        title: 'Contraseña actualizada',
        description: 'Ya podés iniciar sesión con tu nueva contraseña.',
        icon: 'lucide:check-circle',
        color: 'success'
      })
      await router.push('/auth/login')
    } catch (error) {
      notifyError(error, 'No se pudo restablecer la contraseña')
    } finally {
      loading.value = false
    }
  }

  return { login, register, logout, resendVerification, requestPasswordReset, resetPassword, loading }
}
