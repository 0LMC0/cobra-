'use client'

import { useEffect, useRef } from 'react'

/**
 * Verificación anti-bots de Cloudflare Turnstile (gratis y casi siempre invisible:
 * sólo pide un clic si algo le parece raro). Agrega al formulario el campo
 * "cf-turnstile-response", que Supabase valida en el registro, el login y el
 * recupero de contraseña. Sin NEXT_PUBLIC_TURNSTILE_SITE_KEY no hace nada.
 *
 * El token sirve una sola vez: `resetKey` cambia cuando el formulario volvió con un
 * error, y ahí se pide uno nuevo.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}
declare global {
  interface Window { turnstile?: TurnstileApi }
}

let loading: Promise<void> | null = null
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('No cargó la verificación'))
    document.head.appendChild(s)
  })
  return loading
}

export function Turnstile({ resetKey }: { resetKey?: unknown }) {
  const box = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)

  useEffect(() => {
    if (!SITE_KEY || !box.current) return
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return
        if (widget.current) window.turnstile.reset(widget.current)
        else widget.current = window.turnstile.render(box.current, { sitekey: SITE_KEY, language: 'es', appearance: 'interaction-only', 'response-field-name': 'cf-turnstile-response' })
      })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [resetKey])

  useEffect(() => () => {
    if (widget.current && window.turnstile) window.turnstile.remove(widget.current)
  }, [])

  if (!SITE_KEY) return null
  return <div ref={box} className="min-h-0 empty:hidden" />
}
