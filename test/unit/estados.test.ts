import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  agendaItemStateBadge,
  consultationStateBadge,
  participationStateBadge,
  topicStateBadge
} from '../../app/utils/estados'

test('el estado finalizado usa color neutral en todos los badges derivados', () => {
  assert.equal(participationStateBadge('closed').color, 'neutral')
  assert.equal(consultationStateBadge('visible', 'closed').color, 'neutral')
  assert.equal(topicStateBadge('visible', 'closed').color, 'neutral')
  assert.equal(agendaItemStateBadge('closed').color, 'neutral')
})

test('los colores de los estados programado y abierto se conservan', () => {
  assert.equal(participationStateBadge('scheduled').color, 'primary')
  assert.equal(participationStateBadge('open').color, 'success')
})
