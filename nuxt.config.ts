// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', 'nuxt-auth-utils'],
  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],
  ui: {
    prose: true,
    theme: {
      // Colores semánticos disponibles en el prop `color` de los componentes.
      // Se listan los defaults de Nuxt UI + una entrada por región. La paleta
      // concreta de cada uno se asigna en app/app.config.ts (ui.colors).
      colors: [
        'primary',
        'secondary',
        'info',
        'success',
        'warning',
        'error',
        'region-metropolitana',
        'region-fluvial',
        'region-noroeste',
        'region-este',
        'region-centro-sur',
        'region-sudoeste',
        'region-costa-maritima',
        'region-norte',
        'region-centro-norte'
      ]
    }
  },

  runtimeConfig: {
    // Secreto para el endpoint oculto de bootstrap de administradores
    // (POST /api/_internal/admin-bootstrap). Si está vacío, el endpoint
    // responde 404 siempre. Definir vía NUXT_ADMIN_BOOTSTRAP_SECRET.
    adminBootstrapSecret: '',
    mail: {
      // 'smtp' usa SMTP real; 'stream' (o vacío) loguea a consola en dev.
      transport: '',
      host: '',
      port: '',
      secure: '',
      user: '',
      password: '',
      from: 'Consultas Ciudadanas <no-reply@example.com>'
    },
    storage: {
      // 'local' | 's3'
      driver: 'local',
      local: {
        // Directorio en disco donde se guardan los archivos subidos.
        dir: './.data/uploads'
      },
      s3: {
        endpoint: '',
        region: 'us-east-1',
        bucket: '',
        accessKeyId: '',
        secretAccessKey: '',
        // Prefijo base opcional dentro del bucket (ej. 'projects/consultas-ciudadanas-dev').
        prefix: '',
        // Base URL pública para construir URLs de assets (CDN o bucket público).
        publicBaseUrl: '',
        forcePathStyle: ''
      }
    },
    public: {
      // URL base de la app, usada para construir links en emails.
      appUrl: 'http://localhost:3000'
    }
  },

  compatibilityDate: '2025-01-15',

  nitro: {
    serverAssets: [
      {
        baseName: 'emails',
        dir: 'emails/templates'
      }
    ]
  },

  vite: {
    // Requerido por el editor enriquecido (UEditor/TipTap) para evitar
    // múltiples instancias de plugins de ProseMirror.
    optimizeDeps: {
      include: [
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-view',
        '@nuxt/ui > prosemirror-gapcursor'
      ]
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },
  fonts: {
    provider: 'google',
    defaults: {
      // Encode Sans en Google no expone itálica; si se pide `italic` devuelve 400.
      styles: ['normal'],
      weights: [400, 500, 600, 700],
      subsets: ['latin', 'latin-ext']
    },
    families: [
      {
        name: 'Encode Sans',
        provider: 'google',
        styles: ['normal'],
        weights: ['100 900'],
        subsets: ['latin', 'latin-ext', 'vietnamese']
      }
    ]
  },
  icon: {
    provider: 'server',
    serverBundle: {
      collections: ['lucide', 'simple-icons']
    },
    clientBundle: {
      scan: true,
      includeCustomCollections: true
    },
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
