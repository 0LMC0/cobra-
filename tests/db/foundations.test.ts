import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createOrg, createTestDb, type TestDb } from './harness'

/**
 * Fase 1: aislamiento entre empresas y permisos por rol, probados contra las
 * migraciones reales en una base Postgres embebida.
 */
describe('fundaciones: empresas, miembros y roles', () => {
  let db: TestDb
  let ana: string // dueña de la empresa A
  let beto: string // dueño de la empresa B, ajeno a A
  let caro: string // se suma a A con distintos roles
  let orgA: string
  let orgB: string

  beforeAll(async () => {
    db = await createTestDb()
    ana = await db.createUser('Ana Dueña')
    beto = await db.createUser('Beto Ajeno')
    caro = await db.createUser('Caro Colaboradora')
    orgA = await createOrg(db, ana, 'Estudio A')
    orgB = await createOrg(db, beto, 'Estudio B')
  })
  afterAll(() => db.close())

  const setRole = (role: string) =>
    db.admin(
      `insert into public.organization_members (org_id, user_id, role) values ($1, $2, $3::public.org_role)
       on conflict (org_id, user_id) do update set role = excluded.role`,
      [orgA, caro, role],
    )

  it('al crear un usuario se crea su perfil', async () => {
    const rows = await db.admin(`select full_name from public.profiles where id = $1`, [ana])
    expect(rows).toEqual([{ full_name: 'Ana Dueña' }])
  })

  it('crear la empresa deja a quien la crea como dueña, con auditoría y evento', async () => {
    expect(await db.admin(`select role::text from public.organization_members where org_id = $1`, [orgA])).toEqual([{ role: 'owner' }])
    expect(await db.admin(`select onboarding_step from public.organizations where id = $1`, [orgA])).toEqual([{ onboarding_step: 'first_customer' }])
    expect(await db.admin(`select action from public.audit_logs where org_id = $1`, [orgA])).toEqual([{ action: 'organization.created' }])
    expect(await db.admin(`select name from public.product_events where org_id = $1`, [orgA])).toEqual([{ name: 'org_created' }])
  })

  it('sin sesión no se puede crear una empresa ni leer nada', async () => {
    await expect(
      db.as(null, (q) => q(`select public.create_organization('X', '', 'ARS', 'America/Argentina/Buenos_Aires', '', '', 'monthly')`)),
    ).rejects.toThrow(/permission denied|not_authenticated/)
    expect(await db.as(null, (q) => q(`select id from public.organizations`))).toEqual([])
    expect(await db.as(null, (q) => q(`select org_id from public.organization_members`))).toEqual([])
  })

  describe('aislamiento entre empresas', () => {
    it('cada quien ve sólo su empresa', async () => {
      expect(await db.as(ana, (q) => q(`select name from public.organizations order by name`))).toEqual([{ name: 'Estudio A' }])
      expect(await db.as(beto, (q) => q(`select name from public.organizations order by name`))).toEqual([{ name: 'Estudio B' }])
    })

    it('un ajeno no ve miembros ni auditoría de otra empresa', async () => {
      expect(await db.as(beto, (q) => q(`select user_id from public.organization_members where org_id = $1`, [orgA]))).toEqual([])
      expect(await db.as(beto, (q) => q(`select id from public.audit_logs where org_id = $1`, [orgA]))).toEqual([])
    })

    it('un ajeno no puede editar ni borrar otra empresa', async () => {
      expect(await db.as(beto, (q) => q(`update public.organizations set name = 'Hackeada' where id = $1 returning id`, [orgA]))).toEqual([])
      expect(await db.as(beto, (q) => q(`delete from public.organizations where id = $1 returning id`, [orgA]))).toEqual([])
      expect(await db.admin(`select name from public.organizations where id = $1`, [orgA])).toEqual([{ name: 'Estudio A' }])
    })

    it('un ajeno no puede meterse como miembro de otra empresa', async () => {
      await expect(
        db.as(beto, (q) => q(`insert into public.organization_members (org_id, user_id, role) values ($1, $2, 'admin')`, [orgA, beto])),
      ).rejects.toThrow(/row-level security/)
    })

    it('un ajeno no puede escribir auditoría ni eventos en otra empresa', async () => {
      await expect(
        db.as(beto, (q) => q(`insert into public.audit_logs (org_id, actor_id, action, entity_type) values ($1, $2, 'x', 'y')`, [orgA, beto])),
      ).rejects.toThrow(/row-level security/)
      await expect(
        db.as(beto, (q) => q(`insert into public.product_events (org_id, user_id, name) values ($1, $2, 'intento')`, [orgA, beto])),
      ).rejects.toThrow(/row-level security/)
    })

    it('los perfiles se ven sólo entre quienes comparten empresa', async () => {
      await setRole('viewer')
      const seenByAna = await db.as(ana, (q) => q<{ full_name: string }>(`select full_name from public.profiles order by full_name`))
      expect(seenByAna.map((r) => r.full_name)).toEqual(['Ana Dueña', 'Caro Colaboradora'])
      const seenByBeto = await db.as(beto, (q) => q<{ full_name: string }>(`select full_name from public.profiles`))
      expect(seenByBeto.map((r) => r.full_name)).toEqual(['Beto Ajeno'])
    })
  })

  describe('permisos por rol', () => {
    it('solo lectura: ve la empresa pero no la edita', async () => {
      await setRole('viewer')
      expect(await db.as(caro, (q) => q(`select name from public.organizations`))).toEqual([{ name: 'Estudio A' }])
      expect(await db.as(caro, (q) => q(`update public.organizations set name = 'Otra' where id = $1 returning id`, [orgA]))).toEqual([])
    })

    it('operación: no edita la empresa ni lee la auditoría, pero puede registrar acciones propias', async () => {
      await setRole('operator')
      expect(await db.as(caro, (q) => q(`update public.organizations set name = 'Otra' where id = $1 returning id`, [orgA]))).toEqual([])
      expect(await db.as(caro, (q) => q(`select id from public.audit_logs`))).toEqual([])
      await db.as(caro, (q) => q(`insert into public.audit_logs (org_id, actor_id, action, entity_type) values ($1, $2, 'prueba.accion', 'prueba')`, [orgA, caro]))
      // No puede firmar una acción a nombre de otra persona.
      await expect(
        db.as(caro, (q) => q(`insert into public.audit_logs (org_id, actor_id, action, entity_type) values ($1, $2, 'x', 'y')`, [orgA, ana])),
      ).rejects.toThrow(/row-level security/)
    })

    it('administración: edita la empresa y lee la auditoría, pero no nombra dueños', async () => {
      await setRole('admin')
      expect(await db.as(caro, (q) => q(`update public.organizations set industry = 'Diseño' where id = $1 returning id`, [orgA]))).toHaveLength(1)
      expect((await db.as(caro, (q) => q(`select id from public.audit_logs`))).length).toBeGreaterThan(0)
      await expect(
        db.as(caro, (q) => q(`insert into public.organization_members (org_id, user_id, role) values ($1, $2, 'owner')`, [orgA, beto])),
      ).rejects.toThrow(/row-level security/)
      // Tampoco puede ascenderse a sí misma.
      expect(await db.as(caro, (q) => q(`update public.organization_members set role = 'owner' where org_id = $1 and user_id = $2 returning user_id`, [orgA, caro]))).toEqual([])
      expect(await db.as(caro, (q) => q(`delete from public.organizations where id = $1 returning id`, [orgA]))).toEqual([])
    })

    it('nadie puede modificar ni borrar la auditoría', async () => {
      expect(await db.as(ana, (q) => q(`update public.audit_logs set action = 'borrado' where org_id = $1 returning id`, [orgA]))).toEqual([])
      expect(await db.as(ana, (q) => q(`delete from public.audit_logs where org_id = $1 returning id`, [orgA]))).toEqual([])
    })
  })

  describe('protecciones', () => {
    it('la última dueña no puede irse ni bajarse de rol', async () => {
      await expect(
        db.as(ana, (q) => q(`delete from public.organization_members where org_id = $1 and user_id = $2`, [orgA, ana])),
      ).rejects.toThrow(/last_owner/)
      await expect(
        db.as(ana, (q) => q(`update public.organization_members set role = 'admin' where org_id = $1 and user_id = $2`, [orgA, ana])),
      ).rejects.toThrow(/last_owner/)
    })

    it('con otra dueña nombrada, sí puede bajarse de rol', async () => {
      await db.as(ana, (q) => q(`update public.organization_members set role = 'owner' where org_id = $1 and user_id = $2`, [orgA, caro]))
      const rows = await db.as(ana, (q) => q(`update public.organization_members set role = 'admin' where org_id = $1 and user_id = $2 returning role::text`, [orgA, ana]))
      expect(rows).toEqual([{ role: 'admin' }])
      // Se restaura para no afectar a los demás tests.
      await db.admin(`update public.organization_members set role = 'owner' where org_id = $1 and user_id = $2`, [orgA, ana])
    })

    it('un usuario no puede crear más de 5 empresas', async () => {
      const dora = await db.createUser('Dora Serial')
      for (let i = 1; i <= 5; i += 1) await createOrg(db, dora, `Empresa ${i}`)
      await expect(createOrg(db, dora, 'Empresa 6')).rejects.toThrow(/org_limit_reached/)
    })

    it('rechaza datos inválidos de empresa', async () => {
      await expect(createOrg(db, beto, 'X')).rejects.toThrow(/check constraint/)
    })
  })
})
