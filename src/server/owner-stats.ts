import type { createAdminClient } from '@/lib/supabase/admin'

/** Números de Cobra+ para los partes internos de PrimerosPrecios. */
export type OwnerStats = {
  newUsers: number
  totalUsers: number
  newOrgs: number
  totalOrgs: number
  newPaid: number
  activePaid: number
  remindersSent: number
  errors: number
  pendingRequests: number
}

export async function getOwnerStats(db: ReturnType<typeof createAdminClient>, since: string): Promise<OwnerStats> {
  const head = { count: 'exact' as const, head: true }
  const [u, ut, o, ot, np, paid, rem, errs, reqs] = await Promise.all([
    db.from('profiles').select('id', head).gte('created_at', since),
    db.from('profiles').select('id', head),
    db.from('organizations').select('id', head).gte('created_at', since),
    db.from('organizations').select('id', head),
    db.from('subscriptions').select('org_id', head).eq('status', 'active').neq('plan', 'free').gte('created_at', since),
    db.from('subscriptions').select('org_id', head).eq('status', 'active').neq('plan', 'free'),
    db.from('reminder_deliveries').select('id', head).eq('status', 'sent').gte('sent_at', since),
    db.from('app_errors').select('id', head).gte('at', since),
    db.from('consumer_requests').select('id', head).eq('status', 'pendiente'),
  ])
  return {
    newUsers: u.count ?? 0, totalUsers: ut.count ?? 0, newOrgs: o.count ?? 0, totalOrgs: ot.count ?? 0,
    newPaid: np.count ?? 0, activePaid: paid.count ?? 0, remindersSent: rem.count ?? 0,
    errors: errs.count ?? 0, pendingRequests: reqs.count ?? 0,
  }
}
