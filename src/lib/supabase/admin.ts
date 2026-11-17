import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { requirePublicEnv } from '@/config/env'

/**
 * Cliente con service role: SALTEA RLS. Uso exclusivo de cron, webhooks y la
 * consola interna. Nunca con datos que vengan del usuario sin autorizar antes.
 */
export function createAdminClient() {
  const env = requirePublicEnv()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY')
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
