import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { publicEnv } from '@/config/env'

const PROTECTED = ['/app', '/onboarding']
const AUTH_ONLY = ['/ingresar', '/registro']

/**
 * Refresca la sesión de Supabase en cada request y hace la primera redirección.
 * NO es la única barrera: cada página y acción vuelve a verificar en el servidor.
 */
export async function middleware(request: NextRequest) {
  const env = publicEnv()
  const path = request.nextUrl.pathname
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))

  if (!env) {
    // Sin Supabase configurado, las rutas privadas no pueden funcionar.
    if (isProtected) return NextResponse.redirect(new URL('/ingresar', request.url))
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options)
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  if (isProtected && !user) {
    const url = new URL('/ingresar', request.url)
    // Con la consulta incluida: p. ej. la vuelta de Mercado Pago trae ?preapproval_id=…
    url.searchParams.set('siguiente', path + request.nextUrl.search)
    return NextResponse.redirect(url)
  }
  if (user && AUTH_ONLY.includes(path)) {
    return NextResponse.redirect(new URL('/app', request.url))
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon|opengraph-image|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)'],
}
