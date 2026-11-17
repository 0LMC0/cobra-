import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createOrg, createTestDb, type TestDb } from './harness'

describe('preferencia del resumen por email', () => {
  let db: TestDb
  let ana: string
  let caro: string
  let beto: string
  let orgA: string

  beforeAll(async () => {
    db = await createTestDb()
    ana = await db.createUser('Ana')
    caro = await db.createUser('Caro')
    beto = await db.createUser('Beto')
    orgA = await createOrg(db, ana, 'Estudio A')
    await db.admin(`insert into public.organization_members (org_id, user_id, role) values ($1, $2, 'viewer')`, [orgA, caro])
  })
  afterAll(() => db.close())

  const freq = (user: string) =>
    db.admin<{ digest_frequency: string }>(`select digest_frequency from public.organization_members where org_id = $1 and user_id = $2`, [orgA, user]).then((r) => r[0]?.digest_frequency)

  it('por defecto es cada 3 días', async () => {
    expect(await freq(ana)).toBe('every_3_days')
  })

  it('cada uno cambia la suya, aunque sea solo lectura, y no toca la de los demás', async () => {
    await db.as(caro, (q) => q(`select public.set_digest_frequency($1, 'daily')`, [orgA]))
    expect(await freq(caro)).toBe('daily')
    expect(await freq(ana)).toBe('every_3_days')
  })

  it('rechaza valores que no existen', async () => {
    await expect(db.as(ana, (q) => q(`select public.set_digest_frequency($1, 'cada_hora')`, [orgA]))).rejects.toThrow(/check constraint/)
  })

  it('un ajeno no puede cambiar la preferencia en otra empresa', async () => {
    await expect(db.as(beto, (q) => q(`select public.set_digest_frequency($1, 'off')`, [orgA]))).rejects.toThrow(/forbidden/)
  })

  it('sin sesión no se puede', async () => {
    await expect(db.as(null, (q) => q(`select public.set_digest_frequency($1, 'off')`, [orgA]))).rejects.toThrow(/permission denied|not_authenticated/)
  })
})
