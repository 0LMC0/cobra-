import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createOrg, createTestDb, type TestDb } from './harness'

describe('botón de arrepentimiento y de baja', () => {
  let db: TestDb
  let ana: string
  let org: string

  beforeAll(async () => {
    db = await createTestDb()
    ana = await db.createUser('Ana')
    org = await createOrg(db, ana, 'Estudio Ana')
  })
  afterAll(() => db.close())

  it('los pedidos sólo los ve y escribe el servidor', async () => {
    await db.admin(`insert into public.consumer_requests (code, kind, email) values ('CB-ABC123', 'baja', 'a@b.example')`)
    await expect(db.as(null, (q) => q(`select * from public.consumer_requests`))).rejects.toThrow(/permission denied/)
    await expect(db.as(ana, (q) => q(`select * from public.consumer_requests`))).rejects.toThrow(/permission denied/)
    await expect(db.as(null, (q) => q(`insert into public.consumer_requests (code, kind, email) values ('CB-ZZZ999', 'baja', 'x@y.example')`))).rejects.toThrow(/permission denied/)
  })

  it('encuentra las empresas de un dueño por su email, sin importar mayúsculas', async () => {
    const [u] = await db.admin<{ email: string }>(`select email from auth.users where id = $1`, [ana])
    const rows = await db.admin<{ org_id: string }>(`select org_id from public.owner_orgs_by_email($1)`, [u!.email.toUpperCase()])
    expect(rows.map((r) => r.org_id)).toEqual([org])
  })

  it('nadie desde la app puede buscar empresas por email', async () => {
    await expect(db.as(ana, (q) => q(`select * from public.owner_orgs_by_email('x@y.example')`))).rejects.toThrow(/permission denied/)
    await expect(db.as(null, (q) => q(`select * from public.owner_orgs_by_email('x@y.example')`))).rejects.toThrow(/permission denied/)
  })
})
