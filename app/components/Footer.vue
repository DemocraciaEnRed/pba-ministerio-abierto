<script setup lang="ts">
import type { FooterColumn } from '@nuxt/ui'

const socialLinks = [
  {
    label: 'Facebook',
    icon: 'simple-icons:facebook',
    to: 'https://www.facebook.com/BAProvincia/'
  },
  {
    label: 'X',
    icon: 'simple-icons:x',
    to: 'https://x.com/baprovincia'
  },
  {
    label: 'Instagram',
    icon: 'simple-icons:instagram',
    to: 'https://www.instagram.com/provinciaba/'
  },
  {
    label: 'YouTube',
    icon: 'simple-icons:youtube',
    to: 'https://www.youtube.com/channel/UCRuY8kHZHaiqAAdjcgobsNw'
  },
  {
    label: 'Telegram',
    icon: 'simple-icons:telegram',
    to: 'https://t.me/GobiernoPBA'
  },
  {
    label: 'TikTok',
    icon: 'simple-icons:tiktok',
    to: 'https://www.tiktok.com/@provinciaba'
  },
  {
    label: 'Twitch',
    icon: 'simple-icons:twitch',
    to: 'https://www.twitch.tv/provinciaba'
  }
]

const footerColumns: FooterColumn[] = [
  {
    label: 'Secciones',
    children: [
      {
        label: 'Inicio'
      },
      {
        label: 'Audiencias públicas'
      },
      {
        label: 'Consultas públicas'
      },
      {
        label: 'Encuentros regionales'
      },
      {
        label: 'Obras y proyectos en dialogo'
      },
      {
        label: 'Observatorio'
      },
      {
        label: 'Acerca de'
      }
    ]
  },
  {
    label: 'Provincia de Buenos Aires',
    children: [
      {
        label: 'Portal de la Provincia',
        to: 'https://www.gba.gob.ar/',
        target: '_blank'
      },
      {
        label: 'Registro de las Personas',
        to: 'https://www.gba.gob.ar/registrodelaspersonas',
        target: '_blank'
      },
      {
        label: 'Boletin Oficial',
        to: 'https://boletinoficial.gba.gob.ar/',
        target: '_blank'
      },
      {
        label: 'ARBA',
        to: 'https://web.arba.gov.ar/',
        target: '_blank'
      },
      {
        label: 'Consulta de expedientes',
        to: 'https://sistemas.gba.gov.ar/consulta/expedientes/index.php',
        target: '_blank'
      }
    ]
  },
  {
    label: 'Legales',
    children: [
      {
        label: 'Términos y condiciones',
        to: '/acerca-de/terminos-y-condiciones'
      },
      {
        label: 'Política de privacidad',
        to: '/acerca-de/politica-de-privacidad'
      }
    ]
  }
]
</script>

<template>
  <UFooter class="pt-12 pb-16">
    <template #top>
      <img
        src="https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/footer-header.png"
        alt="Footer Header"
        class="w-full h-auto"
      >
    </template>
    <UFooterColumns
      :columns="footerColumns"
      :ui="{ list: 'space-y-2' }"
    >
      <template #left>
        <div class="flex flex-col gap-4 items-start justify-start">
          <img
            src="https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/logofull.svg"
            alt="Ministerio Abierto"
            class=""
          >
          <div class="flex flex-col gap-2 items-start justify-start">
            <p class="text-toned text-lg">
              <b>Ministerio de Infraestructura y Servicios Públicos</b>
            </p>
            <p class="text-sm text-muted">
              Provincia de Buenos Aires
            </p>
          </div>
          <div class="flex flex-wrap gap-1 items-center justify-start">
            <UButton
              v-for="link in socialLinks"
              :key="link.label"
              :icon="link.icon"
              :to="link.to"
              :aria-label="link.label"
              target="_blank"
              color="primary"
              variant="ghost"
            />
          </div>
        </div>
      </template>
    </UFooterColumns>
  </UFooter>
</template>
