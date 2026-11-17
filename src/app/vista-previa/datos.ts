import type { ChargeView, CustomerView } from '@/server/queries'

/** Datos de EJEMPLO sólo para la vista previa de desarrollo. Teléfonos con 0000: no son de nadie. */
export const PREVIEW_TODAY = '2026-11-17'

export const PREVIEW_CHARGES: ChargeView[] = [
  { id: 'c1', customerId: 'rivas', concept: 'Cuota de noviembre', amountMinor: 15_000_000, currency: 'ARS', dueDate: '2026-11-10', state: 'open', paidMinor: 0, balanceMinor: 15_000_000, status: 'overdue', promisedFor: null, promisedOn: null, recurring: true },
  { id: 'c2', customerId: 'rivas', concept: 'Diseño de folletos', amountMinor: 9_000_000, currency: 'ARS', dueDate: '2026-11-25', state: 'open', paidMinor: 4_000_000, balanceMinor: 5_000_000, status: 'partially_paid', promisedFor: null, promisedOn: null, recurring: false },
  { id: 'c3', customerId: 'rivas', concept: 'Cuota de octubre', amountMinor: 15_000_000, currency: 'ARS', dueDate: '2026-10-10', state: 'open', paidMinor: 15_000_000, balanceMinor: 0, status: 'paid', promisedFor: null, promisedOn: null, recurring: true },
  { id: 'c4', customerId: 'norte', concept: 'Mantenimiento de noviembre', amountMinor: 32_000_000, currency: 'ARS', dueDate: '2026-11-17', state: 'open', paidMinor: 0, balanceMinor: 32_000_000, status: 'due_soon', promisedFor: null, promisedOn: null, recurring: true },
  { id: 'c5', customerId: 'delta', concept: 'Consultoría', amountMinor: 48_000, currency: 'USD', dueDate: '2026-11-30', state: 'open', paidMinor: 0, balanceMinor: 48_000, status: 'pending', promisedFor: null, promisedOn: null, recurring: false },
]

const base = { contactName: null, email: null, phone: null, whatsappNumber: null, whatsappOk: false, notes: null, optedOut: false }

export const PREVIEW_CUSTOMERS: CustomerView[] = [
  { ...base, id: 'delta', name: 'Grupo Delta', email: 'pagos@grupodelta.example', owed: [{ currency: 'USD', balanceMinor: 48_000 }], overdueCount: 0 },
  { ...base, id: 'norte', name: 'Clínica Norte', phone: '0351 15 000-0002', whatsappNumber: '5493510000002', whatsappOk: true, owed: [{ currency: 'ARS', balanceMinor: 32_000_000 }], overdueCount: 0 },
  { ...base, id: 'rivas', name: 'Estudio Rivas', contactName: 'Marina Pérez', email: 'marina@estudiorivas.example', phone: '11 0000-0001', whatsappNumber: '5491100000001', whatsappOk: true, owed: [{ currency: 'ARS', balanceMinor: 20_000_000 }], overdueCount: 1 },
  { ...base, id: 'sol', name: 'Panadería Sol', email: 'hola@panaderiasol.example', owed: [], overdueCount: 0 },
]
