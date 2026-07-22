<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui';
import type { ThemeUI } from '@nuxt/ui/runtime/composables/useComponentProps.js';

useSeoMeta({
  title: 'Diálogos'
})

const faqItems = ref<AccordionItem[]>([
  {
    label: '¿Cómo funcionan?',
    value: 'como-funcionan',
    content:
      'A través de esta herramienta, el Ministerio presenta el proyecto u obra en el territorio donde se ejecuta o ejecutará, a través de los equipos técnicos del organismo y con la participación de distintos actores de la ciudadanía vinculados de manera directa o indirecta con la intervención. Se generará un espacio específico dentro del sitio destinado a cada una de las jornadas que se realicen donde se comparte la documentación del proyecto presentada en el encuentro en territorio y se abre una sección para recibir comentarios y aportes.'
  },
  {
    label: '¿Cómo participar?',
    value: 'como-participar',
    content:
      'Tanto quienes concurran a los encuentros como aquellos que no puedan hacerlo podrán participar en el espacio de consultas e intercambio que estará disponible una vez que se realice la presentación de la obra o el proyecto. Los comentarios pueden realizarse desde el día del encuentro y hasta 7 días después.'
  },
  {
    label: '¿Qué ocurre después del proceso participativo?',
    value: 'que-ocurre-despues',
    content:
      'Al finalizar ese período, se desarrolla un informe final que reúne tanto los comentarios vertidos en el encuentro presencial como los recibidos de manera virtual. El informe quedará disponible en la misma plataforma.'
  }
])

const openFaq = ref<string[]>(['como-funcionan'])

const baseS3Url = 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/fotos-dialogos'
const fotosDialogos = [
  '/dialogos01.jpg',
  '/dialogos02.jpg',
  '/dialogos03.jpg',
  '/dialogos04.jpg',
  '/dialogos05.jpg',
  '/dialogos06.jpg',
]


const themeUi: ThemeUI = {
  pageHero: {
    root: 'bg-[linear-gradient(351deg,rgba(0,154,174,0.75)_0%,rgba(186,24,94,0.75)_100%)]',
    // Default constainer: flex flex-col lg:grid py-24 sm:py-32 lg:py-40 gap-16 sm:gap-y-24
    container: 'flex flex-col lg:flex lg:flex-row py-24 sm:py-32 lg:py-16 gap-16 sm:gap-y-24 justify-center ',
    // Default title: 'text-5xl sm:text-7xl text-pretty tracking-tight font-bold text-highlighted',
    title: 'text-white text-shadow-lg text-4xl sm:text-5xl font-extrabold ',
    // Default description: 'text-lg sm:text-xl/8 text-muted',    
    description: 'text-white text-shadow-lg',
    wrapper: 'max-w-2xl text-center'
  }
}
</script>

<template>
  <UTheme :ui="themeUi">
    <UPageHero
      title="Obras y proyectos en diálogo"
      description="Espacios participativos para conocer las intervenciones del Ministerio de Infraestructura y Servicios Públicos en tu región"
      orientation="horizontal"
      reverse
    >
    <UIcon name="pba:obras" class="size-50 md:size-60 text-white" />
    </UPageHero>
    <USeparator />
    <UContainer>
      <UPage>
        <UPageBody>
        <div class="max-w-3xl mx-auto py-12 space-y-6">
          <p class="leading-7 text-neutral-700 dark:text-neutral-300">
            El Ministerio de Infraestructura y Servicios Públicos organiza y desarrolla en el territorio instancias informativas y de consulta vinculadas a la comunicación de los avances de obras y proyectos emblemáticos que representan un alto impacto para la comunidad.
          </p>
          <p class="leading-7 text-neutral-700 dark:text-neutral-300">
            Estos espacios tienen un carácter flexible y el objetivo de propiciar la difusión de las políticas
            de infraestructura con la participación temprana de actores clave y partes interesadas, como
            municipios, universidades, expertas y expertos locales, cooperativas y organizaciones sociales.
          </p>
          <p class="leading-7 text-neutral-700 dark:text-neutral-300">
            Durante estos encuentros se propone incorporar el saber territorial de cada obra o proyecto de la
            comunidad involucrada a la mirada técnica del Ministerio, generando una instancia de gobierno abierto
            que apunte a mejorar el impacto de la intervención, a favorecer el acceso a la información y a
            contribuir a la generación de confianza.
          </p>
        </div>
        <USeparator label="Preguntas y respuestas" class="my-6" />
        <div class="max-w-3xl mx-auto py-12">
          <UAccordion
            v-model="openFaq"
            type="multiple"
            :items="faqItems"
            :ui="{ label: 'text-2xl font-bold text-primary', body: 'leading-7 text-neutral-700 dark:text-neutral-300' }"
            class="w-full"
          />
        </div>
        <USeparator label="Galeria de fotos" class="my-6" />
        <UCarousel
          v-slot="{ item, index }"
          :items="fotosDialogos"
          :autoplay="{ delay: 4000 }"
          loop
          arrows
          dots
          :ui="{ item: 'basis-full sm:basis-1/2 lg:basis-1/3' }"
          class="w-full py-8"
        >
          <img
            :src="`${baseS3Url}${item}`"
            :alt="`Foto diálogo ${index + 1}`"
            class="h-64 w-full rounded-lg object-cover shadow-lg"
          >
        </UCarousel>
        </UPageBody>
      </UPage>
    </UContainer>
    <USeparator />
    <UPageSection 
      title="Diálogos"
      :links="[
        {
          to: '/',
          label: 'Volver al inicio',
          icon: 'lucide:arrow-left',
          variant: 'soft'
        }
      ]"
      headline="Próximamente"
    />
    <!-- <UContainer>
      <UPage>
        <UPageBody class="scroll-section">
          <h1 id="dialogos" ref="dialogos" class="text-4xl font-extrabold mb-4">Diálogos</h1>
          <UTabs orientation="horizontal" :items="filtersDialogos" class="w-full" color="primary" variant="link" />
          <UBlogPosts>
            <UBlogPost
            v-for="(post, index) in dialogosPosts"
            :key="index"
            v-bind="post"
            />
          </UBlogPosts>
          <UPagination v-model:page="page" :total="100" />
        </UPageBody>
      </UPage>
    </UContainer> -->
  </UTheme>
</template>

<style scoped>
:global(html) {
  scroll-behavior: smooth;
}
</style>
