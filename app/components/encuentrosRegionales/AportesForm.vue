<script setup lang="ts">
import type { TreeItem } from '@nuxt/ui'

defineOptions({ name: 'EncuentrosRegionalesAportesForm' })

interface EjeTematicoTreeItem extends TreeItem {
  value: string
  children?: EjeTematicoTreeItem[]
}

const ejesTematicosTree: EjeTematicoTreeItem[] = [
  {
    value: 'conectividad-y-logistica',
    label: 'Conectividad y logística',
    icon: 'lucide:route',
    children: [
      { value: 'corredores-viales-para-el-desarrollo', label: 'Corredores viales para el desarrollo' },
      { value: 'seguridad-vial', label: 'Seguridad vial' },
      { value: 'rehabilitacion-y-mantenimiento', label: 'Rehabilitación y mantenimiento' },
      { value: 'apoyo-logistico-a-la-produccion-local', label: 'Apoyo logístico a la producción local' },
      { value: 'caminos-rurales', label: 'Caminos rurales' }
    ]
  },
  {
    value: 'gestion-integrada-de-los-recursos-hidricos',
    label: 'Gestión Integrada de los Recursos Hídricos',
    icon: 'lucide:droplets',
    children: [
      { value: 'gestion-de-cuencas', label: 'Gestión de cuencas' },
      { value: 'adaptacion-productiva-a-extremos-climaticos', label: 'Adaptación productiva a extremos climáticos' },
      { value: 'riesgo-hidrico-en-ciudades', label: 'Riesgo hídrico en ciudades' },
      { value: 'agua-y-saneamiento', label: 'Agua y saneamiento' }
    ]
  },
  {
    value: 'energia-accesible-y-sostenible',
    label: 'Energía accesible y sostenible',
    icon: 'lucide:zap',
    children: [
      { value: 'energia-electrica', label: 'Energía eléctrica' },
      { value: 'gas', label: 'Gas' },
      { value: 'energias-renovables', label: 'Energías renovables' },
      { value: 'eficiencia-energetica', label: 'Eficiencia energética' }
    ]
  },
  {
    value: 'infraestructura-para-los-sistemas-de-ciudades',
    label: 'Infraestructura para los Sistemas de Ciudades',
    icon: 'lucide:building-2',
    children: [
      { value: 'infraestructura-urbana', label: 'Infraestructura urbana' },
      { value: 'infraestructura-productiva', label: 'Infraestructura productiva' },
      { value: 'infraestructura-para-el-transporte', label: 'Infraestructura para el transporte' },
      { value: 'infraestructura-ambiental', label: 'Infraestructura ambiental' },
      { value: 'infraestructura-institucional', label: 'Infraestructura institucional' },
      { value: 'infraestructura-comunitaria', label: 'Infraestructura comunitaria' },
      { value: 'infraestructura-cultural', label: 'Infraestructura cultural' }
    ]
  },
  {
    value: 'infraestructura-del-cuidado',
    label: 'Infraestructura del Cuidado',
    icon: 'lucide:heart-handshake',
    children: [
      { value: 'red-del-cuidado-para-infancias', label: 'Red del Cuidado para infancias' },
      { value: 'red-del-cuidado-para-personas-con-discapacidad', label: 'Red del Cuidado para personas con discapacidad' },
      { value: 'red-del-cuidado-para-personas-mayores', label: 'Red del Cuidado para personas mayores' },
      { value: 'red-del-cuidado-para-mujeres-y-diversidades', label: 'Red del Cuidado para mujeres y diversidades' },
      { value: 'red-del-cuidado-para-juventudes', label: 'Red del Cuidado para juventudes' }
    ]
  },
  {
    value: 'juventudes',
    label: 'Juventudes',
    icon: 'lucide:users',
    children: [
      { value: 'futuro-del-trabajo', label: 'Futuro del trabajo' },
      { value: 'oferta-educativa', label: 'Oferta educativa' },
      { value: 'condiciones-necesarias-para-el-arraigo', label: 'Condiciones necesarias para el arraigo' },
      { value: 'infraestructuras-para-su-desarrollo-integral', label: 'Infraestructuras para su desarrollo integral' }
    ]
  }
]

const ejeTematicoSeleccionado = ref<EjeTematicoTreeItem>()

// Eje padre al que pertenece la selección (o la misma selección si es un eje).
const ejePadreSeleccionado = computed(() => {
  const seleccion = ejeTematicoSeleccionado.value
  if (!seleccion) return undefined
  return ejesTematicosTree.find(
    eje => eje.value === seleccion.value || eje.children?.some(sub => sub.value === seleccion.value)
  )
})
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex justify-between items-center gap-3">
        <div>
          <h2 class="text-lg font-semibold text-highlighted">
            Aportes al Plan Estratégico de Infraestructura
          </h2>
          <p class="text-sm text-muted">
            Seleccioná un eje temático para sumar tus aportes.
          </p>
        </div>
        <UIcon
          name="lucide:form"
          class="size-5 shrink-0 text-muted"
        />
      </div>
    </template>
    <UFormField
      name="ejeTematico"
      label="¿A qué eje temático querés sumar aportes?"
      help="Desplegá un eje y elegí el subtema al que corresponde tu aporte."
      required
    >
      <UTree
        v-model="ejeTematicoSeleccionado"
        :items="ejesTematicosTree"
        :get-key="(item) => (item as EjeTematicoTreeItem).value"
        color="primary"
        class="w-full border border-accented rounded-md p-2"
      />
    </UFormField>

    <div
      v-if="ejeTematicoSeleccionado"
      class="mt-4 flex items-start gap-3 rounded-md border border-accented bg-elevated/50 p-4"
    >
      <UIcon
        name="lucide:check-circle"
        class="mt-0.5 size-5 shrink-0 text-primary"
      />
      <div class="text-sm leading-6">
        <p class="text-muted">
          Elegiste:
        </p>
        <p class="font-semibold text-highlighted">
          {{ ejeTematicoSeleccionado.label }}
        </p>
        <p
          v-if="ejePadreSeleccionado && ejePadreSeleccionado.value !== ejeTematicoSeleccionado.value"
          class="text-muted"
        >
          Eje temático: {{ ejePadreSeleccionado.label }}
        </p>
      </div>
    </div>
  </UCard>
</template>
