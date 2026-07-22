<script setup lang="ts">
defineProps<{
  /** Clases extra para el contenedor con scroll horizontal. */
  wrapperClass?: string
  /** Clases extra para el elemento <table>. */
  tableClass?: string
  /** Alterna el color de fondo de las filas (zebra striping). */
  zebra?: boolean
  /** Filas interactivas: cursor pointer + hover más marcado. */
  clickable?: boolean
  /** Alinea a la derecha la última columna (útil para acciones). */
  alignLastRight?: boolean
  /** Cuando es true muestra el slot #empty en lugar del cuerpo. */
  empty?: boolean
}>()
</script>

<template>
  <div
    class="app-table-wrapper overflow-x-auto border border-default rounded-md"
    :class="wrapperClass"
  >
    <table
      class="app-table w-full text-sm"
      :class="[tableClass, { 'app-table--zebra': zebra, 'app-table--clickable': clickable, 'app-table--last-right': alignLastRight }]"
    >
      <thead class="app-table-head">
        <slot name="thead" />
      </thead>
      <tbody
        v-if="!empty"
        class="app-table-body"
      >
        <slot name="tbody" />
      </tbody>
    </table>

    <slot
      v-if="empty"
      name="empty"
    >
      <p class="py-8 text-center text-sm text-muted">
        No hay datos para mostrar.
      </p>
    </slot>
  </div>
</template>

<style scoped>
/*
 * El contenido de thead/tbody llega por slots, así que se renderiza en el
 * scope del padre. Para poder estilizarlo desde acá usamos :slotted().
 * Se usan las variables de tema de Nuxt UI para respetar claro/oscuro.
 */

/* Encabezado */
.app-table-head :slotted(tr) {
  text-align: left;
  border-bottom: 1px solid var(--ui-border);
}

.app-table-head :slotted(th) {
  padding: 0.5rem 0.75rem;
  font-weight: 500;
  color: var(--ui-text-muted);
}

/* Cuerpo */
.app-table-body :slotted(tr) {
  border-bottom: 1px solid var(--ui-border);
  transition: background-color 0.15s ease;
}

.app-table-body :slotted(td) {
  padding: 0.35rem 0.75rem;
}

/* Truco: resaltar la fila al pasar el mouse. */
.app-table-body :slotted(tr:hover) {
  background-color: color-mix(in oklab, var(--ui-bg-elevated) 50%, transparent);
}

/* Sin borde en la última fila para un cierre más prolijo. */
.app-table-body :slotted(tr:last-child) {
  border-bottom: 0;
}

/* Zebra striping: filas pares con un fondo sutil. */
.app-table--zebra .app-table-body :slotted(tr:nth-child(even)) {
  background-color: color-mix(in oklab, var(--ui-bg-muted) 40%, transparent);
}

/* Filas interactivas: cursor + hover más marcado. */
.app-table--clickable .app-table-body :slotted(tr) {
  cursor: pointer;
}

.app-table--clickable .app-table-body :slotted(tr:hover) {
  background-color: color-mix(in oklab, var(--ui-bg-accented) 60%, transparent);
}

/* Alinea la última columna a la derecha (encabezado y celdas). */
.app-table--last-right .app-table-head :slotted(th:last-child),
.app-table--last-right .app-table-body :slotted(td:last-child) {
  text-align: right;
}
</style>
