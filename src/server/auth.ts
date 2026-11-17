import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { publicEnv } from '@/config/env'
import { hasRole, isOrgRole, type OrgRole } from '@/domain/roles'

export const ACTIVE_ORG_COOKIE = 'cobra_org'

export type Organization = {
  id: string
  name: string
  industry: string | null
  country: string
  currency: string
  timezone: string
  contact_email: string | null
  contact_phone: string | null
  billing_frequency: string
  onboarding_step: 'company' | 'first_customer' | 'first_charge' | 'reminders' | 'done'
  onboarded_at: string | null
  is_demo: boolean
}

export type OrgContext = {
  userId: string
  email: string
  org: Organization
  role: OrgRole
  memberships: { orgId: string; name: string; role: OrgRole }[]
}

export class AuthorizationError extends Error {
  constructor(message = 'No tenés permisos para hacer esto.') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/** Usuario autenticado (verificado contra Supabase, no sólo la cookie). */
export const getUser = cache(async () => {
  // Sin Supabase configurado no hay sesión posible (las páginas privadas redirigen).
  if (!publicEnv()) return null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export async function requireUser() {
  const user = await getUser()
  if (!user) redirect('/ingresar')
  return user
}

/**
 * Resuelve la organización activa. La cookie es sólo una PREFERENCIA: siempre
 * se cruza contra organization_members (y RLS lo vuelve a garantizar).
 * Devuelve null si el usuario todavía no tiene empresa.
 */
export const getOrgContext = cache(async (): Promise<OrgContext | null> => {
  const user = await getUser()
  if (!user) return null
  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from('organization_members')
    .select('role, organizations!inner(id, name, industry, country, currency, timezone, contact_email, contact_phone, billing_frequency, onboarding_step, onboarded_at, is_demo)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) throw new Error('No pudimos cargar tus empresas. Probá de nuevo en un momento.')
  if (!rows || rows.length === 0) return null

  const memberships = rows.flatMap((r) => {
    const org = r.organizations as unknown as Organization
    return isOrgRole(r.role) ? [{ org, role: r.role }] : []
  })
  if (memberships.length === 0) return null

  const preferred = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value
  const active = memberships.find((m) => m.org.id === preferred) ?? memberships[0]

  return {
    userId: user.id,
    email: user.email ?? '',
    org: active.org,
    role: active.role,
    memberships: memberships.map((m) => ({ orgId: m.org.id, name: m.org.name, role: m.role })),
  }
})

/** Para páginas: redirige si no hay sesión o empresa; 403 lógico si falta rol. */
export async function requireOrg(minRole: OrgRole = 'viewer'): Promise<OrgContext> {
  await requireUser()
  const ctx = await getOrgContext()
  if (!ctx) redirect('/onboarding')
  // En producción Next oculta los detalles de los errores: redirigimos a una
  // página explícita en vez de lanzar.
  if (!hasRole(ctx.role, minRole)) redirect('/app/sin-permisos')
  return ctx
}

/** Para Server Actions: nunca redirige, devuelve el contexto o lanza. */
export async function authorize(minRole: OrgRole): Promise<OrgContext> {
  const ctx = await getOrgContext()
  if (!ctx) throw new AuthorizationError('Tu sesión venció. Volvé a ingresar.')
  if (!hasRole(ctx.role, minRole)) throw new AuthorizationError()
  return ctx
}
