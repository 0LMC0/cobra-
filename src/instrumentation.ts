import type { Instrumentation } from 'next'

/**
 * Cada error del servidor (páginas, acciones y rutas) queda en la tabla app_errors,
 * así nos enteramos aunque nadie avise. Nunca rompe la respuesta: si no se puede
 * guardar, sólo queda en los logs de Vercel.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NODE_ENV !== 'production') return
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return
  const e = err as { message?: string; digest?: string; name?: string }
  // Sin consulta (?…): ahí puede haber tokens o datos.
  const path = (request.path ?? '').split('?')[0]!.slice(0, 300)
  try {
    await fetch(`${url}/rest/v1/app_errors`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        path,
        method: request.method?.slice(0, 10) ?? null,
        kind: `${context.routeType}:${e.name ?? 'Error'}`.slice(0, 40),
        message: (e.message ?? '').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]').slice(0, 500),
        digest: e.digest?.slice(0, 80) ?? null,
      }),
    })
  } catch {
    // Sin red o sin base: no hay nada más que hacer.
  }
}
