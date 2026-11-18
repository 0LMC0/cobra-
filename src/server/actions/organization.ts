'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { ACTIVE_ORG_COOKIE, getOrgContext, getUser } from '@/server/auth'
import { isValidTimeZone } from '@/domain/dates'
import { SUPPORTED_CURRENCIES } from '@/domain/money'
import { emailText } from '@/domain/forms'
import type { FormState } from './form-state'

const FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'] as const

const companySchema = z.object({
  name: emailText(2, 120, 'El nombre tiene que tener al menos 2 caracteres.'),
  industry: z.string().trim().max(60).optional().default(''),
  currency: z.enum(SUPPORTED_CURRENCIES as unknown as [string, ...string[]], { errorMap: () => ({ message: 'Elegí una moneda.' }) }),
  timezone: z.string().refine(isValidTimeZone, 'Zona horaria inválida.'),
  contactEmail: z.union([z.literal(''), z.string().trim().toLowerCase().email('Email inválido.').max(254)]).default(''),
  contactPhone: z.string().trim().max(40).regex(/^[\d\s()+-]*$/, 'Usá sólo números, espacios y + - ( ).').default(''),
  billingFrequency: z.enum(FREQUENCIES, { errorMap: () => ({ message: 'Elegí una frecuencia.' }) }),
})

export async function createOrganization(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser()
  if (!user) return { error: 'Tu sesión venció. Volvé a ingresar.' }

  const parsed = companySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }
  const d = parsed.data

  const supabase = await createClient()
  const { data: orgId, error } = await supabase.rpc('create_organization', {
    p_name: d.name,
    p_industry: d.industry,
    p_currency: d.currency,
    p_timezone: d.timezone,
    p_contact_email: d.contactEmail,
    p_contact_phone: d.contactPhone,
    p_billing_frequency: d.billingFrequency,
  })
  if (error || typeof orgId !== 'string') {
    if (error?.message?.includes('org_limit_reached')) return { error: 'Llegaste al máximo de 5 empresas por cuenta.' }
    return { error: 'No pudimos crear la empresa. Probá de nuevo en un momento.' }
  }

  ;(await cookies()).set(ACTIVE_ORG_COOKIE, orgId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 })
  redirect('/onboarding/avisos')
}

/** Cambia la empresa activa, sólo a una de la que el usuario sea miembro. */
export async function switchOrganization(formData: FormData): Promise<void> {
  const target = String(formData.get('orgId') ?? '')
  const ctx = await getOrgContext()
  if (!ctx || !ctx.memberships.some((m) => m.orgId === target)) redirect('/app')
  ;(await cookies()).set(ACTIVE_ORG_COOKIE, target, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 })
  redirect('/app')
}
