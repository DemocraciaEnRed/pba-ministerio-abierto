<script setup lang="ts">
import { es } from '@nuxt/ui/locale'

const toAbsolute = useAbsoluteUrl()

useHead({
  // Sufijo global del título: cada página define solo su parte y aquí se agrega
  // el nombre del sitio. Sin título de página, muestra solo el nombre del sitio.
  titleTemplate: title => (title ? `${title} · ${SITE_NAME}` : SITE_NAME),
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'manifest', href: '/site.webmanifest' }
  ],
  htmlAttrs: {
    lang: 'es'
  }
})

// Meta por defecto para toda página que no defina la suya (fallback global).
useSeoMeta({
  description: DEFAULT_SEO_DESCRIPTION,
  robots: 'index, follow',
  ogTitle: SITE_NAME,
  ogDescription: DEFAULT_SHARE_DESCRIPTION,
  ogType: 'website',
  ogSiteName: SITE_NAME,
  ogLocale: 'es_AR',
  ogImage: toAbsolute(DEFAULT_OG_IMAGE),
  ogImageWidth: 1200,
  ogImageHeight: 628,
  ogImageAlt: SITE_NAME,
  twitterCard: 'summary_large_image',
  twitterTitle: SITE_NAME,
  twitterDescription: DEFAULT_SHARE_DESCRIPTION,
  twitterImage: toAbsolute(DEFAULT_OG_IMAGE),
  twitterImageAlt: SITE_NAME
})

const tooltipConfigs = {
  delayDuration: 0
}
</script>

<template>
  <NuxtAnnouncer />
  <NuxtRouteAnnouncer />
  <UApp
    :locale="es"
    :tooltip="tooltipConfigs"
  >
    <NuxtLoadingIndicator
      color="var(--ui-primary)"
      :height="2"
    />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
