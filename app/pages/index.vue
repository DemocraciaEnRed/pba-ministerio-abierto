<script setup lang="ts">
import type { PageFeatureProps, PageCardProps } from '@nuxt/ui';

const heroBackgroundImages = [
  { src: '/img/home/imagen001.jpg', alt: 'Obras y servicios públicos en la provincia de Buenos Aires' },
  { src: '/img/home/imagen002.jpg', alt: 'Infraestructura pública y desarrollo territorial' },
  { src: '/img/home/imagen003.jpg', alt: 'Encuentros de participación ciudadana' },
  { src: '/img/home/imagen004.jpg', alt: 'Espacios de diálogo con la comunidad' },
  { src: '/img/home/imagen005.jpg', alt: 'Gestión pública y obra en territorio' },
  { src: '/img/home/imagen006.jpg', alt: 'Relevamientos y trabajo territorial' },
  { src: '/img/home/imagen007.jpg', alt: 'Instancias de consulta y escucha' },
  { src: '/img/home/imagen008.jpg', alt: 'Proyectos de infraestructura en movimiento' },
  { src: '/img/home/imagen009.jpg', alt: 'Agenda pública abierta y participativa' },
  { src: '/img/home/imagen010.jpg', alt: 'Desarrollo de la provincia de Buenos Aires' },
  { src: '/img/home/imagen011.jpg', alt: 'Obras para mejorar la calidad de vida' },
  { src: '/img/home/imagen012.jpg', alt: 'Servicios públicos y gestión en territorio' },
  { src: '/img/home/imagen013.jpg', alt: 'Vinculación institucional con la ciudadanía' },
  { src: '/img/home/imagen014.jpg', alt: 'Trabajo conjunto con las comunidades' },
  { src: '/img/home/imagen015.jpg', alt: 'Infraestructura para un futuro compartido' }
]

const sectionsAsPageCards: Array<PageCardProps> = [
  {
    class: 'opacity-60 cursor-not-allowed pointer-events-none',
    to: undefined,
    icon: 'pba:audiencias-publicas',
    title: 'Audiencias Públicas',
    description: 'Conocé y seguí las audiencias públicas abiertas a la comunidad'
  },
  {
    class: 'opacity-60 cursor-not-allowed pointer-events-none',
    to: undefined,
    icon: 'pba:consultas-publicas',
    title: 'Consultas Públicas',
    description: 'Sumate a las consultas ciudadanas sobre proyectos de impacto'
  },
  {
    to: '/dialogos',
    icon: 'pba:obras',
    title: 'Diálogos',
    description: 'Formá parte para conocer el avance de obras estratégicas'
  },
  {
    class: 'opacity-60 cursor-not-allowed pointer-events-none',
    icon: 'pba:territorio',
    title: 'Encuentros Regionales',
    to: undefined,
    target: '_self',
    description: 'Participá para construir la agenda de desarrollo de tu región'
  },
  {
    class: 'opacity-60 cursor-not-allowed pointer-events-none',
    to: undefined,
    icon: 'pba:observatorio',
    title: 'Observatorio de Obras y Servicios Públicos',
    description: 'Primer espacio institucional de participación y control ciudadano sobre obras y servicios públicos de PBA.'
  },
]
</script>

<template>
  <section class="relative isolate overflow-hidden">
    <div class="absolute inset-0 -z-10">
      <UCarousel
        v-slot="{ item, index }"
        loop
        fade
        :autoplay="{ delay: 4500 }"
        :items="heroBackgroundImages"
        class="h-full"
        :ui="{
          root: 'h-full',
          viewport: 'h-full',
          container: 'h-full',
          item: 'h-full basis-full'
        }"
      >
        <img
          :src="item.src"
          :alt="item.alt"
          class="h-full w-full object-cover"
          width="1920"
          height="1080"
          :loading="index === 0 ? 'eager' : 'lazy'"
          :fetchpriority="index === 0 ? 'high' : 'auto'"
          decoding="async"
        >
      </UCarousel>

      <div class="absolute inset-0 bg-linear-to-b from-slate-950/75 via-slate-950/55 to-background/95" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.2),rgba(15,23,42,0.56))]" />
    </div>

    <UPageHero
      title="MINISTERIO ABIERTO"
      description="Un espacio con propuestas de participación ciudadana sobre obras y servicios públicos en la Provincia de Buenos Aires."
      class="relative z-10"
      :ui="{
        root: 'bg-linear-to-b from-pba-alt-300/25 to-white/15 dark:from-pba-alt-900/50 dark:to-black/10' ,
        description: 'text-neutral-100 dark:text-neutral-100 text-shadow-lg',
        title: 'text-pba-300 text-shadow-lg'
      }"
    />
  </section>
  <USeparator />
  
   <UPageSection
      id="origen"
      headline=""
      title="Construimos futuro"
    >
    <template #description>
      <p class="text-center max-w-4xl mx-auto"><span class="font-bold">MINISTERIO ABIERTO</span> es una iniciativa del <span class="font-bold">Ministerio de Infraestructura y Servicios Públicos (MISP)</span> para impulsar la gestión abierta y participativa en la Provincia de Buenos Aires.</p>
    </template>
    <div class="space-y-6 text-center max-w-4xl mx-auto">
      <p class=" ">La plataforma reúne las distintas instancias de participación disponibles en el territorio. A su vez, facilita a las y los bonaerenses el acceso a la información pública sobre distintas obras, proyectos y servicios del MISP; canaliza los intercambios de los encuentros regionales que se están desarrollando y habilita un espacio de consultas en torno a distintas iniciativas en marcha.</p>
      <p class="text-secondary text-lg md:text-2xl font-semibold">Tu voz cuenta. El desarrollo de la Provincia se logra entre todos y todas.</p>
    </div>
    <div class="flex gap-3 mx-auto max-w-full lg:max-w-[90%]">
      <UPageCard 
      :highlight="feature.to ? true : false"
      highlightColor="secondary"
      spotlight
      spotlightColor="primary"
      variant="subtle"
      class="flex-1 w-1/6"
      :class="feature.class ?? undefined"
      v-for="(feature, index) in sectionsAsPageCards" :key="index" :to="feature.to" :target="feature.target">
      <div class="flex-1 flex flex-col justify-evenly min-h-100 items-center text-center">
        <UIcon :name="feature.icon" class="size-45 text-primary" />
        <UBadge v-if="!feature.to" color="primary" variant="subtle" label="Próximamente" />
        <h3 class="text-xl text-primary font-bold">{{ feature.title }}</h3>
        <p>{{ feature.description }}</p>
      </div>
    </UPageCard>
    </div>
    </UPageSection>
</template>
