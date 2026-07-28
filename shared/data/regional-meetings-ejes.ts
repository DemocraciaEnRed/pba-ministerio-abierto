/**
 * Árbol de ejes temáticos del Plan Estratégico de Infraestructura, usado en el
 * formulario de aportes de los Encuentros Regionales.
 *
 * Vive acá (y no en la base) porque es contenido fijo del formulario. Se usa en
 * el frontend (poblar el `UTree`) y en el schema Zod compartido para validar la
 * selección (se guardan los *labels* legibles del eje padre y del sub-eje).
 */

export interface EjeTematicoNode {
  value: string
  label: string
  icon?: string
  children?: EjeTematicoNode[]
}

export const EJES_TEMATICOS: EjeTematicoNode[] = [
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

/**
 * Valida la selección de eje temático por sus *labels*. Devuelve `true` cuando:
 * - `ejeTematico` es el label de un eje padre existente, y
 * - `subejeTematico` es `null`/vacío, o el label de un sub-eje de ese eje padre.
 */
export function isValidEjeTematicoSelection(
  ejeTematico: string,
  subejeTematico?: string | null
): boolean {
  const eje = EJES_TEMATICOS.find(node => node.label === ejeTematico)
  if (!eje) return false

  if (!subejeTematico) return true

  return Boolean(eje.children?.some(child => child.label === subejeTematico))
}
