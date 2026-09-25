<script setup lang="ts">
import type { BadgeProps, UserProps } from '@nuxt/ui'
import { getConsultationType } from '#shared/data/consultation-types'
import type { PublicConsultationListItem } from '~/types/consulta'

const props = withDefaults(
  defineProps<{
    consultation: PublicConsultationListItem
    orientation?: 'vertical' | 'horizontal'
  }>(),
  { orientation: 'vertical' }
)

/** Estado combinado (visibilidad + estado temporal) como badge. */
const badge = computed<BadgeProps>(() => {
  const estado = consultationStateBadge(props.consultation.visibility, props.consultation.participationState)
  return { label: estado.label, color: estado.color, icon: estado.icon, variant: 'subtle' }
})

/** Destino público de la consulta. */
const to = computed(() => `/consultas/${props.consultation.slug}`)

/** Descripción breve con fallback. */
const description = computed(() =>
  props.consultation.summary || props.consultation.body || 'Sin descripción breve.'
)

// /** Etiqueta "N tema(s)"; se omite si no hay conteo o la consulta no tiene temas. */
// const topicsLabel = computed(() => {
//   const count = props.consultation.topicsCount
//   if (!count) return null
//   return `${count} ${count === 1 ? 'tema' : 'temas'}`
// })

const primaryCategory = computed(() =>
  props.consultation.categories.find(category => category.isPrimary) ?? props.consultation.categories[0] ?? null
)

/** La categoría principal ya se muestra junto a la sección; el resto va como badge. */
const otherCategories = computed(() =>
  props.consultation.categories.filter(category => category.id !== primaryCategory.value?.id)
)

/** Sección (tipo de consulta) como "autor" de la card: icono del tipo + categoría principal. */
const sectionAuthor = computed<UserProps | null>(() => {
  const section = props.consultation.section
  if (!section) return null
  return {
    name: section.name,
    description: primaryCategory.value?.name,
    to: `/${section.slug}`,
    avatar: {
      icon: getConsultationType(section.slug)?.icon ?? 'lucide:folder',
      // El root del avatar tiene tamaño fijo (size-8 en md): se libera para que crezca con el icono
      ui: { root: 'size-auto rounded-none bg-transparent', icon: 'size-10 text-primary' }
    }
  }
})

const authors = computed(() => (sectionAuthor.value ? [sectionAuthor.value] : undefined))

/** Texto de fechas según el estado de participación. */
const datesLabel = computed(() => {
  const { participationState, startsAt, endsAt } = props.consultation
  if (participationState === 'scheduled' && startsAt) {
    return endsAt
      ? `Participá desde ${formatDateShort(startsAt)} - ${formatDateShort(endsAt)}`
      : `Participá a partir del ${formatDateShort(startsAt)}`
  }
  if (participationState === 'open' && endsAt) {
    return `Participá hasta el ${formatDateShort(endsAt)}`
  }
  return endsAt
    ? `${formatDateShort(startsAt)} – ${formatDateShort(endsAt)}`
    : formatDateShort(startsAt)
})

// En horizontal el pie va en el slot `authors` (queda a la derecha, junto al
// contenido); en vertical va en `footer` (debajo). Slot dinámico para no
// duplicar el markup.
const footerSlot = computed(() => (props.orientation === 'horizontal' ? 'authors' : 'footer'))
</script>

<template>
  <UBlogPost
    :authors="authors"
    :title="consultation.title"
    :description="description"
    :badge="badge"
    :to="to"
    :orientation="orientation"
    variant="subtle"
    class="group h-full"
  >
    <template #header>
      <div
        class="relative aspect-video overflow-hidden"
        :class="orientation === 'horizontal' ? 'sm:rounded-l-lg' : 'rounded-t-lg'"
      >
        <img
          v-if="consultation.coverUrl"
          :src="consultation.coverUrl"
          :alt="consultation.coverAltText ?? consultation.title"
          class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        >
        <div
          v-else
          class="flex size-full items-center justify-center bg-linear-to-br from-primary-400/40 to-primary-600/20 dark:from-primary-400/15 dark:to-primary-700/10"
        >
          <UIcon
            name="lucide:megaphone"
            class="size-10 text-primary-500/60"
          />
        </div>

        <!-- El header de UBlogPost es pointer-events-none: se reactiva para que funcione el tooltip -->
        <div
          v-if="consultation.observatoryWorkGroups.length"
          class="pointer-events-auto absolute top-2 right-2 z-10 flex flex-wrap justify-end gap-1"
        >
          <UTooltip
            v-for="group in consultation.observatoryWorkGroups"
            :key="`work-group-${group.id}`"
            :text="group.name"
          >
            <div
              class="flex size-9 items-center justify-center rounded-lg"
              :style="{ backgroundColor: group.color }"
            >
              <UIcon
                :name="group.icon"
                class="size-7"
                :style="{ color: group.iconColor }"
              />
            </div>
          </UTooltip>
        </div>
      </div>
    </template>

    <template #[footerSlot]>
      <!-- En horizontal este slot reemplaza el render por defecto de `authors` -->
      <UUser
        v-if="orientation === 'horizontal' && sectionAuthor"
        v-bind="sectionAuthor"
        class="w-full"
      />
      <USeparator class="mb-1" />
      <div
        class="flex flex-col gap-2"
        :class="orientation === 'horizontal' ? '' : 'px-6 py-2'"
      >
        <div
          v-if="otherCategories.length > 0 || consultation.tags.length > 0"
          class="flex flex-wrap gap-1.5"
        >
          <UBadge
            v-for="category in otherCategories"
            :key="`category-${category.id}`"
            :label="category.name"
            color="primary"
            variant="soft"
            size="sm"
          />
          <UBadge
            v-for="tag in consultation.tags"
            :key="`tag-${tag.id}`"
            :label="tag.name"
            color="neutral"
            variant="soft"
            size="sm"
          />
        </div>

        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span
            v-if="consultation.region"
            class="inline-flex items-center gap-1"
          >
            <UIcon
              name="lucide:map-pin"
              class="size-3.5"
            />
            {{ consultation.region.name }}
          </span>
          <!-- <span
            v-if="topicsLabel"
            class="inline-flex items-center gap-1"
          >
            <UIcon
              name="lucide:list"
              class="size-3.5"
            />
            {{ topicsLabel }}
          </span> -->
          <span class="inline-flex items-center gap-1">
            <UIcon
              name="lucide:calendar"
              class="size-3.5"
            />
            {{ datesLabel }}
          </span>
        </div>
      </div>
    </template>
  </UBlogPost>
</template>
