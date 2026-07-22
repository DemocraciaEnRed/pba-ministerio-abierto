<script setup lang="ts">
import type { ThemeUI } from '@nuxt/ui'
import type { PublicUserDTO } from '~~/server/utils/serializers/user'

definePageMeta({
  layout: 'default'
})

const route = useRoute()

const { data: user, error } = await useFetch<PublicUserDTO>(`/api/users/${route.params.id}`)

const displayName = computed(() => user.value?.displayName || 'Perfil sin nombre')

usePageSeo(() => ({
  title: displayName.value,
  description: toPlainText(
    user.value?.aboutMe
    || [user.value?.profession, user.value?.organization].filter(Boolean).join(' · ')
    || `Perfil de ${displayName.value} en ${SITE_NAME}.`
  ),
  image: user.value?.avatarUrl,
  imageAlt: displayName.value,
  url: `/u/${route.params.id}`,
  type: 'profile'
}))
const initials = computed(() => {
  const name = user.value?.displayName?.trim()
  if (!name) return '?'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('')
})

const uiTheme: ThemeUI = {
  avatar: {
    root: 'w-28 h-28 text-3xl'
  }
}

const location = computed(() => {
  const parts = [user.value?.municipio, user.value?.provincia].filter(Boolean)
  return parts.join(', ')
})

const hasNoAboutData = computed(() => (!user.value?.profession && !user.value?.organization && !location.value && !user.value?.aboutMe && !user.value?.socialLinks.length) || error.value)
</script>

<template>
  <UTheme :ui="uiTheme">
    <UContainer>
      <UPage>
        <UPageBody>
          <UEmpty
            v-if="error || !user"
            icon="lucide:user-x"
            title="Perfil no disponible"
            description="No encontramos este perfil o ya no está disponible."
            class="py-16"
          >
            <template #actions>
              <UButton
                to="/consultas"
                label="Ir a consultas"
                icon="lucide:list"
                color="neutral"
                variant="subtle"
              />
            </template>
          </UEmpty>

          <div v-else>
            <div class="flex flex-col items-center gap-4">
              <UAvatar
                :src="user.avatarUrl || undefined"
                :text="initials"
              />
              <div>
                <h1 class="text-xl font-semibold">
                  {{ displayName }}
                </h1>
              </div>
            </div>
            <UPageCard
              class="w-full max-w-2xl mx-auto mt-10"
              variant="subtle"
            >
              <div
                v-if="!hasNoAboutData"
                class="space-y-6"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div v-if="user.profession">
                    <p class="text-lg font-bold border-b border-default pb-1">
                      Profesión
                    </p>
                    <p
                      class="mt-2"
                    >
                      {{ user.profession }}
                    </p>
                  </div>
                  <div v-if="user.organization">
                    <p class="text-lg font-bold border-b border-default pb-1">
                      Organización
                    </p>
                    <p
                      class="mt-2"
                    >
                      {{ user.organization }}
                    </p>
                  </div>
                  <div v-if="location">
                    <p class="text-lg font-bold border-b border-default pb-1">
                      Ubicación
                    </p>
                    <p
                      class="mt-2"
                    >
                      {{ location }}
                    </p>
                  </div>
                </div>
                <div v-if="user.aboutMe">
                  <p class="text-lg font-bold border-b border-default pb-1">
                    Acerca de
                  </p>
                  <p class="mt-2 whitespace-pre-line text-toned">
                    {{ user.aboutMe }}
                  </p>
                </div>
                <div v-if="user.socialLinks.length">
                  <p class="text-lg font-bold border-b border-default pb-1">
                    Redes
                  </p>
                  <UserSocialLinks
                    class="mt-2"
                    :links="user.socialLinks"
                  />
                </div>
              </div>
              <div v-else>
                <p class="text-sm text-muted text-center">
                  Este usuario no ha completado su perfil.
                </p>
              </div>
            </UPageCard>
          </div>
        </UPageBody>
      </UPage>
    </UContainer>
  </UTheme>
</template>
