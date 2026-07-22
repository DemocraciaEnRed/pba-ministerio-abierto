import type { UpdateProfileInput, ChangePasswordInput, RequestEmailChangeInput } from '#shared/schemas/auth'
import type { SelfUserDTO } from '~~/server/utils/serializers/user'

/**
 * Composable de gestión de la cuenta propia ("Mi cuenta").
 *
 * Wrappea las mutaciones sobre el usuario autenticado (actualizar perfil,
 * cambiar contraseña) con llamada a la API vía `$fetch`, refresco de sesión,
 * toasts de éxito/error y estado de carga compartido.
 */
export function useAccount() {
  const { fetch: refreshSession } = useUserSession()
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

  async function updateProfile(payload: UpdateProfileInput): Promise<SelfUserDTO | null> {
    loading.value = true
    try {
      const updated = await $fetch<SelfUserDTO>('/api/me', { method: 'PATCH', body: payload })
      await refreshSession()
      toast.add({
        title: 'Perfil actualizado',
        description: 'Tus cambios se guardaron correctamente.',
        icon: 'lucide:check-circle',
        color: 'success'
      })
      return updated
    } catch (error) {
      notifyError(error, 'No se pudo actualizar el perfil')
      return null
    } finally {
      loading.value = false
    }
  }

  async function changePassword(payload: ChangePasswordInput): Promise<boolean> {
    loading.value = true
    try {
      await $fetch('/api/me/change-password', { method: 'POST', body: payload })
      toast.add({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña se cambió correctamente.',
        icon: 'lucide:check-circle',
        color: 'success'
      })
      return true
    } catch (error) {
      notifyError(error, 'No se pudo cambiar la contraseña')
      return false
    } finally {
      loading.value = false
    }
  }

  async function requestEmailChange(payload: RequestEmailChangeInput): Promise<boolean> {
    loading.value = true
    try {
      await $fetch('/api/me/change-email', { method: 'POST', body: payload })
      toast.add({
        title: 'Revisá tu nuevo correo',
        description: 'Te enviamos un email para confirmar el cambio de dirección.',
        icon: 'lucide:mail-check',
        color: 'success'
      })
      return true
    } catch (error) {
      notifyError(error, 'No se pudo solicitar el cambio de correo')
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateAvatar(file: File): Promise<SelfUserDTO | null> {
    loading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      const updated = await $fetch<SelfUserDTO>('/api/me/avatar', { method: 'POST', body: formData })
      await refreshSession()
      toast.add({
        title: 'Foto actualizada',
        description: 'Tu foto de perfil se actualizó correctamente.',
        icon: 'lucide:check-circle',
        color: 'success'
      })
      return updated
    } catch (error) {
      notifyError(error, 'No se pudo actualizar la foto de perfil')
      return null
    } finally {
      loading.value = false
    }
  }

  async function removeAvatar(): Promise<boolean> {
    loading.value = true
    try {
      await $fetch('/api/me/avatar', { method: 'DELETE' })
      await refreshSession()
      toast.add({
        title: 'Foto eliminada',
        description: 'Tu foto de perfil se quitó correctamente.',
        icon: 'lucide:check-circle',
        color: 'success'
      })
      return true
    } catch (error) {
      notifyError(error, 'No se pudo quitar la foto de perfil')
      return false
    } finally {
      loading.value = false
    }
  }

  return { updateProfile, changePassword, requestEmailChange, updateAvatar, removeAvatar, loading }
}
