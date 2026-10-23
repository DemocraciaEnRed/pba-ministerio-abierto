import { defineConfig } from 'vitest/config'
import { config as loadEnv } from 'dotenv'
import { fileURLToPath } from 'node:url'

// Los tests e2e levantan un server real y pegan a la base de datos de test.
// Cargamos .env.test (que apunta a `consultas_ciudadanas_test`) antes de todo,
// sobrescribiendo cualquier variable heredada del shell.
loadEnv({ path: '.env.test', override: true })

// Pocas filas por archivo de exportación para ejercitar la división en partes.
process.env.NUXT_EXPORTS_ROWS_PER_FILE = '3'

export default defineConfig({
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url))
    }
  },
  test: {
    include: ['test/e2e/**/*.{test,spec}.ts'],
    environment: 'node',
    testTimeout: 30_000,
    // El build inicial del server de test puede tardar; damos margen amplio.
    hookTimeout: 300_000,
    // Un único server compartido: evitamos correr archivos en paralelo.
    fileParallelism: false
  }
})
