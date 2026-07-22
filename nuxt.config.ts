// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui'],

  // colorMode: {
  //   preference: 'light', // 'light', 'dark', or 'system'
  //   fallback: 'light'
  // },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  ssr: true,

  runtimeConfig: {
    public: {
      assetIsologoDarkPng: 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/isologo-dark.png',
      assetIsologoLightPng: 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/isologo-light.png',
      assetIsologoLightSvg: 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/isologo-light.svg',
      assetIsologoPng: 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/isologo.png',
      assetIsologoShrinkDarkSvg: 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/isologo-shrink-dark.svg',
      assetIsologoShrinkLightSvg: 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/isologo-shrink-light.svg',
      assetIsologoShrinkSvg: 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/isologo-shrink.svg',
      assetIsologoSvg: 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/isologo.svg',
      assetLogoCianSvg: 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/logo-cian.svg',
      assetLogoDarkSvg: 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/logo-dark.svg',
      assetLogofullCianSvg: 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/logofull-cian.svg',
      assetLogofullDarkSvg: 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/logofull-dark.svg',
      assetLogofullLightSvg: 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/logofull-light.svg',
      assetLogofullSvg: 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/logofull.svg',
      assetLogoLightSvg: 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/logo-light.svg',
      assetLogoSvg: 'https://democraciaenred.nyc3.digitaloceanspaces.com/projects/pba-ministerio-abierto/app/assets/logo/logo.svg'
    }
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        '/dialogos',
        '/politica-de-privacidad',
        '/terminos-y-condiciones'
      ]
    }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },
  icon: {
    customCollections: [
      {
        prefix: 'der',
        dir: './app/assets/icons/der'
      },
      {
        prefix: 'pba',
        dir: './app/assets/icons/pba'
      }
    ]
  }
})