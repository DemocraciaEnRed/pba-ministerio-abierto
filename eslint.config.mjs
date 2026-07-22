// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    files: ['app/components/**/*.vue'],
    rules: {
      // Componentes de app de una sola palabra usados en layouts.
      'vue/multi-word-component-names': ['error', {
        ignores: ['Header', 'Footer']
      }]
    }
  }
)
