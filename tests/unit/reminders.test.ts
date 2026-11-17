import { describe, expect, it } from 'vitest'
import { isBusinessDay, planReminders, remindersToSendOn, shiftToBusinessDay } from '@/domain/reminders'

// Noviembre de 2026: el 1 es domingo. Martes 10, viernes 13, domingo 15, lunes 16…
const days = (plan: ReturnType<typeof planReminders>) => plan.reminders.map((r) => `${r.sendOn.slice(8)}:${r.stepId}:${r.status}`)

describe('días hábiles', () => {
  it('reconoce fines de semana y feriados', () => {
    expect(isBusinessDay('2026-11-10')).toBe(true)
    expect(isBusinessDay('2026-11-14')).toBe(false) // sábado
    expect(isBusinessDay('2026-11-15')).toBe(false) // domingo
    expect(isBusinessDay('2026-11-10', ['2026-11-10'])).toBe(false)
  })

  it('mueve al hábil anterior o al siguiente', () => {
    expect(shiftToBusinessDay('2026-11-15', -1)).toBe('2026-11-13')
    expect(shiftToBusinessDay('2026-11-14', 1)).toBe('2026-11-16')
    expect(shiftToBusinessDay('2026-11-16', 1, ['2026-11-16'])).toBe('2026-11-17')
  })
})

describe('plan de avisos', () => {
  it('secuencia por defecto para un vencimiento en día hábil', () => {
    const plan = planReminders({ dueDate: '2026-11-10' })
    expect(days(plan)).toEqual(['05:previo:send', '09:vispera:send', '10:vence:send', '13:atraso:send', '17:ultimo:send'])
    expect(plan.handOffOn).toBe('2026-11-20')
  })

  it('cuando paga, lo que faltaba no sale y el caso no pasa a nadie', () => {
    const plan = planReminders({ dueDate: '2026-11-10', paidOn: '2026-11-12' })
    expect(days(plan)).toEqual(['05:previo:send', '09:vispera:send', '10:vence:send', '13:atraso:cancelled_paid', '17:ultimo:cancelled_paid'])
    expect(plan.handOffOn).toBeNull()
  })

  it('si paga antes del primer aviso, no sale ninguno', () => {
    const plan = planReminders({ dueDate: '2026-11-10', paidOn: '2026-11-03' })
    expect(plan.reminders.every((r) => r.status === 'cancelled_paid')).toBe(true)
  })

  it('no escribe en fin de semana: lo previo se adelanta y lo posterior se atrasa', () => {
    const plan = planReminders({ dueDate: '2026-11-15' }) // vence un domingo
    // víspera (sábado) y vencimiento (domingo) caen los dos el viernes 13: queda el de vencimiento.
    expect(days(plan)).toEqual(['10:previo:send', '13:vence:send', '18:atraso:send', '23:ultimo:send'])
  })

  it('respeta los feriados', () => {
    const plan = planReminders({ dueDate: '2026-11-10', holidays: ['2026-11-09', '2026-11-13'] })
    expect(days(plan)).toEqual(['05:previo:send', '06:vispera:send', '10:vence:send', '16:atraso:send', '17:ultimo:send'])
  })

  it('promesa de pago: silencio hasta la fecha y seguimiento al día hábil siguiente', () => {
    const plan = planReminders({ dueDate: '2026-11-10', promisedOn: '2026-11-11', promisedFor: '2026-11-20' })
    expect(days(plan)).toEqual([
      '05:previo:send', '09:vispera:send', '10:vence:send', // ya habían salido
      '13:atraso:held_promise', '17:ultimo:held_promise',
      '23:promesa:send', // el 21 es sábado
    ])
    expect(plan.handOffOn).toBe('2026-11-26')
  })

  it('si cumple la promesa, el seguimiento no sale', () => {
    const plan = planReminders({ dueDate: '2026-11-10', promisedOn: '2026-11-11', promisedFor: '2026-11-20', paidOn: '2026-11-19' })
    expect(plan.reminders.find((r) => r.stepId === 'promesa')?.status).toBe('cancelled_paid')
    expect(plan.handOffOn).toBeNull()
  })

  it('una promesa anterior a los avisos que quedan no los frena', () => {
    const plan = planReminders({ dueDate: '2026-11-10', promisedOn: '2026-11-04', promisedFor: '2026-11-06' })
    expect(days(plan)).toEqual(['05:previo:held_promise', '09:vispera:send', '10:vence:send', '13:atraso:send', '17:ultimo:send'])
  })

  it('pausa y baja frenan todo', () => {
    expect(planReminders({ dueDate: '2026-11-10', paused: true }).reminders.every((r) => r.status === 'paused')).toBe(true)
    const out = planReminders({ dueDate: '2026-11-10', optedOut: true, paused: true })
    expect(out.reminders.every((r) => r.status === 'opted_out')).toBe(true)
    expect(out.handOffOn).toBeNull()
  })

  it('acepta una secuencia propia, en cualquier orden', () => {
    const plan = planReminders({
      dueDate: '2026-11-10',
      steps: [{ id: 'b', offsetDays: 2, kind: 'after' }, { id: 'a', offsetDays: -2, kind: 'before' }],
    })
    expect(days(plan)).toEqual(['06:a:send', '12:b:send']) // el 8 es domingo: se adelanta al viernes 6
  })

  it('dice qué sale un día dado', () => {
    const plan = planReminders({ dueDate: '2026-11-10', paidOn: '2026-11-12' })
    expect(remindersToSendOn(plan, '2026-11-09').map((r) => r.stepId)).toEqual(['vispera'])
    expect(remindersToSendOn(plan, '2026-11-13')).toEqual([])
  })

  it('rechaza fechas inválidas', () => {
    expect(() => planReminders({ dueDate: '10/11/2026' })).toThrow(/Fecha inválida/)
  })
})
