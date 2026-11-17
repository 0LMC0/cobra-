/** Roles de organización. Espejo de `public.org_role` y `role_rank()` en SQL. */
export type OrgRole = 'viewer' | 'operator' | 'admin' | 'owner'

const RANK: Record<OrgRole, number> = { viewer: 1, operator: 2, admin: 3, owner: 4 }

export function isOrgRole(v: unknown): v is OrgRole {
  return typeof v === 'string' && v in RANK
}

export function hasRole(actual: OrgRole, min: OrgRole): boolean {
  return RANK[actual] >= RANK[min]
}

export const ROLE_LABEL: Record<OrgRole, string> = {
  owner: 'Dueño/a',
  admin: 'Administración',
  operator: 'Operación',
  viewer: 'Solo lectura',
}

/** Qué rol mínimo pide cada acción. Única fuente para UI y servidor. */
export const PERMISSIONS = {
  'org.update': 'admin',
  'org.delete': 'owner',
  'members.invite': 'admin',
  'members.changeRole': 'owner',
  'billing.manage': 'owner',
  'customers.write': 'operator',
  'charges.write': 'operator',
  'charges.cancel': 'admin',
  'payments.record': 'operator',
  'payments.void': 'admin',
  'automations.manage': 'admin',
  'reports.export': 'admin',
  'audit.read': 'admin',
} as const satisfies Record<string, OrgRole>

export type Permission = keyof typeof PERMISSIONS

export function can(role: OrgRole, permission: Permission): boolean {
  return hasRole(role, PERMISSIONS[permission])
}
