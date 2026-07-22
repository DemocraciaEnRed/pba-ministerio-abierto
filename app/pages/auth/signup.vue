<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { RegisterSchema, type RegisterInput } from '#shared/schemas/auth'
import {
  BUENOS_AIRES,
  PROVINCES,
  BUENOS_AIRES_MUNICIPALITIES,
  type Province,
  type BuenosAiresMunicipality
} from '#shared/data/argentina'

const { register, loading } = useAuth()

definePageMeta({
  layout: 'default',
  middleware: 'guest'
})

usePrivatePageSeo('Crear cuenta')

type Schema = RegisterInput

const state = reactive<{
  email?: string
  password?: string
  firstName?: string
  lastName?: string
  provincia: Province
  municipio?: BuenosAiresMunicipality
  phone?: string
  representsInstitution: boolean
  organization?: string
}>({
  email: undefined,
  password: undefined,
  firstName: undefined,
  lastName: undefined,
  provincia: BUENOS_AIRES,
  municipio: undefined,
  phone: undefined,
  representsInstitution: false,
  organization: undefined
})

const provinceOptions = [...PROVINCES]
const municipalityOptions = [...BUENOS_AIRES_MUNICIPALITIES]

const isBuenosAires = computed(() => state.provincia === BUENOS_AIRES)

// Al cambiar de provincia limpiamos el municipio: solo aplica a Buenos Aires.
watch(
  () => state.provincia,
  () => {
    if (!isBuenosAires.value) state.municipio = undefined
  }
)

const institutionOptions = [
  { label: 'Sí', value: true },
  { label: 'No', value: false }
]

const handleRegister = (event: FormSubmitEvent<Schema>) => register(event.data)
</script>

<template>
  <UContainer>
    <UPage>
      <UPageCard
        class="w-full max-w-md mx-auto mt-20"
        variant="subtle"
      >
        <UForm
          :schema="RegisterSchema"
          :state="state"
          class="space-y-4"
          @submit="handleRegister"
        >
          <p class="text-xl font-semibold">
            Crear cuenta
          </p>
          <p class="text-sm text-toned">
            Completá tus datos para registrarte.
          </p>

          <div class="grid grid-cols-2 gap-3">
            <UFormField
              label="Nombre"
              name="firstName"
              required
            >
              <UInput
                v-model="state.firstName"
                placeholder="Nombre"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Apellido"
              name="lastName"
              required
            >
              <UInput
                v-model="state.lastName"
                placeholder="Apellido"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField
            label="Provincia"
            name="provincia"
            required
          >
            <USelectMenu
              v-model="state.provincia"
              :items="provinceOptions"
              placeholder="Elegí tu provincia"
              class="w-full"
            />
          </UFormField>

          <UFormField
            v-if="isBuenosAires"
            label="Municipio"
            name="municipio"
            required
          >
            <USelectMenu
              v-model="state.municipio"
              :items="municipalityOptions"
              placeholder="Elegí tu municipio"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Número de teléfono"
            name="phone"
            hint="Código de área y número, sin el 0 ni el 15"
            required
          >
            <UFieldGroup class="w-full">
              <UBadge
                color="neutral"
                variant="subtle"
                label="+54"
                class="rounded-r-none"
              />
              <UInput
                v-model="state.phone"
                type="tel"
                inputmode="tel"
                placeholder="11 12345678"
                class="w-full"
              />
            </UFieldGroup>
          </UFormField>

          <UFormField
            label="¿Representás alguna institución u organización?"
            name="representsInstitution"
            required
          >
            <URadioGroup
              v-model="state.representsInstitution"
              :items="institutionOptions"
              orientation="horizontal"
            />
          </UFormField>

          <UFormField
            v-if="state.representsInstitution"
            label="Nombre de la institución u organización"
            name="organization"
            required
          >
            <UInput
              v-model="state.organization"
              placeholder="Nombre de la institución u organización"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Correo electrónico"
            name="email"
            required
          >
            <UInput
              v-model="state.email"
              type="email"
              placeholder="tu@email.com"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Contraseña"
            name="password"
            required
          >
            <UInput
              v-model="state.password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              class="w-full"
            />
          </UFormField>

          <UButton
            type="submit"
            label="Crear cuenta"
            icon="lucide:user-plus"
            :loading="loading"
            block
          />
        </UForm>

        <p class="mt-4 text-center text-sm text-toned">
          ¿Ya tenés cuenta?
          <NuxtLink
            to="/auth/login"
            class="font-medium text-primary hover:underline"
          >
            Iniciá sesión
          </NuxtLink>
        </p>
      </UPageCard>
    </UPage>
  </UContainer>
</template>
