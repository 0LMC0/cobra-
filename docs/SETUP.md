# Instalación y configuración

## Requisitos
- Node 20 o superior (probado con Node 24) y npm.
- Una cuenta de Supabase y un **proyecto nuevo, exclusivo de COBRA**.

## 1. Proyecto local
```bash
npm install
cp .env.example .env.local
```

## 2. Supabase
1. Creá un proyecto en supabase.com, en la región São Paulo por cercanía.
2. En **Project Settings → API**, copiá `Project URL` y `anon public` a `.env.local`.
   - La clave `service_role` va en `SUPABASE_SERVICE_ROLE_KEY`.
   - **Nunca** le pongas el prefijo `NEXT_PUBLIC_`.
3. Aplicá las migraciones de `supabase/migrations/` en orden. Elegí una opción:
   - **SQL Editor:** pegá cada archivo y ejecutalo.
   - **Supabase CLI:** `npx supabase link --project-ref <ref>` y después `npx supabase db push`.
4. Configurá **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` en local, o el dominio real.
   - **Redirect URLs:** `http://localhost:3000/auth/confirm` y `https://<dominio>/auth/confirm`.
5. En **Authentication → Email Templates**, cambiá los links de estas plantillas:
   - **Confirm signup:**
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/onboarding`
   - **Reset password:**
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/nueva-clave`
6. En **Authentication → Providers → Email**, dejá activado *Confirm email*.
7. Para producción, configurá SMTP propio (por ejemplo, Resend). El SMTP de Supabase tiene un límite muy bajo de emails por hora.

## 3. Ejecutar
```bash
npm run dev
```

## Verificaciones
```bash
npm run check
```
Corre, en orden, typecheck, lint, tests y build.

## Despliegue (Vercel)
1. Importá el repositorio en Vercel.
2. Cargá las mismas variables de `.env.local` en *Environment Variables*:
   - `NEXT_PUBLIC_SITE_URL` tiene que ser el dominio real.
   - `NEXT_PUBLIC_LAUNCHED` queda en `false` hasta el lanzamiento.
3. Agregá el dominio de producción a las Redirect URLs de Supabase.
4. **No se despliega a producción sin aprobación explícita** (ver ROADMAP, checklist de lanzamiento).
