import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  consultationPanelPath,
  consultationPermalinkPath,
  consultationPublicPath,
  parseConsultationId,
  slugifyConsultationName
} from '../../shared/utils/consultation-url'

test('genera el nombre legible sin acentos ni símbolos', () => {
  assert.equal(
    slugifyConsultationName('Audiencia ABSA - ADA. Modificación tarifaria 2026'),
    'audiencia-absa-ada-modificacion-tarifaria-2026'
  )
  assert.equal(slugifyConsultationName('  ¿Qué obras?  '), 'que-obras')
})

test('corta el nombre en una palabra completa', () => {
  const title = 'Consulta Suipacha. Rehabilitación de la Planta de Tratamiento y Ampliación del Sistema de Desagües Cloacales'
  const slug = slugifyConsultationName(title)
  assert.ok(slug.length <= 80)
  assert.equal(slug, 'consulta-suipacha-rehabilitacion-de-la-planta-de-tratamiento-y-ampliacion-del')
  assert.equal(slugifyConsultationName('uno-dos-tres', 7), 'uno-dos')
  assert.equal(slugifyConsultationName('uno dos tres', 8), 'uno-dos')
  assert.equal(slugifyConsultationName('palabralarguisima', 5), 'palab')
})

test('arma la URL pública canónica con sección, id y nombre', () => {
  const consultation = { id: 28, slug: 'plan-hidrico', section: { slug: 'audiencias-publicas' } }
  assert.equal(consultationPublicPath(consultation), '/audiencias-publicas/28/plan-hidrico')
  assert.equal(consultationPublicPath(consultation, 'inscripcion'), '/audiencias-publicas/28/plan-hidrico/inscripcion')
  assert.equal(consultationPublicPath(consultation, '/inscripcion/exito/'), '/audiencias-publicas/28/plan-hidrico/inscripcion/exito')
})

test('sin sección usa /consultas; sin sección cargada cae en el enlace corto', () => {
  assert.equal(consultationPublicPath({ id: 5, slug: 'x', section: null }), '/consultas/5/x')
  assert.equal(consultationPublicPath({ id: 5, slug: 'x' }), '/consultas/5')
  assert.equal(consultationPermalinkPath(5, 'inscripcion'), '/consultas/5/inscripcion')
})

test('arma la ruta del panel por id', () => {
  assert.equal(consultationPanelPath(7), '/consultas/7/panel')
  assert.equal(consultationPanelPath(7, 'temas/nuevo'), '/consultas/7/panel/temas/nuevo')
})

test('solo acepta ids enteros positivos', () => {
  assert.equal(parseConsultationId('28'), 28)
  assert.equal(parseConsultationId(['3']), 3)
  for (const value of ['0', '-1', '1.5', 'plan-hidrico', '28abc', '', undefined, null]) {
    assert.equal(parseConsultationId(value), null)
  }
})
