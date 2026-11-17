import type { IsoDate } from './dates'

/**
 * Tope de avisos automáticos por mes (plan Gratis: 10). Puro.
 * Si no alcanza para todos, salen primero los más urgentes: el último aviso,
 * los atrasos y el seguimiento de una promesa antes que los "vence pronto".
 */
const URGENCY: Record<string, number> = { ultimo: 0, atraso: 1, promesa: 2, vence: 3, vispera: 4, previo: 5 }

export type QuotaItem = { stepId: string }

/** Cuántos quedan este mes. null = sin tope. */
export function remainingReminders(limit: number | null, sentThisMonth: number): number | null {
  if (limit === null) return null
  return Math.max(0, limit - sentThisMonth)
}

/** Deja pasar hasta `remaining` avisos, los más urgentes primero. */
export function applyReminderQuota<T extends QuotaItem>(items: T[], remaining: number | null): { send: T[]; held: T[] } {
  if (remaining === null) return { send: items, held: [] }
  const ranked = items
    .map((item, i) => ({ item, i, rank: URGENCY[item.stepId] ?? 9 }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
  return {
    send: ranked.slice(0, remaining).map((x) => x.item),
    held: ranked.slice(remaining).map((x) => x.item),
  }
}

/** Primer día del mes de "hoy" (en la zona de la empresa). */
export function monthStart(today: IsoDate): IsoDate {
  return `${today.slice(0, 7)}-01`
}
