import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { publicEnv } from '@/config/env'

const ALLOWED_TYPES: EmailOtpType[] = ['signup', 'recovery', 'email_change', 'invite', 'magiclink', 'email']

/**
 * Destino de los links de email de Supabase (confirmación y recupero).
 * Requiere que la plantilla de email use:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/onboarding
 * También acepta el flujo PKCE (?code=...).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const nextRaw = url.searchParams.get('next') ?? '/app'
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/app'
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
  return NextResponse.redirect(new URL(next, request.url))
}
