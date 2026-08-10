<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'
import type { ThemeUI } from '@nuxt/ui/runtime/types/theme.js'

usePageSeo({
  title: 'Audiencias públicas',
  description: 'Informate y participá en las audiencias públicas sobre obras y servicios con impacto en la Provincia de Buenos Aires.',
  url: '/audiencias-publicas'
})

const faqItems = ref<AccordionItem[]>([
  {
    label: '¿Cómo funcionan?',
    value: 'como-funcionan',
    content:
      'Una vez que un área haya decidido avanzar en la inclusión de una audiencia pública para la adopción de una decisión, se definen los temas a tratar, la fecha y el lugar y se lanza la convocatoria. La convocatoria se publica al menos treinta días antes de la realización de la audiencia en el Boletín Oficial, en dos diarios de circulación nacional y en un medio correspondiente a la zona donde el proyecto pudiera tener impacto, por tres días consecutivos. Toda la información sobre los asuntos a tratar debe ser puesta a disposición de la ciudadanía.'
  },
  {
    label: '¿Qué asuntos pueden tratarse?',
    value: 'que-asuntos-pueden-tratarse',
    content:
      'Todo asunto de interés general que las autoridades consideren que amerita ser sometido a consideración de la ciudadanía. La convocatoria puede abarcar a toda la Provincia o limitarse a una región específica, cuando el tema sujeto a consideración se acote a una determinada zona.'
  },
  {
    label: '¿Qué asuntos no pueden tratarse?',
    value: 'que-asuntos-no-pueden-tratarse',
    content:
      'De acuerdo a la Ley N° 13.569, quedan excluidos los temas referidos a reforma constitucional, la aprobación de tratados y convenios, el presupuesto, impuestos, recursos, creación de municipios y de órganos jurisdiccionales.'
  },
  {
    label: '¿Cómo participar?',
    value: 'como-participar',
    content:
      'La asistencia a las audiencias es libre. Para hacer uso de la palabra es necesario inscribirse con una antelación mínima de cinco días a la realización de la audiencia. Si quisieras formular preguntas, tenés que acercarlas por escrito y contar con la autorización previa de la presidencia de la audiencia. La autoridad convocante puede requerir la participación de investigadores y especialistas en el asunto a tratar.'
  },
  {
    label: '¿Qué es el orden del día?',
    value: 'que-es-el-orden-del-dia',
    content:
      'Es el documento que organiza el desarrollo de la audiencia: presenta el orden de las exposiciones, las intervenciones de las autoridades, el listado de participantes inscriptos y la participación de investigadores y especialistas convocados. El orden del día se publica 24 horas antes del inicio de la audiencia. En algunos casos, las audiencias pueden desarrollarse en más de una jornada por la cantidad de personas interesadas en participar.'
  },
  {
    label: '¿Qué ocurre después de la audiencia?',
    value: 'que-ocurre-despues-de-la-audiencia',
    content:
      'Las opiniones expresadas en la audiencia tienen carácter consultivo y no vinculante. Todo lo expresado en la audiencia se transcribe en un acta, a la que la presidencia puede sumar observaciones o informes escritos. El informe final consigna de qué manera se han tomado en consideración las opiniones vertidas en la audiencia pública.'
  }
])

const openFaq = ref<string[]>([])

const themeUi: ThemeUI = {
  pageHero: {
    root: 'header-background-audiencias-publicas bg-primary',
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
      title="Audiencias públicas"
      orientation="horizontal"
      reverse
    >
      <template #description>
        <p class="">
          Espacios abiertos de información y participación ciudadana para la definición de obras y servicios públicos.
        </p>
      </template>
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
              Para asegurar procesos más abiertos y participativos, el Ministerio de Infraestructura y Servicios Públicos realiza el llamado a audiencias públicas sobre los proyectos de obras y de servicios con impacto en la Provincia de Buenos Aires. Se trata de mecanismos formales de participación y control ciudadano que cuentan con reglas, procedimientos y documentación específica para asegurar procesos transparentes, responsables y centrados en el interés público.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              Una audiencia pública es una instancia participativa en el proceso de decisión administrativa o legislativa, destinada a conocer la opinión de las y los ciudadanos y/o asociaciones intermedias que puedan verse afectados o tengan un interés particular sobre el asunto que es objeto de la convocatoria. Cada instancia permite que cualquier persona, organización o empresa acceda a información clara y actualizada, realice consultas, exprese opiniones y aporte observaciones, antes de que se tomen decisiones. De este modo, se busca incorporar diversas miradas y fortalecer la legitimidad de las políticas.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              La
              <ULink
                href="https://normas.gba.gob.ar/documentos/VWEe8uGx.html"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary underline"
                external
              >
                Ley N° 13.569
              </ULink>
              regula la realización de las audiencias públicas convocadas por el Poder Ejecutivo o Legislativo de la Provincia de Buenos Aires.
            </p>
            <UAccordion
              v-model="openFaq"
              type="multiple"
              :items="faqItems"
              :ui="{ label: 'text-2xl font-bold text-primary', body: 'leading-7 text-neutral-700 dark:text-neutral-300' }"
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
