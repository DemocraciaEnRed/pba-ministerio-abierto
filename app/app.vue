<script setup>
useHead({
  titleTemplate: titleChunk => titleChunk ? `${titleChunk} - Ministerio Abierto` : 'Ministerio Abierto',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'es'
  }
})

const siteUrl = 'https://ministerioabierto.minfra.gba.gob.ar'
const title = 'Ministerio Abierto'
const description = 'Iniciativa de gobierno abierto del Ministerio de Infraestructura y Servicios Públicos de la provincia de Buenos Aires: información y participación ciudadana.'
const shareDescription = 'Ministerio Abierto es una iniciativa de gobierno abierto del Ministerio de Infraestructura y Servicios Públicos. Es un espacio que reúne las distintas instancias participativas del Ministerio de Infraestructura y Servicios Públicos con el fin de facilitar el acceso a la información y canalizar la participación de la ciudadanía y de las partes interesadas.'
const shareImage = `https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/sharer-01.png`

useSeoMeta({
  description,
  robots: 'index, follow',
  ogTitle: title,
  ogDescription: shareDescription,
  ogType: 'website',
  ogUrl: siteUrl,
  ogSiteName: title,
  ogLocale: 'es_AR',
  ogImage: shareImage,
  ogImageWidth: 1200,
  ogImageHeight: 628,
  ogImageAlt: title,
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: shareDescription,
  twitterImage: shareImage
})
</script>

<template>
    <NuxtAnnouncer />
  <NuxtRouteAnnouncer />
<NuxtLoadingIndicator />
   <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
