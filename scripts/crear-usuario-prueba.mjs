// Crea un usuario de PRUEBA ya confirmado en el proyecto de Supabase de
// .env.local y guarda sus datos en .env.test.local (ignorado por git).
// Uso: node scripts/crear-usuario-prueba.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).trim().replace(/^"|"$/g, '')] }),
)
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const email = `prueba.${randomBytes(3).toString('hex')}@cobraplus.test`
const password = `Prueba${randomBytes(9).toString('base64url')}1`
const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: 'Usuario de Prueba' } })
if (error) { console.error('No se pudo crear:', error.message); process.exit(1) }
writeFileSync('.env.test.local', `# Usuario de prueba (no es una persona real)\nTEST_USER_EMAIL=${email}\nTEST_USER_PASSWORD=${password}\n`)
console.log('Usuario de prueba creado:', email, '· id', data.user.id, '· contraseña guardada en .env.test.local')
