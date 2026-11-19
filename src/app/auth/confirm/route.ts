import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { publicEnv } from '@/config/env'
import { safeNextPath } from '@/domain/safe-redirect'
import { welcomeEmail } from '@/domain/welcome-email'
import { isTestAddress } from '@/domain/email-address'
import { siteUrl } from '@/config/env'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/server/email/mailer'

/** Bienvenida una sola vez por persona (queda marcada en sus datos de cuenta). Nunca frena el ingreso. */
async function sendWelcome(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email || user.app_metadata?.welcomed_at || isTestAddress(user.email)) return
    const admin = createAdminClient()
    await admin.auth.admin.updateUserById(user.id, { app_metadata: { ...user.app_metadata, welcomed_at: new Date().toISOString() } })
    const firstName = ((user.user_metadata?.full_name as string | undefined) ?? '').split(' ')[0] || null
    await sendEmail({ to: user.email, ...welcomeEmail({ firstName, appUrl: siteUrl() }), replyTo: process.env.OWNER_NOTIFY_EMAIL ?? null, idempotencyKey: `bienvenida-${user.id}` })
  } catch {
    // Si falla el email, la persona entra igual.
  }
}

const ALLOWED_TYPES: EmailOtpType[] = ['signup', 'recovery', 'email_change', 'invite', 'magiclink', 'email']

/**
 * Destino de los links de email de Supabase (confirmación y recupero).
 * Requiere que la plantilla de email use:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding      (confirmar cuenta)
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/nueva-clave (cambiar contraseña)
 * Así el link sirve aunque se abra en otro dispositivo (el flujo ?code= necesita el mismo navegador).
 * También acepta el flujo PKCE (?code=...).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const next = safeNextPath(url.searchParams.get('next'))
  const fail = NextResponse.redirect(new URL('/ingresar?error=link', request.url))

  if (!publicEnv()) return fail
  const supabase = await createClient()

  const code = url.searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    return error ? fail : NextResponse.redirect(new URL(next, request.url))
  }

  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  if (!tokenHash || !type || !ALLOWED_TYPES.includes(type)) return fail

  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
  if (error) return fail
  // Recién confirmó su email al registrarse: bienvenida, una sola vez.
  if (type === 'email' || type === 'signup') await sendWelcome(supabase)
  return NextResponse.redirect(new URL(next, request.url))
}
