'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { publicEnv, siteUrl } from '@/config/env'
import type { FormState } from './form-state'

const email = z.string().trim().toLowerCase().email('Ingresá un email válido.').max(254)
const password = z
  .string()
  .min(10, 'Usá al menos 10 caracteres.')
  .max(72, 'Máximo 72 caracteres.')
  .refine((s) => /[a-zA-Z]/.test(s) && /\d/.test(s), 'Combiná letras y números.')

function notConfigured(): FormState {
  return { error: 'El servicio de cuentas todavía no está configurado en este entorno.' }
}

/** Sólo rutas internas, para evitar open redirects. */
function safeNext(raw: FormDataEntryValue | null): string {
  const v = typeof raw === 'string' ? raw : ''
  return v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : '/app'
}

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, 'Decinos cómo te llamás.').max(120),
  email,
  password,
  terms: z.literal('on', { errorMap: () => ({ message: 'Necesitamos que aceptes los términos.' }) }),
})

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  if (!publicEnv()) return notConfigured()
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl()}/auth/confirm?next=/onboarding`,
    },
  })
  if (error) {
    if (error.code === 'weak_password') return { fieldErrors: { password: ['Esa contraseña es demasiado fácil de adivinar.'] } }
    if (error.status === 429) return { error: 'Demasiados intentos. Esperá unos minutos y probá de nuevo.' }
    return { error: 'No pudimos crear la cuenta. Revisá los datos y probá de nuevo.' }
  }
  // Mismo mensaje exista o no el email: no revelamos cuentas registradas.
  redirect(`/verificar-email?email=${encodeURIComponent(parsed.data.email)}`)
}

const signInSchema = z.object({ email, password: z.string().min(1, 'Ingresá tu contraseña.') })

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  if (!publicEnv()) return notConfigured()
  const parsed = signInSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    if (error.code === 'email_not_confirmed') {
      return { error: 'Todavía no confirmaste tu email. Revisá tu bandeja (y spam).' }
    }
    if (error.status === 429) return { error: 'Demasiados intentos. Esperá unos minutos.' }
    return { error: 'Email o contraseña incorrectos.' }
  }
  redirect(safeNext(formData.get('siguiente')))
}

export async function signOut(): Promise<void> {
  if (publicEnv()) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  redirect('/ingresar')
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  if (!publicEnv()) return notConfigured()
  const parsed = z.object({ email }).safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/nueva-clave`,
  })
  if (error?.status === 429) return { error: 'Demasiados intentos. Esperá unos minutos.' }
  // Respuesta idéntica exista o no la cuenta.
  return { ok: 'Si hay una cuenta con ese email, te mandamos un link para crear una contraseña nueva. Vence en 1 hora.' }
}

const newPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Las contraseñas no coinciden.' })

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  if (!publicEnv()) return notConfigured()
  const parsed = newPasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'El link venció. Pedí uno nuevo desde "Olvidé mi contraseña".' }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    if (error.code === 'same_password') return { fieldErrors: { password: ['Tiene que ser distinta de la anterior.'] } }
    return { error: 'No pudimos actualizar la contraseña. Probá de nuevo.' }
  }
  redirect('/app')
}

export async function resendConfirmation(_: FormState, formData: FormData): Promise<FormState> {
  if (!publicEnv()) return notConfigured()
  const parsed = z.object({ email }).safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Falta el email.' }
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: parsed.data.email,
    options: { emailRedirectTo: `${siteUrl()}/auth/confirm?next=/onboarding` },
  })
  if (error?.status === 429) return { error: 'Ya te mandamos uno hace poco. Esperá un minuto.' }
  return { ok: 'Listo, te lo reenviamos.' }
}
