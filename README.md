# Cobra+

**Cobrá más. Perseguí menos.** SaaS B2B de cobranzas y abonos recurrentes para pymes. Mercado inicial: Argentina.

## Empezar
Ver [docs/SETUP.md](docs/SETUP.md).

```bash
npm install
npm run dev
npm run check   # typecheck + lint + tests + build
```

## Documentación
| | |
|---|---|
| [PRD](docs/PRD.md) | Qué construimos y para quién |
| [Arquitectura](docs/ARCHITECTURE.md) | Decisiones técnicas, capas, dinero, jobs |
| [Base de datos](docs/DATABASE.md) | Modelo, roles, RLS, integridad financiera |
| [Seguridad](docs/SECURITY.md) | Qué está cubierto y qué no |
| [Sistema de diseño](docs/DESIGN_SYSTEM.md) | Tokens, componentes, voz |
| [Roadmap](docs/ROADMAP.md) | Estado por fase y limitaciones |

## Estructura
```
src/app          rutas (marketing, auth, onboarding, app)
src/components   ui/ (sistema de diseño), app/, marketing/
src/domain       lógica pura y testeada (dinero, fechas, estados, roles)
src/server       auth y Server Actions (validan → autorizan → ejecutan)
src/lib          clientes de Supabase
src/config       entorno y planes
supabase/        migraciones SQL
tests/           unit (Vitest)
```
