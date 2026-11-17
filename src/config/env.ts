import { z } from 'zod'

/**
 * Variables públicas (llegan al navegador). Las secretas viven en
 * `src/config/env.server.ts`, que importa `server-only`.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
})

export type PublicEnv = z.infer<typeof publicSchema>

let cached: PublicEnv | null = null

/** Devuelve el entorno público o null si falta configurar Supabase. */
export function publicEnv(): PublicEnv | null {
  if (cached) return cached
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  })
  if (!parsed.success) return null
  cached = parsed.data
  return cached
}

export function requirePublicEnv(): PublicEnv {
  const env = publicEnv()
  if (!env) {
    throw new Error(
      'Falta configurar Supabase: definí NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (ver .env.example).',
    )
  }
  return env
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}
