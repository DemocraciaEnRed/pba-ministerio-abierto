import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatEventDateTime } from '../../app/utils/dates'

test('formatea la fecha del encuentro con mes completo capitalizado y año', () => {
  assert.equal(
    formatEventDateTime('2026-10-30T18:05:00'),
    '30 de Octubre de 2026, 18:05 Hs.'
  )
})

test('indica cuando la fecha del encuentro no está definida', () => {
  assert.equal(formatEventDateTime(null), 'Sin definir')
})
