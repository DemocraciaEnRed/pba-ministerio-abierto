<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'
import type { ThemeUI } from '@nuxt/ui/runtime/types/theme.js'

usePageSeo({
  title: 'Consultas públicas',
  description: 'Encuentros participativos del Ministerio de Infraestructura y Servicios Públicos: presentación de obras y proyectos en el territorio y espacios para recibir aportes de la ciudadanía.',
  url: '/consultas-publicas'
})

const faqItems = ref<AccordionItem[]>([
  {
    label: '¿Cómo funcionan?',
    value: 'como-funcionan',
    content:
      'Las consultas públicas integran un proceso participativo amplio vinculado a la evaluación y preparación del proyecto. Comienzan con la publicación de la documentación relevante; continúan con una instancia informativa presencial, virtual o mixta y con un canal para recibir consultas y reclamos; concluyen con la elaboración y publicación de un informe que sistematiza los aportes recibidos, las respuestas brindadas y, cuando corresponda, las modificaciones introducidas al proyecto.'
  },
  {
    label: '¿Qué asuntos pueden tratarse?',
    value: 'que-asuntos-pueden-tratarse',
    content:
      'Pueden tratarse, entre otras cuestiones, el objeto y alcance del proyecto, su localización y cronograma; los impactos ambientales y sociales identificados; las medidas de prevención, mitigación, compensación o gestión previstas; la forma de implementación; los mecanismos de atención de consultas y reclamos; y las observaciones o propuestas de las partes interesadas que resulten pertinentes para mejorar el diseño o la ejecución del proyecto.'
  },
  {
    label: '¿Qué asuntos no pueden tratarse?',
    value: 'que-asuntos-no-pueden-tratarse',
    content:
      'No corresponde tratar cuestiones ajenas al objeto del proyecto sometido a consulta ni divulgar datos personales o sensibles de las personas participantes. En la documentación e informes que se publiquen no se incluyen nombres completos, documentos de identidad, correos electrónicos, teléfonos u otra información personal que permita individualizar a quienes participaron o formularon consultas por canales remotos.'
  },
  {
    label: '¿Cómo participar?',
    value: 'como-participar',
    content:
      'La participación podrá realizarse a través de una o más de las siguientes vías, según lo disponga la convocatoria: asistencia a la instancia informativa presencial, virtual o mixta; envío de consultas, opiniones y observaciones por los canales habilitados; revisión previa de la documentación publicada en el sitio oficial; participación a través de la web de Ministerio Abierto. La convocatoria indicará claramente el lugar, la fecha, la modalidad, los plazos y los canales disponibles para participar.'
  },
  {
    label: '¿Qué ocurre después de la consulta?',
    value: 'que-ocurre-despues-de-la-consulta',
    content:
      'Finalizado el período de consulta, se elaborará un informe que describe el proceso realizado, la convocatoria efectuada, la documentación puesta a disposición, las consultas y observaciones recibidas y las respuestas brindadas. Cuando corresponda por el marco del financiamiento, el informe podrá requerir revisión o conformidad del organismo financiador antes de su publicación. El documento final sobre el proceso de consulta será publicado en este sitio para conocimiento de la ciudadanía.'
  }
])

const openFaq = ref<string[]>([])

const themeUi: ThemeUI = {
  pageHero: {
    root: 'header-background-consultas-publicas bg-primary',
    // Default container: flex flex-col lg:grid py-24 sm:py-32 lg:py-40 gap-16 sm:gap-y-24
    container: 'flex flex-col lg:flex lg:flex-row py-12 sm:py-16 md:py-16 lg:py-16 gap-6 sm:gap-y-6 md:gap-y-6 md:gap-12 justify-center items-center',
    // Default title: 'text-5xl sm:text-7xl text-pretty tracking-tight font-bold text-highlighted',
    title: 'text-white text-shadow-lg text-4xl sm:text-5xl font-extrabold ',
    // Default description: 'text-lg sm:text-xl/8 text-muted',
    description: 'text-white text-shadow-lg',
    wrapper: 'max-w-2xl text-center lg:text-left lg:ml-0 lg:mr-full'
  },
  accordion: {
    label: 'text-2xl font-bold text-primary',
    body: 'leading-7 text-neutral-700 dark:text-neutral-300',
    trigger: 'hover:cursor-pointer'
  }
}
</script>

<template>
  <UTheme :ui="themeUi">
    <UPageHero
      title="Consultas públicas"
      orientation="horizontal"
      reverse
    >
      <!-- <template #description>
        <p class="">
          Espacios participativos para conocer las intervenciones del<br>
          <span class="block font-semibold md:inline">Ministerio de Infraestructura y Servicios Públicos</span>
          en tu región
        </p>
      </template> -->
      <UIcon
        name="pba:audiencias-publicas"
        class="size-40 shrink-0 text-white sm:size-40 md:size-52 lg:size-60"
      />
    </UPageHero>
    <UContainer>
      <UPage>
        <UPageBody>
          <div class="max-w-3xl mx-auto py-12 space-y-6">
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              Una consulta pública es un proceso de diálogo continuo donde se proporciona información relevante sobre un proyecto y se recogen opiniones, preocupaciones y aportes de las partes interesadas, con el objetivo de incidir en su diseño e implementación. No es un requisito formal, sino una herramienta clave para lograr proyectos sostenibles, legítimos y socialmente aceptados.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              Estas instancias permiten identificar impactos sociales y ambientales de los proyectos, mejorar la calidad del diseño y la implementación, y contribuir a la generación de confianza y legitimidad en la comunidad.
            </p>
            <UAccordion
              v-model="openFaq"
              type="multiple"
              :items="faqItems"
              class="w-full"
            />
          </div>
        </UPageBody>
      </UPage>
    </UContainer>
  </UTheme>
</template>

<style scoped>
:global(html) {
  scroll-behavior: smooth;
}
</style>
