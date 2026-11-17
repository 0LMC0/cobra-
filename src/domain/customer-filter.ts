/**
 * Búsqueda y filtros de la lista de clientes. Puro: sin acentos ni mayúsculas,
 * busca en nombre, contacto, email, celular y CUIT.
 */
export type CustomerView = 'todos' | 'deben' | 'atrasados' | 'archivados'

export const CUSTOMER_VIEWS: { value: CustomerView; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'deben', label: 'Deben' },
  { value: 'atrasados', label: 'Atrasados' },
  { value: 'archivados', label: 'Archivados' },
]

export function parseCustomerView(v: string | undefined): CustomerView {
  return CUSTOMER_VIEWS.some((x) => x.value === v) ? (v as CustomerView) : 'todos'
}

/** Normaliza para comparar: "Clínica Núñez" → "clinica nunez". */
export function normalizeSearch(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

export type Searchable = {
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  taxId?: string | null
  owed: unknown[]
  overdueCount: number
}

export function filterCustomers<T extends Searchable>(customers: T[], opts: { q?: string; view: CustomerView }): T[] {
  const q = normalizeSearch(opts.q ?? '').slice(0, 80)
  const digits = q.replace(/\D/g, '')
  return customers.filter((c) => {
    if (opts.view === 'deben' && c.owed.length === 0) return false
    if (opts.view === 'atrasados' && c.overdueCount === 0) return false
    if (!q) return true
    const text = normalizeSearch([c.name, c.contactName, c.email].filter(Boolean).join(' '))
    if (q.split(' ').every((word) => text.includes(word))) return true
    // Celular o CUIT: compara sólo los números ("11 2345" encuentra "11 2345-6789").
    if (digits.length >= 3) {
      const nums = [c.phone, c.taxId].filter(Boolean).map((s) => s!.replace(/\D/g, ''))
      return nums.some((n) => n.includes(digits))
    }
    return false
  })
}
