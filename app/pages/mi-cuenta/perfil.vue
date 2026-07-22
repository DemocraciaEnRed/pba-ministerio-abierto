<script setup lang="ts">
import { UpdateProfileSchema } from '#shared/schemas/auth'
import {
  SOCIAL_PLATFORMS,
  isValidSocialHandle,
  normalizeSocialHandle,
  type SocialPlatform
} from '#shared/social/platforms'
import type { SelfUserDTO } from '~~/server/utils/serializers/user'

definePageMeta({
  layout: 'mi-cuenta-control-panel',
  middleware: 'auth'
})

usePrivatePageSeo('Editar perfil')

const { updateProfile, loading } = useAccount()

const { data: profile } = await useFetch<SelfUserDTO>('/api/me')

const state = reactive({
  firstName: '',
  lastName: '',
  displayName: '',
  organization: '',
  profession: '',
  aboutMe: ''
})

const socialHandles = reactive<Record<SocialPlatform, string>>(
  Object.fromEntries(SOCIAL_PLATFORMS.map(p => [p.key, ''])) as Record<SocialPlatform, string>
)

const errors = reactive<Record<string, string | undefined>>({})
const socialErrors = reactive<Partial<Record<SocialPlatform, string>>>({})

function syncFromProfile(data: SelfUserDTO | null | undefined) {
  state.firstName = data?.firstName ?? ''
  state.lastName = data?.lastName ?? ''
  state.displayName = data?.displayName ?? ''
  state.organization = data?.organization ?? ''
  state.profession = data?.profession ?? ''
  state.aboutMe = data?.aboutMe ?? ''

  for (const platform of SOCIAL_PLATFORMS) {
    socialHandles[platform.key] = ''
  }
  for (const link of data?.socialLinks ?? []) {
    socialHandles[link.platform as SocialPlatform] = link.handle
  }
}

syncFromProfile(profile.value)

const canEditDisplayName = computed(() => profile.value?.capabilities?.canEditDisplayName ?? false)
const isCollaborator = computed(() => profile.value?.roles?.isCollaborator ?? false)
const derivedDisplayName = computed(() => `${state.firstName} ${state.lastName}`.trim())
const publicProfilePath = computed(() => (profile.value ? `/u/${profile.value.id}` : '/'))

function clearErrors() {
  for (const key of Object.keys(errors)) errors[key] = undefined
  for (const platform of SOCIAL_PLATFORMS) socialErrors[platform.key] = undefined
}

function collectSocialLinks(): { links: { platform: SocialPlatform, handle: string }[], valid: boolean } {
  const links: { platform: SocialPlatform, handle: string }[] = []
  let valid = true

  for (const platform of SOCIAL_PLATFORMS) {
    const raw = (socialHandles[platform.key] ?? '').trim()
    if (!raw) continue

    const handle = normalizeSocialHandle(raw)
    if (!isValidSocialHandle(platform.key, handle)) {
      socialErrors[platform.key] = 'El usuario no es válido para esta red'
      valid = false
      continue
    }
    links.push({ platform: platform.key, handle })
  }

  return { links, valid }
}

async function onSubmit() {
  clearErrors()

  const { links, valid: socialValid } = collectSocialLinks()

  const payload: Record<string, unknown> = {
    firstName: state.firstName.trim() || undefined,
    lastName: state.lastName.trim() || undefined,
    organization: state.organization.trim() || null,
    profession: state.profession.trim() || null,
    aboutMe: state.aboutMe.trim() || null,
    socialLinks: links
  }

  if (canEditDisplayName.value) {
    payload.displayName = state.displayName.trim() || undefined
  }

  const result = UpdateProfileSchema.safeParse(payload)

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && field !== 'socialLinks' && !errors[field]) {
        errors[field] = issue.message
      }
    }
    return
  }

  if (!socialValid) return

  const updated = await updateProfile(result.data)
  if (updated) {
    profile.value = updated
    syncFromProfile(updated)
  }
}
</script>

<template>
  <UPageBody>
    <UPageHeader
      title="Perfil"
      description="Gestioná la información pública de tu cuenta."
    >
      <template #links>
        <UBadge
          v-if="isCollaborator"
          color="info"
          variant="subtle"
          icon="lucide:badge-check"
          label="Colaborador/a"
        />
        <UButton
          :to="publicProfilePath"
          color="neutral"
          variant="subtle"
          icon="lucide:external-link"
          label="Ver perfil público"
        />
      </template>
    </UPageHeader>

    <UAlert
      color="warning"
      variant="subtle"
      icon="lucide:eye"
      title="Esta información es pública"
      description="Los datos de tu perfil pueden ser vistos por cualquier persona usuaria de la plataforma. El uso indebido puede constituir una violación de los términos y condiciones."
    />

    <form
      class="space-y-8"
      @submit.prevent="onSubmit"
    >
      <div class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Nombre"
            name="firstName"
            :error="errors.firstName"
          >
            <UInput
              v-model="state.firstName"
              placeholder="Tu nombre"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Apellido"
            name="lastName"
            :error="errors.lastName"
          >
            <UInput
              v-model="state.lastName"
              placeholder="Tu apellido"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          v-if="canEditDisplayName"
          label="Nombre para mostrar"
          name="displayName"
          description="Se muestra en lugar de tu nombre y apellido."
          :error="errors.displayName"
        >
          <UInput
            v-model="state.displayName"
            placeholder="Nombre visible"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-else
          label="Nombre para mostrar"
          description="Se genera automáticamente a partir de tu nombre y apellido."
        >
          <UInput
            :model-value="derivedDisplayName || '—'"
            disabled
            class="w-full"
          />
        </UFormField>
      </div>

      <USeparator />

      <div class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Organización"
            name="organization"
            :error="errors.organization"
          >
            <UInput
              v-model="state.organization"
              placeholder="Dónde trabajás o militás"
              :maxlength="120"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Profesión"
            name="profession"
            :error="errors.profession"
          >
            <UInput
              v-model="state.profession"
              placeholder="A qué te dedicás"
              :maxlength="120"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField
          label="Acerca de mí"
          name="aboutMe"
          description="Contá quién sos: un resumen de tu experiencia, portfolio o intereses."
          :error="errors.aboutMe"
        >
          <template #hint>
            <span class="text-xs text-muted">{{ state.aboutMe.length }}/2000</span>
          </template>
          <UTextarea
            v-model="state.aboutMe"
            :rows="6"
            :maxlength="2000"
            autoresize
            placeholder="Escribí una breve presentación…"
            class="w-full"
          />
        </UFormField>
      </div>

      <USeparator />

      <div class="space-y-4">
        <div>
          <p class="text-sm font-medium">
            Redes sociales
          </p>
          <p class="text-sm text-muted">
            Ingresá solo tu usuario en cada red. El enlace se arma automáticamente.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            v-for="platform in SOCIAL_PLATFORMS"
            :key="platform.key"
            :label="platform.label"
            :error="socialErrors[platform.key]"
          >
            <UInput
              v-model="socialHandles[platform.key]"
              :placeholder="platform.placeholder"
              :icon="platform.icon"
              autocapitalize="none"
              autocomplete="off"
              spellcheck="false"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>

      <UButton
        type="submit"
        label="Guardar cambios"
        icon="lucide:save"
        :loading="loading"
      />
    </form>
  </UPageBody>
</template>
