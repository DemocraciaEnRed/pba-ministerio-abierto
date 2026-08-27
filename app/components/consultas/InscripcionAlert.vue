<script setup lang="ts">
import type { PublicConsultationRegistrationFormDTO } from '~~/server/utils/serializers/consultationRegistrationForm'
import { registrationEventNoun } from '#shared/data/consultation-registrations'

defineOptions({ name: 'ConsultasInscripcionAlert' })

const props = defineProps<{
  form: PublicConsultationRegistrationFormDTO
  consultationSlug: string
  participationState: string
}>()

const eventNoun = computed(() => registrationEventNoun(props.form.kind))

const title = computed(() => {
  switch (props.form.registrationState) {
    case 'open':
      return `Inscribite ahora para participar de esta ${eventNoun.value}`
    case 'scheduled':
      return `Las inscripciones a esta ${eventNoun.value} abren el ${formatDate(props.form.opensAt)}`
    case 'closed':
      return `Las inscripciones a esta ${eventNoun.value} están cerradas`
    default:
      return ''
  }
})

const description = computed(() => {
  switch (props.form.registrationState) {
    case 'open':
      return `Completá el formulario de inscripción para que participes de forma presencial en esta ${eventNoun.value}.`
    case 'scheduled':
      return 'Podrás inscribirte a partir de la fecha indicada. Te enviaremos un correo electrónico con instrucciones para participar.'
    case 'closed':
      return 'Ya no es posible inscribirse a esta consulta.'
    default:
      return ''
  }
})

const color = computed(() => {
  switch (props.form.registrationState) {
    case 'open':
      return 'primary'
    case 'scheduled':
      return 'info'
    default:
      return 'neutral'
  }
})

const actions = computed(() => props.form.registrationState === 'open'
  ? [{
      label: 'Inscribirme',
      to: `/consultas/${props.consultationSlug}/inscripcion`,
      variant: 'solid' as const,
      color: 'primary' as const,
      size: undefined,
      icon: 'lucide:clipboard-check'
    }]
  : [])
</script>

<template>
  <UAlert
    id="formulario-registro-cta"
    variant="subtle"
    :color="color"
    :highlight="true"
    :spotlight="true"
    :title="title"
    icon="lucide:clipboard-check"
    :description="description"
    orientation="horizontal"
    :actions="actions"
    :ui="{
      title: 'text-lg md:text-xl font-semibold'
    }"
  />
</template>
