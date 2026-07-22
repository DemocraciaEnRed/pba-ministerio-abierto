import { defineConfig } from 'vitest/config'
import { config as loadEnv } from 'dotenv'

// Los tests e2e levantan un server real y pegan a la base de datos de test.
// Cargamos .env.test (que apunta a `consultas_ciudadanas_test`) antes de todo,
// sobrescribiendo cualquier variable heredada del shell.
loadEnv({ path: '.env.test', override: true })

export default defineConfig({
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
