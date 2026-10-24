<script setup lang="ts">
// Enlace corto `/consultas/{id}`. En la primera carga lo redirige el servidor
// (middleware `consultation-redirects`); esta página cubre la navegación dentro
// de la app y muestra el 404 cuando la consulta no existe o no es visible.
definePageMeta({
  validate: route => parseConsultationId(route.params.idConsulta) !== null
})

const route = useRoute()
const requestFetch = useRequestFetch()
const consultationId = String(route.params.idConsulta)

const { data } = await useAsyncData(
  `consultation-permalink-${consultationId}`,
  () => requestFetch<{ publicPath: string }>(`/api/consultations/${consultationId}`)
)

if (!data.value?.publicPath) {
  throw createError({ statusCode: 404, message: 'Consulta no encontrada', fatal: true })
}

await navigateTo(
  { path: data.value.publicPath, query: route.query, hash: route.hash },
  { redirectCode: 301, replace: true }
)
</script>

<template>
  <div />
</template>
