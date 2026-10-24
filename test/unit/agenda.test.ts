import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  agendaDayKey,
  buildAgendaMilestones,
  computeAgendaStats,
  formatAgendaDay,
  formatAgendaRelativeDay,
  formatAgendaTime,
  getAgendaWindow,
  groupMilestonesByDay,
  resolveAgendaEncounter
} from '../../app/utils/agenda'

// Viernes 16 de octubre de 2026, 15:00 (hora local).
const now = new Date(2026, 9, 16, 15, 0)
const { from, to } = getAgendaWindow(now, 30)

function at(day: number, month = 9, hour = 12) {
  return new Date(2026, month, day, hour).toISOString()
}

const items = [
  { id: 'abierta-sin-cierre', startsAt: at(1), endsAt: null },
  { id: 'abierta-cierra-pronto', startsAt: at(1), endsAt: at(20) },
  { id: 'abierta-cierra-fuera', startsAt: at(1), endsAt: at(30, 11) },
  { id: 'abre-y-cierra', startsAt: at(21), endsAt: at(23) },
  { id: 'abre-mismo-dia', startsAt: at(21, 9, 9), endsAt: at(5, 10) },
  { id: 'fuera-de-ventana', startsAt: at(20, 10), endsAt: at(25, 10) },
  { id: 'sin-fecha', startsAt: null, endsAt: null }
]

const withRegistration = [
  {
    id: 'audiencia',
    startsAt: at(1),
    endsAt: at(30, 11),
    registration: { opensAt: at(10), closesAt: at(25), eventAt: at(28, 9, 18) }
  },
  {
    id: 'inscripcion-cerrada',
    startsAt: at(1),
    endsAt: null,
    registration: { opensAt: at(1), closesAt: at(10), eventAt: at(12) }
  }
]

test('la ventana va del inicio de hoy al fin del día +30', () => {
  assert.equal(from.getTime(), new Date(2026, 9, 16).getTime())
  assert.equal(to.getDate(), 15)
  assert.equal(to.getMonth(), 10)
  assert.equal(to.getHours(), 23)
})

test('arma hitos de apertura y cierre dentro de la ventana, ordenados', () => {
  const milestones = buildAgendaMilestones(items, from, to)
  assert.deepEqual(
    milestones.map(m => `${m.item.id}:${m.kind}:${m.dayKey}`),
    [
      'abierta-cierra-pronto:closes:2026-10-20',
      'abre-mismo-dia:opens:2026-10-21',
      'abre-y-cierra:opens:2026-10-21',
      'abre-y-cierra:closes:2026-10-23',
      'abre-mismo-dia:closes:2026-11-05'
    ]
  )
})

test('agrupa los hitos por día', () => {
  const days = groupMilestonesByDay(buildAgendaMilestones(items, from, to))
  assert.deepEqual(days.map(d => `${d.dayKey}:${d.milestones.length}`), [
    '2026-10-20:1',
    '2026-10-21:2',
    '2026-10-23:1',
    '2026-11-05:1'
  ])
  assert.equal(days[1]!.date.getHours(), 0)
})

test('calcula los indicadores', () => {
  assert.deepEqual(computeAgendaStats(items, now, to), {
    openNow: 3,
    opensSoon: 2,
    closesThisWeek: 1,
    registrationOpen: 0
  })
})

test('suma hitos de inscripción y encuentro presencial', () => {
  const milestones = buildAgendaMilestones(withRegistration, from, to)
  assert.deepEqual(
    milestones.map(m => `${m.item.id}:${m.kind}:${m.dayKey}`),
    [
      'audiencia:registration_closes:2026-10-25',
      'audiencia:event:2026-10-28'
    ]
  )
  assert.equal(formatAgendaTime(milestones[1]!.date), '18:00')
})

test('cuenta las inscripciones abiertas', () => {
  assert.equal(computeAgendaStats(withRegistration, now, to).registrationOpen, 1)
})

const withRegionalMeeting = [
  {
    id: 'encuentro-con-inscripcion',
    startsAt: null,
    endsAt: null,
    regionalMeeting: {
      location: 'Junín',
      heldAt: at(30, 9, 10),
      registrationUrl: 'https://forms.gle/ejemplo',
      registrationOpensAt: at(10),
      registrationClosesAt: at(27)
    }
  },
  {
    id: 'encuentro-sin-inscripcion',
    startsAt: null,
    endsAt: null,
    regionalMeeting: {
      location: 'Tandil',
      heldAt: at(2, 10, 10),
      registrationUrl: null,
      registrationOpensAt: null,
      registrationClosesAt: null
    }
  }
]

test('suma hitos de los Encuentros Regionales', () => {
  const milestones = buildAgendaMilestones(withRegionalMeeting, from, to)
  assert.deepEqual(
    milestones.map(m => `${m.item.id}:${m.kind}:${m.dayKey}`),
    [
      'encuentro-con-inscripcion:registration_closes:2026-10-27',
      'encuentro-con-inscripcion:event:2026-10-30',
      'encuentro-sin-inscripcion:event:2026-11-02'
    ]
  )
})

test('resuelve el encuentro con inscripción externa', () => {
  assert.deepEqual(resolveAgendaEncounter(withRegionalMeeting[0]!), {
    eventAt: at(30, 9, 10),
    opensAt: at(10),
    closesAt: at(27),
    venue: 'Junín',
    path: 'https://forms.gle/ejemplo',
    external: true
  })
  assert.equal(resolveAgendaEncounter(items[0]!), null)
})

test('cuenta las inscripciones externas abiertas', () => {
  assert.equal(computeAgendaStats(withRegionalMeeting, now, to).registrationOpen, 1)
})

test('formatea días relativos y fechas', () => {
  assert.equal(formatAgendaRelativeDay(new Date(2026, 9, 16, 22), now), 'hoy')
  assert.equal(formatAgendaRelativeDay(new Date(2026, 9, 17, 1), now), 'mañana')
  assert.equal(formatAgendaRelativeDay(new Date(2026, 9, 24), now), 'en 8 días')
  assert.equal(formatAgendaDay(new Date(2026, 9, 24)), 'sábado 24 de octubre')
  assert.equal(agendaDayKey(new Date(2026, 9, 5, 23, 30)), '2026-10-05')
})
