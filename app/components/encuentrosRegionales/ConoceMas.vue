<script setup lang="ts">
import type { AccordionItem } from '@nuxt/ui'

const items = ref<(AccordionItem & { content: string })[]>([
  {
    label: 'Ejes temáticos de las mesas participativas',
    value: 'ejes-tematicos',
    content: `1. **Conectividad y logística** | Corredores viales para el desarrollo, seguridad vial, rehabilitación y mantenimiento, apoyo logístico a la producción local y caminos rurales
2. **Gestión Integrada de los Recursos Hídricos** | Gestión de cuencas, adaptación productiva a extremos climáticos, riesgo hídrico en ciudades, agua y saneamiento
3. **Energía accesible y sostenible** | Energía eléctrica, gas, energías renovables y eficiencia energética
4. **Infraestructura para los Sistemas de Ciudades** | Infraestructura urbana, productiva, para el transporte, ambiental, institucional, comunitaria y cultural
5. **Infraestructura del Cuidado** | Red del Cuidado para infancias, personas con discapacidad, personas mayores, mujeres y diversidades, juventudes
6. **Juventudes** | Futuro del trabajo, oferta educativa, condiciones necesarias para el arraigo, infraestructuras para su desarrollo integral`
  },
  {
    label: 'Regionalización de la PBA en el marco del PEI',
    value: 'regionalizacion-pba',
    content: `En la Provincia, los criterios de regionalización son múltiples y suelen ser utilizados por distintos organismos para **planificar políticas públicas**. En este caso, se toma como base la propuesta publicada por el Ministerio de Economía bonaerense en el estudio "Programación del Desarrollo Territorial. Diagnóstico preliminar y líneas de acción (2011-2012)", que delimitó regiones económico‑productivas desde una perspectiva político‑administrativa.

A partir de este esquema, se introdujeron ajustes orientados a favorecer la complementariedad productiva y social, con el objetivo de que sirvan como **insumo para la construcción de iniciativas de infraestructura integrales** que superen la capacidad de acción aislada de cada gobierno local. Esta organización territorial no restringe la realización de intervenciones fuera de sus límites; por el contrario, pretende articular esfuerzos para potenciar el desarrollo territorial y la eficacia de las políticas públicas, respetando las especificidades locales.

El criterio adoptado agrupó municipios en regiones homogéneas y compactas desde el punto de vista socioeconómico, dando como resultado una división del territorio en las **9 regiones** indicadas en el mapa disponible en este sitio.`
  }
])

const openItems = ref<string[]>(['ejes-tematicos'])
</script>

<template>
  <UAccordion
    v-model="openItems"
    type="multiple"
    :items="items"
    :ui="{ label: 'text-lg sm:text-xl font-bold text-primary', body: 'leading-7 text-neutral-700 dark:text-neutral-300', trigger: 'hover:cursor-pointer' }"
    class="w-full"
  >
    <template #content="{ item }">
      <MarkdownProse :content="item.content" />
    </template>
  </UAccordion>
</template>
