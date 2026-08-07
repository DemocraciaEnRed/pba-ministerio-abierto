<script setup lang="ts">
import type { PublicConsultationRegistrationFormDTO } from '~~/server/utils/serializers/consultationRegistrationForm'
import { registrationEventNoun } from '#shared/data/consultation-registrations'

defineOptions({ name: 'ConsultasInscripcionCta' })

const props = defineProps<{
  form: PublicConsultationRegistrationFormDTO
  consultationSlug: string
}>()

const eventNoun = computed(() => registrationEventNoun(props.form.kind))

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <UButton
      v-if="form.registrationState === 'open'"
      label="Inscribite ahora"
      icon="i-lucide-clipboard-check"
      size="xl"
      class="custom-animation-pulse"
      :to="`/consultas/${consultationSlug}/inscripcion`"
    />

    <template v-else-if="form.registrationState === 'scheduled'">
      <p class="text-sm">
        Las inscripciones a esta {{ eventNoun }} abren en
      </p>
      <CountdownToDate :target-date="form.opensAt">
        <template #default="{ remaining }">
          <p
            v-if="remaining"
            class="font-semibold text-lg tabular-nums"
          >
            {{ remaining.days }}d {{ pad(remaining.hours) }}h {{ pad(remaining.minutes) }}m {{ pad(remaining.seconds) }}s
          </p>
        </template>
      </CountdownToDate>
    </template>

    <UBadge
      v-else
      label="Inscripciones cerradas"
      color="neutral"
      variant="subtle"
      size="lg"
    />
  </div>
</template>

<style lang="css" scoped>
/* 1. Define the custom pulse animation */
@keyframes custom-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1); /* Grows to 110% size */
  }
  100% {
    transform: scale(1);
  }
}

/* 2. Apply it to your element */
.custom-animation-pulse {
  /* Trigger the infinite animation loop */
  animation: custom-pulse 2s ease-in-out infinite;

  /* Performance optimization for smooth rendering */
  will-change: transform;
}
</style>
