import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getRobotsPolicy, isSiteIndexable } from '../../shared/utils/seo'

test('solo true explícito habilita la indexación', () => {
  for (const value of [true, 'true']) {
    assert.equal(isSiteIndexable(value), true)
    assert.equal(getRobotsPolicy(value), 'index, follow')
  }
  for (const value of [false, 'false', '', undefined, null]) {
    assert.equal(isSiteIndexable(value), false)
    assert.equal(getRobotsPolicy(value), 'noindex, nofollow')
  }
})

test('las páginas privadas y técnicas no se indexan ni en producción', () => {
  for (const value of [true, 'true', false, 'false', undefined]) {
    assert.equal(getRobotsPolicy(value, true), 'noindex, nofollow')
  }
})

test('una variable inválida produce un error explícito', () => {
  for (const value of ['tru', 'FALSE', '1', 1, {}]) {
    assert.throws(() => isSiteIndexable(value), /debe ser true o false/)
  }
})
