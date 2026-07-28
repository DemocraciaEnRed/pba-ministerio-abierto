<script setup lang="ts">
interface Testimonio {
  user: {
    name: string
    description: string
  }
  quote: string
}

interface Encuentro {
  // El encuentro es opcional: puede haber testimonios sin encuentro asociado.
  region?: string
  slugRegion?: string
  lugar?: string
  fecha?: string
  testimonios: Testimonio[]
}

const encuentros: Encuentro[] = [
  {
    region: 'Región Centro Sur',
    slugRegion: 'centro-sur',
    lugar: 'Tandil',
    fecha: '19 de marzo 2026',
    testimonios: [
      {
        user: {
          name: 'Carolina',
          description: 'Tandil'
        },
        quote: 'Valoramos la oportunidad de ser parte del diseño de las políticas públicas, gracias por generar estos espacios.'
      },
      {
        user: {
          name: 'María',
          description: 'Rauch'
        },
        quote: 'Fue muy buena la propuesta de hacer una convocatoria abierta donde se pudiera escuchar la diversidad de voces para construir acuerdos.'
      },
      {
        user: {
          name: 'Diego',
          description: 'Ayacucho'
        },
        quote: 'Destaco la participación de gente de distintos sectores y la posibilidad de conocer de primera mano las propuestas que tiene la Provincia para desarrollar la región.'
      }
    ]
  },
  {
    region: 'Región Fluvial',
    slugRegion: 'fluvial',
    lugar: 'San Pedro',
    fecha: '14 de mayo 2026',
    testimonios: [
      {
        user: {
          name: 'Federico',
          description: 'San Nicolás'
        },
        quote: 'La dinámica fue muy buena, se notó compromiso, cercanía a la gente y gran poder de escucha. Todas cosas que la Provincia necesita.'
      },
      {
        user: {
          name: 'Renata',
          description: 'Zárate'
        },
        quote: 'Estuvimos participando de la mesa de Juventudes. En comunidad logramos construir espacios que nos incluyen a todos, ser escuchados y valorados.'
      },
      {
        user: {
          name: 'Silvia',
          description: 'Zárate'
        },
        quote: 'Sigan generando estos encuentros que son muy necesarios.'
      }
    ]
  },
  {
    // Sin encuentro asociado.
    testimonios: [
      {
        user: {
          name: 'Pamela',
          description: 'Maipú'
        },
        quote: 'La coordinación de las mesas fue muy interesante, gracias por la gestión del uso del tiempo para que cada participante pueda expresarse y hacer aportes.'
      },
      {
        user: {
          name: 'Ángela',
          description: 'Chascomús'
        },
        quote: 'La apertura a la escucha y la posibilidad de intercambiar miradas con otras personas de distintos sectores fueron muy fructíferas.'
      },
      {
        user: {
          name: 'Raúl',
          description: 'Punta Indio'
        },
        quote: 'Fue una buena experiencia, los temas abordados son importantes para pensar en el desarrollo de la Provincia. Ojalá esto se replique en mesas locales.'
      }
    ]
  }
]

const getBodyBackgroundColor = (encuentro: Encuentro) => {
  if (encuentro.slugRegion) {
    return `bg-region-${encuentro.slugRegion}`
  }
  return 'bg-accented'
}

const encuentrosWithBackgroundColor = computed(() =>
  encuentros.map(encuentro => ({
    ...encuentro,
    bodyBackgroundColor: getBodyBackgroundColor(encuentro),
    testimoniosBackgroundColor: `${getBodyBackgroundColor(encuentro)}/30`
  }))
)
</script>

<template>
  <div class="space-y-12">
    <section
      v-for="(encuentro, encuentroIndex) in encuentrosWithBackgroundColor"
      :key="`encuentro-${encuentroIndex}`"
      class="space-y-4"
    >
      <div
        v-if="encuentro.region"
        class="text-center"
        :class="['rounded-lg p-4', `${encuentro.bodyBackgroundColor}`]"
      >
        <p class="font-semibold">
          Participantes del Encuentro {{ encuentro.region }}
        </p>
        <p
          v-if="encuentro.lugar || encuentro.fecha"
          class="text-sm text-muted"
        >
          {{ [encuentro.lugar, encuentro.fecha].filter(Boolean).join(' | ') }}
        </p>
      </div>

      <UPageColumns>
        <UPageCard
          v-for="(testimonio, index) in encuentro.testimonios"
          :key="`testimonio-${encuentroIndex}-${index}`"
          variant="subtle"
          :description="testimonio.quote"
          :ui="{ description: 'before:content-[open-quote] after:content-[close-quote]', root: encuentro.testimoniosBackgroundColor }"
        >
          <template #footer>
            <UUser
              v-bind="testimonio.user"
              :avatar="{ src: undefined, alt: testimonio.user.name }"
              size="xl"
            />
          </template>
        </UPageCard>
      </UPageColumns>
    </section>
  </div>

  <!-- Versión anterior: todas las tarjetas en una sola grilla, sin agrupar por encuentro.
       Descomentar este bloque (y comentar el de arriba) para volver.
  <UPageColumns>
    <UPageCard
      v-for="(testimonio, index) in encuentros.flatMap((e) => e.testimonios)"
      :key="index"
      variant="subtle"
      :description="testimonio.quote"
      :ui="{ description: 'before:content-[open-quote] after:content-[close-quote]' }"
    >
      <template #footer>
        <UUser
          v-bind="testimonio.user"
          :avatar="{ src: undefined, alt: testimonio.user.name }"
          size="xl"
        />
      </template>
    </UPageCard>
  </UPageColumns>
  -->
</template>
